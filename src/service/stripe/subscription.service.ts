import { isNil } from 'lodash'
import { MongoSubscriptionRepository, toObjectId } from '../../database'
import { LoggerProvider } from '../../provider/logger.provider'
import { badRequest, notFoundData } from '../../utils'
import { envConfig } from '../../config'
import {
  AuditAction,
  SubscriptionStatus,
  StripeSubscription,
  IMongoSubscription,
  UserProfile,
} from '../../typings'
import { AuditLogService } from '../auditLog.service'
import { StripeClientService } from './stripeClient.service'
import { StripeConfigService } from './stripeConfig.service'

const loggerProvider = LoggerProvider.Instance

/** Stripe sends period boundaries as unix seconds; convert to Date (or undefined). */
function unixToDate(seconds?: number | null): Date | undefined {
  return seconds ? new Date(seconds * 1000) : undefined
}

/**
 * Recurring subscriptions (Stripe Billing).
 *
 * Two halves:
 *  • Create side — `createCheckoutSession` (mode: 'subscription'), `list`,
 *    `cancel` and `createBillingPortalSession`. These are driven by the
 *    authenticated user from the API.
 *  • Reconcile side — `handleSubscription*` upserts the local mirror from the
 *    `customer.subscription.*` webhooks. orgId comes from the verified webhook
 *    URL. All writes are idempotent upserts keyed on the Stripe subscription id,
 *    so Stripe's at-least-once delivery is safe.
 *
 * Multi-tenant: the Stripe account/keys come from the org's own (decrypted)
 * configuration, keyed by orgId.
 */
export class SubscriptionService {
  private static instance: SubscriptionService
  private readonly subscriptionRepo = new MongoSubscriptionRepository()
  private readonly auditLogService = AuditLogService.Instance
  private readonly stripeClientService = StripeClientService.Instance
  private readonly stripeConfigService = StripeConfigService.Instance

  // ============================ Create side (API) ============================

