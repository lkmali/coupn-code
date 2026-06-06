import { isNil } from 'lodash'
import { MongoInvoiceRepository, toObjectId } from '../../database'
import { LoggerProvider } from '../../provider/logger.provider'
import { AuditAction, InvoiceStatus, StripeInvoice, IMongoInvoice } from '../../typings'
import { AuditLogService } from '../auditLog.service'

const loggerProvider = LoggerProvider.Instance

/**
 * Reconciles Stripe Invoice state from `invoice.*` webhooks (subscription
 * billing history). Multi-tenant: orgId comes from the verified webhook URL.
 * All writes are idempotent upserts keyed on the Stripe invoice id.
 */
export class InvoiceService {
  private static instance: InvoiceService
  private readonly invoiceRepo = new MongoInvoiceRepository()
  private readonly auditLogService = AuditLogService.Instance

  /** Handle `invoice.paid` — record a successful recurring charge. */
  async handleInvoicePaid(orgId: string, invoice: StripeInvoice): Promise<void> {
    await this.upsert(orgId, invoice, InvoiceStatus.PAID)
    await this.auditLogService.log({
      orgId,
      action: AuditAction.INVOICE_PAID,
      resourceType: 'Invoice',
      resourceId: invoice.id,
      payload: {
        subscriptionId: this.subscriptionId(invoice),
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
      },
    })
  }

  /** Handle `invoice.payment_failed` — record a failed recurring charge. */
  async handleInvoicePaymentFailed(orgId: string, invoice: StripeInvoice): Promise<void> {
    // Stripe keeps the invoice `open` on a failed attempt; persist its reported
    // status rather than forcing one, so dunning/retry state stays accurate.
    await this.upsert(orgId, invoice, (invoice.status as InvoiceStatus) ?? InvoiceStatus.OPEN)
    await this.auditLogService.log({
      orgId,
      action: AuditAction.INVOICE_PAYMENT_FAILED,
      resourceType: 'Invoice',
      resourceId: invoice.id,
      payload: {
        subscriptionId: this.subscriptionId(invoice),
        amountDue: invoice.amount_due,
        currency: invoice.currency,
      },
    })
  }

  private async upsert(
    orgId: string,
    invoice: StripeInvoice,
    status: InvoiceStatus | string,
  ): Promise<void> {
    const data: Partial<IMongoInvoice> = {
      orgId: toObjectId(orgId),
      stripeInvoiceId: invoice.id,
      stripeCustomerId:
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id,
      stripeSubscriptionId: this.subscriptionId(invoice),
      paymentIntentId: this.paymentIntentId(invoice),
      amountDue: invoice.amount_due ?? 0,
      amountPaid: invoice.amount_paid ?? 0,
      currency: invoice.currency,
      status,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
      stripeResponse: invoice as unknown as Record<string, unknown>,
    }

    await this.invoiceRepo.upsertByInvoiceId(invoice.id, data)
    loggerProvider.logger.info('stripe_invoice_synced', { orgId, invoiceId: invoice.id, status })
  }

  private subscriptionId(invoice: StripeInvoice): string | undefined {
    const sub = (invoice as any).subscription
    return typeof sub === 'string' ? sub : sub?.id
  }

  private paymentIntentId(invoice: StripeInvoice): string | undefined {
    const pi = (invoice as any).payment_intent
    return typeof pi === 'string' ? pi : pi?.id
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
