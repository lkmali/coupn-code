import { isNil } from 'lodash'
import {
  MongoOrderRepository,
  MongoPaymentRepository,
  toObjectId,
} from '../../database'
import { LoggerProvider } from '../../provider/logger.provider'
import { badRequest, notFoundData } from '../../utils'
import {
  OrderStatus,
  PaymentStatus,
  UserProfile,
  AuditAction,
  IMongoOrder,
  StripeEvent,
  StripePaymentIntent,
  StripeCharge,
  StripeCheckoutSession,
  StripeSubscription,
  StripeInvoice,
  StripePayout,
  StripeAccount,
} from '../../typings'
import { StripeClientService } from './stripeClient.service'
import { StripeConfigService } from './stripeConfig.service'
import { SubscriptionService } from './subscription.service'
import { InvoiceService } from './invoice.service'
import { ConnectService } from './connect.service'
import { OrderService } from '../order.service'
import { AuditLogService } from '../auditLog.service'

const loggerProvider = LoggerProvider.Instance

export interface WebhookRequestContext {
  ipAddress?: string
  userAgent?: string
}

export class PaymentService {
  private static instance: PaymentService
  private readonly orderRepo = new MongoOrderRepository()
  private readonly paymentRepo = new MongoPaymentRepository()
  private readonly stripeClientService = StripeClientService.Instance
  private readonly stripeConfigService = StripeConfigService.Instance
  private readonly orderService = OrderService.Instance
  private readonly auditLogService = AuditLogService.Instance
  private readonly subscriptionService = SubscriptionService.Instance
  private readonly invoiceService = InvoiceService.Instance
  private readonly connectService = ConnectService.Instance

  // ============================ Create Payment Intent ============================

  /**
   * Create (or idempotently re-create) a PaymentIntent for an order. The
   * idempotency key is the orderId, so retries never produce duplicate charges.
   */
  async createPaymentIntent(
    orgId: string,
    userProfile: UserProfile,
    orderId: string,
  ): Promise<{ clientSecret: string; publishableKey?: string; paymentIntentId: string }> {
    try {
      const order = await this.orderService.getOwnedOrderOrThrow(orgId, userProfile.userId, orderId)

      if (order.status === OrderStatus.PAID) {
        throw badRequest('Order is already paid')
      }
      if (order.status === OrderStatus.REFUNDED) {
        throw badRequest('Order has been refunded')
      }

      const config = await this.stripeConfigService.getEnabledConfigOrThrow(orgId)
      const stripe = await this.stripeClientService.getClient(orgId)

      const intent = await stripe.paymentIntents.create(
        {
          amount: order.amount,
          currency: order.currency,
          metadata: {
            orderId: String(order._id),
            userId: String(userProfile.userId),
            orgId: String(orgId),
          },
          automatic_payment_methods: { enabled: true },
        },
        { idempotencyKey: `order_${String(order._id)}` },
      )

      await this.orderRepo.updateOne(
        { _id: toObjectId(order._id), status: { $nin: [OrderStatus.PAID, OrderStatus.REFUNDED] } },
        { paymentIntentId: intent.id, status: OrderStatus.PROCESSING },
      )

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.PAYMENT_INTENT_CREATED,
        resourceType: 'Order',
        resourceId: String(order._id),
        payload: { paymentIntentId: intent.id, amount: order.amount, currency: order.currency },
      })