  /**
   * List the org's available subscription plans for the subscriber page.
   *
   * Preferred source is the admin-curated `subscriptionProducts` list in the
   * org's Stripe configuration — the admin decides exactly which plans (and how
   * they read) appear. When that list is empty we fall back to reading every
   * active recurring price live from the org's Stripe account, so orgs that
   * never curated a list keep working. The client picks one and passes its
   * `priceId` to `createCheckoutSession`.
   */
  async listPlans(orgId: string): Promise<
    Array<{
      priceId: string
      productName: string
      description?: string
      amount: number | null
      currency: string
      interval?: string
      intervalCount?: number
      featured?: boolean
    }>
  > {
    try {
      const config = await this.stripeConfigService.getEnabledConfigOrThrow(orgId)

      // Admin-curated plans take precedence — render straight from config, no
      // live Stripe round-trip. Inactive plans are hidden from the page.
      const curated = (config.subscriptionProducts ?? []).filter(p => p.isActive !== false)
      if (curated.length > 0) {
        return curated.map(p => ({
          priceId: p.priceId,
          productName: p.name,
          description: p.description,
          amount: p.amount ?? null,
          currency: (p.currency ?? config.defaultCurrency ?? 'usd').toLowerCase(),
          interval: p.interval,
          intervalCount: p.intervalCount,
          featured: p.featured,
        }))
      }

      const stripe = await this.stripeClientService.getClient(orgId)

      const prices = await stripe.prices.list({
        active: true,
        type: 'recurring',
        expand: ['data.product'],
        limit: 100,
      })

      return prices.data
        // Drop prices whose product was archived/deleted in Stripe.
        .filter(price => {
          const product = price.product as any
          return product && typeof product === 'object' && product.active !== false
        })
        .map(price => {
          const product = price.product as any
          return {
            priceId: price.id,
            productName: product?.name ?? 'Plan',
            description: product?.description ?? undefined,
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring?.interval,
            intervalCount: price.recurring?.interval_count,
          }
        })
    } catch (error: any) {
      loggerProvider.logger.error('listSubscriptionPlans_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  /**
   * Create a hosted Checkout Session in `subscription` mode for a recurring
   * price. Stripe creates the Customer and the Subscription; we link them back
   * to our user via `subscription_data.metadata` so the
   * `customer.subscription.*` webhooks can resolve the owner.
   *
   * The subscription only becomes ACTIVE via webhooks — never the success
   * redirect. Idempotency key = `sub_checkout_<userId>_<priceId>` so a double
   * click reuses the same session rather than creating duplicates.
   */
  async createCheckoutSession(
    orgId: string,
    userProfile: UserProfile,
    priceId: string,
    trialPeriodDays?: number,
  ): Promise<{ url: string; sessionId: string }> {
    try {
      await this.stripeConfigService.getEnabledConfigOrThrow(orgId)
      const stripe = await this.stripeClientService.getClient(orgId)

      const baseUrl = (envConfig.SERVER_UI_URL || envConfig.WEBSITE_URL).replace(/\/$/, '')
      const metadata = {
        userId: String(userProfile.userId),
        orgId: String(orgId),
      }

      // Reuse an existing customer when we already know one for this user, so the
      // customer's subscriptions/invoices stay under one record. Otherwise let
      // Stripe create one, pre-filling the email.
      const customerId = await this.existingCustomerId(orgId, userProfile)

      const session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          ...(customerId ? { customer: customerId } : { customer_email: userProfile.email }),
          client_reference_id: String(userProfile.userId),
          metadata,
          // Propagated onto the Subscription so the webhook mirror links to the user.
          subscription_data: {
            metadata,
            ...(trialPeriodDays ? { trial_period_days: trialPeriodDays } : {}),
          },
          success_url: `${baseUrl}/payments?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payments?subscription=cancel`,
        },
        { idempotencyKey: `sub_checkout_${String(userProfile.userId)}_${priceId}` },
      )

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.CHECKOUT_SESSION_CREATED,
        resourceType: 'Subscription',
        resourceId: session.id,
        payload: { sessionId: session.id, priceId, mode: 'subscription' },
      })

      if (!session.url) {
        throw badRequest('Stripe did not return a Checkout URL')
      }
      return { url: session.url, sessionId: session.id }
    } catch (error: any) {
      loggerProvider.logger.error('createSubscriptionCheckout_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
        priceId,
      })
      throw error
    }
  }

  /** The authenticated user's subscriptions (newest first), from the local mirror. */
  async list(orgId: string, userProfile: UserProfile): Promise<IMongoSubscription[]> {
    const subs = await this.subscriptionRepo.find({
      orgId: toObjectId(orgId),
      userId: toObjectId(userProfile.userId),
    })
    return subs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  /**
   * Cancel a subscription the user owns. Defaults to cancel-at-period-end (the
   * user keeps access until the period ends); `immediately` cancels now. The
   * local mirror is reconciled by the resulting `customer.subscription.*`
   * webhook — this returns the optimistic Stripe result.
   */
  async cancel(
    orgId: string,
    userProfile: UserProfile,
    stripeSubscriptionId: string,
    immediately = false,
  ): Promise<{ stripeSubscriptionId: string; status: string; cancelAtPeriodEnd: boolean }> {
    try {
      // Ownership check against the local mirror before touching Stripe.
      const owned = await this.subscriptionRepo.findOne({
        orgId: toObjectId(orgId),
        userId: toObjectId(userProfile.userId),
        stripeSubscriptionId,
      })
      if (!owned) throw notFoundData('Subscription not found')

      const stripe = await this.stripeClientService.getClient(orgId)
      const sub = immediately
        ? await stripe.subscriptions.cancel(stripeSubscriptionId)
        : await stripe.subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true })

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.SUBSCRIPTION_UPDATED,
        resourceType: 'Subscription',
        resourceId: stripeSubscriptionId,
        payload: { canceled: true, immediately },
      })

      return {
        stripeSubscriptionId,
        status: sub.status,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end ?? immediately,
      }
    } catch (error: any) {
      loggerProvider.logger.error('cancelSubscription_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
        stripeSubscriptionId,
      })
      throw error
    }
  }

  /**
   * Create a Stripe Customer Portal session so the user can manage their own
   * billing (update card, change/cancel plan, view invoices). Requires that the
   * user already has at least one subscription (so we know their customer id).
   */
  async createBillingPortalSession(
    orgId: string,
    userProfile: UserProfile,
  ): Promise<{ url: string }> {
    try {
      const customerId = await this.existingCustomerId(orgId, userProfile)
      if (!customerId) {
        throw badRequest('No Stripe customer found for this user — subscribe first')
      }

      const stripe = await this.stripeClientService.getClient(orgId)
      const baseUrl = (envConfig.SERVER_UI_URL || envConfig.WEBSITE_URL).replace(/\/$/, '')
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/payments`,
      })
      return { url: portal.url }
    } catch (error: any) {
      loggerProvider.logger.error('billingPortal_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
      })
      throw error
    }
  }

  /** Most recent known Stripe customer id for this user, from the mirror. */
  private async existingCustomerId(
    orgId: string,
    userProfile: UserProfile,
  ): Promise<string | undefined> {
    const subs = await this.subscriptionRepo.find({
      orgId: toObjectId(orgId),
      userId: toObjectId(userProfile.userId),
    })
    const withCustomer = subs
      .filter(s => s.stripeCustomerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return withCustomer[0]?.stripeCustomerId
  }

  // ========================= Reconcile side (webhooks) =========================

  /**
   * Handle `customer.subscription.created` and `customer.subscription.updated`.
   * Both map to the same upsert — the only difference is the audit action.
   */
  async handleSubscriptionUpsert(
    orgId: string,
    sub: StripeSubscription,
    action: AuditAction.SUBSCRIPTION_CREATED | AuditAction.SUBSCRIPTION_UPDATED,
  ): Promise<void> {
    await this.upsert(orgId, sub, sub.status as SubscriptionStatus)
    await this.auditLogService.log({
      orgId,
      userId: this.userIdFromMetadata(sub),
      action,
      resourceType: 'Subscription',
      resourceId: sub.id,
      payload: { status: sub.status, customerId: this.customerId(sub) },
    })
  }

  /** Handle `customer.subscription.deleted` — mark the local mirror canceled. */
  async handleSubscriptionDeleted(orgId: string, sub: StripeSubscription): Promise<void> {
    await this.upsert(orgId, sub, SubscriptionStatus.CANCELED)
    await this.auditLogService.log({
      orgId,
      userId: this.userIdFromMetadata(sub),
      action: AuditAction.SUBSCRIPTION_DELETED,
      resourceType: 'Subscription',
      resourceId: sub.id,
      payload: { customerId: this.customerId(sub) },
    })
  }

  private async upsert(
    orgId: string,
    sub: StripeSubscription,
    status: SubscriptionStatus | string,
  ): Promise<void> {
    const userId = this.userIdFromMetadata(sub)
    const data: Partial<IMongoSubscription> = {
      orgId: toObjectId(orgId),
      stripeSubscriptionId: sub.id,
      stripeCustomerId: this.customerId(sub),
      priceId: (sub as any).items?.data?.[0]?.price?.id,
      status,
      currentPeriodStart: unixToDate((sub as any).current_period_start),
      currentPeriodEnd: unixToDate((sub as any).current_period_end),
      cancelAtPeriodEnd: (sub as any).cancel_at_period_end ?? false,
      canceledAt: unixToDate((sub as any).canceled_at),
      stripeResponse: sub as unknown as Record<string, unknown>,
    }
    if (userId) data.userId = toObjectId(userId)

    await this.subscriptionRepo.upsertBySubscriptionId(sub.id, data)
    loggerProvider.logger.info('stripe_subscription_synced', { orgId, subscriptionId: sub.id, status })
  }

  private customerId(sub: StripeSubscription): string | undefined {
    return typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  }

  private userIdFromMetadata(sub: StripeSubscription): string | undefined {
    return (sub.metadata?.userId as string | undefined) || undefined
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
