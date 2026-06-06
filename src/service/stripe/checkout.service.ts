import { isNil } from 'lodash'
import {
  MongoOrderRepository,
  MongoProductRepository,
  toObjectId,
} from '../../database'
import { LoggerProvider } from '../../provider/logger.provider'
import { badRequest } from '../../utils'
import { envConfig } from '../../config'
import { OrderStatus, UserProfile, AuditAction } from '../../typings'
import { StripeClientService } from './stripeClient.service'
import { StripeConfigService } from './stripeConfig.service'
import { OrderService } from '../order.service'
import { AuditLogService } from '../auditLog.service'

const loggerProvider = LoggerProvider.Instance

/**
 * Stripe Checkout (hosted page) flow.
 *
 * Unlike the PaymentIntent/Elements flow (where the card is collected on our own
 * page), this creates a Stripe-hosted Checkout Session and returns its URL. The
 * frontend redirects the browser to that URL; Stripe handles card entry, 3DS,
 * Apple/Google Pay, etc. The order is only marked PAID by the
 * `checkout.session.completed` webhook (see PaymentService) — never by the
 * success redirect.
 *
 * Multi-tenant: the Stripe account, keys and currency all come from the org's
 * own (decrypted) configuration, keyed by orgId.
 */
export class CheckoutService {
  private static instance: CheckoutService
  private readonly orderRepo = new MongoOrderRepository()
  private readonly productRepo = new MongoProductRepository()
  private readonly stripeClientService = StripeClientService.Instance
  private readonly stripeConfigService = StripeConfigService.Instance
  private readonly orderService = OrderService.Instance
  private readonly auditLogService = AuditLogService.Instance

  /**
   * Create (or idempotently re-create) a hosted Checkout Session for an order.
   * The idempotency key is the orderId so retries never create duplicate
   * sessions/charges.
   */
  async createCheckoutSession(
    orgId: string,
    userProfile: UserProfile,
    orderId: string,
  ): Promise<{ url: string; sessionId: string }> {
    try {
      const order = await this.orderService.getOwnedOrderOrThrow(orgId, userProfile.userId, orderId)

      if (order.status === OrderStatus.PAID) {
        throw badRequest('Order is already paid')
      }
      if (order.status === OrderStatus.REFUNDED) {
        throw badRequest('Order has been refunded')
      }

      // Ensures Stripe is enabled & configured for this org (throws otherwise).
      await this.stripeConfigService.getEnabledConfigOrThrow(orgId)
      const stripe = await this.stripeClientService.getClient(orgId)

      // A human-friendly line-item name for the hosted page. Falls back to a
      // generic label if the product is missing (orders keep amount/currency
      // regardless, which is what actually gets charged).
      const product = order.productId
        ? await this.productRepo.findOne({ _id: toObjectId(order.productId), isDelete: false })
        : null
      const productName = product?.name ?? 'Order payment'

      const baseUrl = (envConfig.SERVER_UI_URL || envConfig.WEBSITE_URL).replace(/\/$/, '')

      const session = await stripe.checkout.sessions.create(
        {
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: order.currency,
                product_data: { name: productName },
                unit_amount: order.amount,
              },
              quantity: 1,
            },
          ],
          // Echoed back on the session and propagated to the PaymentIntent so
          // either webhook can resolve the order.
          client_reference_id: String(order._id),
          metadata: {
            orderId: String(order._id),
            userId: String(userProfile.userId),
            orgId: String(orgId),
          },
          payment_intent_data: {
            metadata: {
              orderId: String(order._id),
              userId: String(userProfile.userId),
              orgId: String(orgId),
            },
          },
          success_url: `${baseUrl}/payments?checkout=success&order_id=${String(order._id)}`,
          cancel_url: `${baseUrl}/payments?checkout=cancel&order_id=${String(order._id)}`,
        },
        { idempotencyKey: `checkout_${String(order._id)}` },
      )

      await this.orderRepo.updateOne(
        { _id: toObjectId(order._id), status: { $nin: [OrderStatus.PAID, OrderStatus.REFUNDED] } },
        { checkoutSessionId: session.id, status: OrderStatus.PROCESSING },
      )

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.CHECKOUT_SESSION_CREATED,
        resourceType: 'Order',
        resourceId: String(order._id),
        payload: { sessionId: session.id, amount: order.amount, currency: order.currency },
      })

      if (!session.url) {
        throw badRequest('Stripe did not return a Checkout URL')
      }

      return { url: session.url, sessionId: session.id }
    } catch (error: any) {
      loggerProvider.logger.error('createCheckoutSession_Error', {
        error: error.message,
        stack: error.stack,
        orgId,
        orderId,
      })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