      return {
        clientSecret: intent.client_secret as string,
        publishableKey: config.publishableKey,
        paymentIntentId: intent.id,
      }
    } catch (error: any) {
      loggerProvider.logger.error('createPaymentIntent_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
        orderId,
      })
      throw error
    }
  }

  // ================================== Refund ==================================

  /** Admin-only: refund a paid order. */
  async refund(
    orgId: string,
    userProfile: UserProfile,
    orderId: string,
  ): Promise<{ orderId: string; status: PaymentStatus; refundId: string }> {
    try {
      const order = await this.orderRepo.findOne({
        _id: toObjectId(orderId),
        orgId: toObjectId(orgId),
        isDelete: false,
      })
      if (!order) throw notFoundData('Order not found')

      const payment = await this.paymentRepo.findOne({
        orderId: toObjectId(orderId),
        orgId: toObjectId(orgId),
      })
      if (!payment || !payment.paymentIntentId) {
        throw badRequest('No completed payment found for this order')
      }
      if (payment.status !== PaymentStatus.SUCCEEDED) {
        throw badRequest('Payment is not in a refundable state')
      }

      const stripe = await this.stripeClientService.getClient(orgId)
      const refund = await stripe.refunds.create(
        { payment_intent: payment.paymentIntentId },
        { idempotencyKey: `refund_${orderId}` },
      )

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.REFUND_CREATED,
        resourceType: 'Order',
        resourceId: orderId,
        payload: { refundId: refund.id, paymentIntentId: payment.paymentIntentId },
      })

      // The charge.refunded webhook finalizes order/payment state; this is the
      // optimistic local update so the UI reflects it immediately.
      return { orderId, status: PaymentStatus.REFUNDED, refundId: refund.id }
    } catch (error: any) {
      loggerProvider.logger.error('refund_Error', { error: error.message, stack: error.stack, orgId, orderId })
      throw error
    }
  }

  // ============================== Webhook handling ==============================

  /**
   * Process a verified Stripe event (signature already checked by the webhook
   * auth strategy). All handlers are idempotent so Stripe's at-least-once
   * delivery is safe.
   */
  async processWebhookEvent(
    orgId: string,
    event: StripeEvent,
    ctx: WebhookRequestContext = {},
  ): Promise<void> {
    await this.auditLogService.log({
      orgId,
      action: AuditAction.WEBHOOK_RECEIVED,
      resourceType: 'StripeWebhook',
      resourceId: event.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      payload: { type: event.type },
    })

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(orgId, event.data.object as StripePaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(orgId, event.data.object as StripePaymentIntent)
        break
      case 'charge.refunded':
        await this.handleChargeRefunded(orgId, event.data.object as StripeCharge)
        break
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(orgId, event.data.object as StripeCheckoutSession)
        break

      // ----- Subscriptions (recurring billing) -----
      case 'customer.subscription.created':
        await this.subscriptionService.handleSubscriptionUpsert(
          orgId,
          event.data.object as StripeSubscription,
          AuditAction.SUBSCRIPTION_CREATED,
        )
        break
      case 'customer.subscription.updated':
        await this.subscriptionService.handleSubscriptionUpsert(
          orgId,
          event.data.object as StripeSubscription,
          AuditAction.SUBSCRIPTION_UPDATED,
        )
        break
      case 'customer.subscription.deleted':
        await this.subscriptionService.handleSubscriptionDeleted(
          orgId,
          event.data.object as StripeSubscription,
        )
        break

      // ----- Invoices (subscription billing history) -----
      case 'invoice.paid':
        await this.invoiceService.handleInvoicePaid(orgId, event.data.object as StripeInvoice)
        break
      case 'invoice.payment_failed':
        await this.invoiceService.handleInvoicePaymentFailed(orgId, event.data.object as StripeInvoice)
        break

      // ----- Stripe Connect (connected accounts & payouts) -----
      // Connect events are delivered on behalf of the connected account, so its
      // id arrives as `event.account` rather than on the resource object.
      case 'account.updated':
        await this.connectService.handleAccountUpdated(orgId, event.data.object as StripeAccount)
        break
      case 'payout.paid':
        await this.connectService.handlePayoutPaid(
          orgId,
          event.data.object as StripePayout,
          (event as any).account,
        )
        break
      case 'payout.failed':
        await this.connectService.handlePayoutFailed(
          orgId,
          event.data.object as StripePayout,
          (event as any).account,
        )
        break

      default:
        loggerProvider.logger.info('stripe_webhook_unhandled', { orgId, type: event.type })
    }

    await this.auditLogService.log({
      orgId,
      action: AuditAction.WEBHOOK_PROCESSED,
      resourceType: 'StripeWebhook',
      resourceId: event.id,
      payload: { type: event.type },
    })
  }

  private async findOrderByIntent(orgId: string, paymentIntentId: string): Promise<IMongoOrder | null> {
    return this.orderRepo.findOne({ orgId: toObjectId(orgId), paymentIntentId })
  }

  private async handlePaymentSucceeded(orgId: string, intent: StripePaymentIntent): Promise<void> {
    const order = await this.findOrderByIntent(orgId, intent.id)
    if (!order) {
      loggerProvider.logger.warn('stripe_webhook_order_not_found', { orgId, paymentIntentId: intent.id })
      return
    }
    const chargeId =
      typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id

    // Only mark PAID. Guard against overwriting a REFUNDED order.
    await this.orderRepo.updateOne(
      { _id: toObjectId(order._id), status: { $ne: OrderStatus.REFUNDED } },
      { status: OrderStatus.PAID },
    )

    await this.paymentRepo.upsertByPaymentIntent(intent.id, {
      orgId: toObjectId(orgId),
      orderId: toObjectId(order._id),
      paymentIntentId: intent.id,
      chargeId,
      amount: intent.amount_received || intent.amount,
      currency: intent.currency,
      status: PaymentStatus.SUCCEEDED,
      // Persist the complete Stripe PaymentIntent for reconciliation/audit, not
      // just a cherry-picked subset. Stripe never returns raw PAN/CVV, so the
      // full object is safe to store.
      stripeResponse: intent as unknown as Record<string, unknown>,
    })

    await this.auditLogService.log({
      orgId,
      action: AuditAction.PAYMENT_SUCCEEDED,
      resourceType: 'Order',
      resourceId: String(order._id),
      payload: { paymentIntentId: intent.id, amount: intent.amount },
    })
  }

  private async handlePaymentFailed(orgId: string, intent: StripePaymentIntent): Promise<void> {
    const order = await this.findOrderByIntent(orgId, intent.id)
    if (!order) {
      loggerProvider.logger.warn('stripe_webhook_order_not_found', { orgId, paymentIntentId: intent.id })
      return
    }
    await this.orderRepo.updateOne(
      { _id: toObjectId(order._id), status: { $nin: [OrderStatus.PAID, OrderStatus.REFUNDED] } },
      { status: OrderStatus.FAILED },
    )

    await this.paymentRepo.upsertByPaymentIntent(intent.id, {
      orgId: toObjectId(orgId),
      orderId: toObjectId(order._id),
      paymentIntentId: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: PaymentStatus.FAILED,
      // Persist the complete Stripe PaymentIntent (includes last_payment_error
      // and everything else) for reconciliation/audit.
      stripeResponse: intent as unknown as Record<string, unknown>,
    })

    await this.auditLogService.log({
      orgId,
      action: AuditAction.PAYMENT_FAILED,
      resourceType: 'Order',
      resourceId: String(order._id),
      payload: { paymentIntentId: intent.id, reason: intent.last_payment_error?.message },
    })
  }

  private async handleChargeRefunded(orgId: string, charge: StripeCharge): Promise<void> {
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
    if (!paymentIntentId) return

    const order = await this.findOrderByIntent(orgId, paymentIntentId)
    if (!order) {
      loggerProvider.logger.warn('stripe_webhook_order_not_found', { orgId, paymentIntentId })
      return
    }

    await this.orderRepo.updateOne({ _id: toObjectId(order._id) }, { status: OrderStatus.REFUNDED })

    await this.paymentRepo.upsertByPaymentIntent(paymentIntentId, {
      orgId: toObjectId(orgId),
      orderId: toObjectId(order._id),
      paymentIntentId,
      chargeId: charge.id,
      amount: charge.amount,
      amountRefunded: charge.amount_refunded,
      currency: charge.currency,
      status: PaymentStatus.REFUNDED,
      // Persist the complete Stripe Charge (includes refunds, balance txns,
      // payment_method_details, etc.) for reconciliation/audit.
      stripeResponse: charge as unknown as Record<string, unknown>,
    })

    await this.auditLogService.log({
      orgId,
      action: AuditAction.REFUND_COMPLETED,
      resourceType: 'Order',
      resourceId: String(order._id),
      payload: { paymentIntentId, amountRefunded: charge.amount_refunded },
    })
  }

  /**
   * Hosted Checkout completion. The session carries the orderId (metadata /
   * client_reference_id) and, once paid, the resolved PaymentIntent. We stamp the
   * intent onto the order so the PaymentIntent webhooks reconcile too, mark the
   * order PAID and upsert the payment record. Idempotent on re-delivery.
   */
  private async handleCheckoutSessionCompleted(
    orgId: string,
    session: StripeCheckoutSession,
  ): Promise<void> {
    // Subscription checkouts don't map to an order — the subscription itself is
    // reconciled by the customer.subscription.* webhooks. Nothing to do here.
    if (session.mode === 'subscription') {
      loggerProvider.logger.info('stripe_checkout_subscription_completed', {
        orgId,
        sessionId: session.id,
        subscription:
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
      })
      return
    }

    // For mode: 'payment', only act once Stripe reports the session as paid.
    if (session.payment_status !== 'paid') {
      loggerProvider.logger.info('stripe_checkout_session_unpaid', {
        orgId,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      })
      return
    }

    const orderId = session.client_reference_id || (session.metadata?.orderId as string | undefined)
    const order = orderId
      ? await this.orderRepo.findOne({ _id: toObjectId(orderId), orgId: toObjectId(orgId) })
      : await this.orderRepo.findOne({ orgId: toObjectId(orgId), checkoutSessionId: session.id })

    if (!order) {
      loggerProvider.logger.warn('stripe_checkout_order_not_found', { orgId, sessionId: session.id })
      return
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    if (!paymentIntentId) {
      loggerProvider.logger.warn('stripe_checkout_no_payment_intent', { orgId, sessionId: session.id })
      return
    }

    // Stamp the intent + mark PAID. Guard against overwriting a REFUNDED order.
    await this.orderRepo.updateOne(
      { _id: toObjectId(order._id), status: { $ne: OrderStatus.REFUNDED } },
      { paymentIntentId, checkoutSessionId: session.id, status: OrderStatus.PAID },
    )

    await this.paymentRepo.upsertByPaymentIntent(paymentIntentId, {
      orgId: toObjectId(orgId),
      orderId: toObjectId(order._id),
      paymentIntentId,
      amount: session.amount_total ?? order.amount,
      currency: session.currency ?? order.currency,
      status: PaymentStatus.SUCCEEDED,
      stripeResponse: session as unknown as Record<string, unknown>,
    })

    await this.auditLogService.log({
      orgId,
      action: AuditAction.PAYMENT_SUCCEEDED,
      resourceType: 'Order',
      resourceId: String(order._id),
      payload: { sessionId: session.id, paymentIntentId, amount: session.amount_total },
    })
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
