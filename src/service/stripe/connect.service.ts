import { isNil } from 'lodash'
import {
  MongoConnectedAccountRepository,
  MongoPayoutRepository,
  toObjectId,
} from '../../database'
import { LoggerProvider } from '../../provider/logger.provider'
import {
  AuditAction,
  PayoutStatus,
  StripeAccount,
  StripePayout,
  IMongoPayout,
} from '../../typings'
import { AuditLogService } from '../auditLog.service'

const loggerProvider = LoggerProvider.Instance

/** Stripe sends arrival_date as unix seconds; convert to Date (or undefined). */
function unixToDate(seconds?: number | null): Date | undefined {
  return seconds ? new Date(seconds * 1000) : undefined
}

/**
 * Stripe Connect reconciliation: connected-account capability changes
 * (`account.updated`) and payout lifecycle (`payout.paid` / `payout.failed`).
 *
 * Payout events are delivered on behalf of the connected account, so the
 * account id arrives as `event.account` (not on the payout object) and is
 * threaded in by the dispatcher.
 */
export class ConnectService {
  private static instance: ConnectService
  private readonly connectedAccountRepo = new MongoConnectedAccountRepository()
  private readonly payoutRepo = new MongoPayoutRepository()
  private readonly auditLogService = AuditLogService.Instance

  /**
   * Handle `account.updated` — sync charge/payout capabilities onto the local
   * connected-account row. The row is created during onboarding; if the event
   * arrives before that, there is nothing to update yet (logged, not an error).
   */
  async handleAccountUpdated(orgId: string, account: StripeAccount): Promise<void> {
    const updated = await this.connectedAccountRepo.updateOne(
      { orgId: toObjectId(orgId), stripeAccountId: account.id },
      {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        onboardingStatus: account.details_submitted ? 'COMPLETED' : 'PENDING',
        stripeResponse: account as unknown as Record<string, unknown>,
      },
    )

    if (!updated) {
      loggerProvider.logger.warn('stripe_connected_account_not_found', { orgId, accountId: account.id })
    }

    await this.auditLogService.log({
      orgId,
      action: AuditAction.ACCOUNT_UPDATED,
      resourceType: 'ConnectedAccount',
      resourceId: account.id,
      payload: {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      },
    })
  }

  /** Handle `payout.paid` — payout has landed in the destination bank account. */
  async handlePayoutPaid(
    orgId: string,
    payout: StripePayout,
    connectedAccountId?: string,
  ): Promise<void> {
    await this.upsertPayout(orgId, payout, PayoutStatus.PAID, connectedAccountId)
    await this.auditLogService.log({
      orgId,
      action: AuditAction.PAYOUT_PAID,
      resourceType: 'Payout',
      resourceId: payout.id,
      payload: { amount: payout.amount, currency: payout.currency, accountId: connectedAccountId },
    })
  }

  /** Handle `payout.failed` — payout was rejected (e.g. closed bank account). */
  async handlePayoutFailed(
    orgId: string,
    payout: StripePayout,
    connectedAccountId?: string,
  ): Promise<void> {
    await this.upsertPayout(orgId, payout, PayoutStatus.FAILED, connectedAccountId)
    await this.auditLogService.log({
      orgId,
      action: AuditAction.PAYOUT_FAILED,
      resourceType: 'Payout',
      resourceId: payout.id,
      payload: {
        amount: payout.amount,
        currency: payout.currency,
        accountId: connectedAccountId,
        failureCode: payout.failure_code,
        failureMessage: payout.failure_message,
      },
    })
  }

  private async upsertPayout(
    orgId: string,
    payout: StripePayout,
    status: PayoutStatus,
    connectedAccountId?: string,
  ): Promise<void> {
    const data: Partial<IMongoPayout> = {
      orgId: toObjectId(orgId),
      stripePayoutId: payout.id,
      stripeAccountId: connectedAccountId,
      amount: payout.amount,
      currency: payout.currency,
      status,
      arrivalDate: unixToDate(payout.arrival_date),
      failureCode: payout.failure_code ?? undefined,
      failureMessage: payout.failure_message ?? undefined,
      stripeResponse: payout as unknown as Record<string, unknown>,
    }

    await this.payoutRepo.upsertByPayoutId(payout.id, data)
    loggerProvider.logger.info('stripe_payout_synced', { orgId, payoutId: payout.id, status })
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
