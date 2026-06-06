import { JsonController, Post, Body } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { PaymentService, CheckoutService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import { CreatePaymentIntentDto, CreateCheckoutSessionDto, RefundPaymentDto } from '../dto'

@JsonController('/payments')
export class PaymentController {
  private paymentService = PaymentService.Instance
  private checkoutService = CheckoutService.Instance

  @Post('/create-intent')
  @OpenAPI({
    summary: 'Create a Stripe PaymentIntent for an order',
    tags: ['Payments'],
    description: 'Validates ownership and that the order is unpaid, then creates a PaymentIntent (idempotency key = orderId) and returns the clientSecret for Stripe Elements. The frontend never decides payment success — only webhooks mark an order PAID.',
    responses: {
      '200': { description: 'PaymentIntent created', content: { 'application/json': { example: { success: true, data: { clientSecret: 'pi_3..._secret_...', publishableKey: 'pk_live_...', paymentIntentId: 'pi_3...' } } } } },
      '400': { description: 'Order already paid / Stripe not configured' },
      '404': { description: 'Order not found' },
    },
  })
  async createIntent(@Body() body: CreatePaymentIntentDto, @CurrentUser() user: UserProfile) {
    const data = await this.paymentService.createPaymentIntent(user.orgId, user, body.orderId)
    return { success: true, data }
  }

  @Post('/create-checkout-session')
  @OpenAPI({
    summary: 'Create a Stripe hosted Checkout Session for an order',
    tags: ['Payments'],
    description: 'Validates ownership and that the order is unpaid, then creates a hosted Checkout Session (idempotency key = orderId) and returns the redirect URL. The browser is redirected to Stripe; the order is only marked PAID by the checkout.session.completed webhook — never by the success redirect.',
    responses: {
      '200': { description: 'Checkout Session created', content: { 'application/json': { example: { success: true, data: { url: 'https://checkout.stripe.com/c/pay/cs_test_...', sessionId: 'cs_test_...' } } } } },
      '400': { description: 'Order already paid / Stripe not configured' },
      '404': { description: 'Order not found' },
    },
  })
  async createCheckoutSession(@Body() body: CreateCheckoutSessionDto, @CurrentUser() user: UserProfile) {
    const data = await this.checkoutService.createCheckoutSession(user.orgId, user, body.orderId)
    return { success: true, data }
  }

  @Post('/refund')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Refund a paid order (admin only)',
    tags: ['Payments'],
    description: 'Creates a Stripe refund for the order. Idempotency key = refund_<orderId>. Final state is reconciled by the charge.refunded webhook.',
    responses: {
      '200': { description: 'Refund created', content: { 'application/json': { example: { success: true, data: { orderId: '669960860c8379e64aea586a', status: 'REFUNDED', refundId: 're_3...' } } } } },
      '400': { description: 'Payment not refundable' },
      '403': { description: 'Forbidden — admin only' },
      '404': { description: 'Order not found' },
    },
  })
  async refund(@Body() body: RefundPaymentDto, @CurrentUser() user: UserProfile) {
    const data = await this.paymentService.refund(user.orgId, user, body.orderId)
    return { success: true, data }
  }
}
