import { JsonController, Post, Get, Body, Param } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { SubscriptionService } from '../service'
import { CurrentUser } from '../decorators'
import { UserProfile } from '../typings'
import { CreateSubscriptionCheckoutDto, CancelSubscriptionDto } from '../dto'

/**
 * Recurring subscriptions (Stripe Billing). All routes require JWT auth.
 *
 * Test flow:
 *   1. Create a Product + recurring Price in the org's Stripe dashboard.
 *   2. POST /subscriptions/checkout { priceId } → redirect the browser to `url`.
 *   3. Pay with a test card (4242 4242 4242 4242).
 *   4. Stripe fires customer.subscription.created → the local mirror is filled.
 *   5. GET /subscriptions shows it; POST /subscriptions/:id/cancel cancels it.
 */
@JsonController('/subscriptions')
export class SubscriptionController {
  private subscriptionService = SubscriptionService.Instance

  @Post('/checkout')
  @OpenAPI({
    summary: 'Create a Stripe Checkout Session for a subscription',
    tags: ['Subscriptions'],
    description:
      'Creates a hosted Checkout Session in `subscription` mode for a recurring price (price_…) and returns the redirect URL. The browser is redirected to Stripe; the subscription only becomes active via the customer.subscription.* webhook — never the success redirect. Optionally pass `trialPeriodDays` for a free trial.',
    responses: {
      '200': { description: 'Checkout Session created', content: { 'application/json': { example: { success: true, data: { url: 'https://checkout.stripe.com/c/pay/cs_test_...', sessionId: 'cs_test_...' } } } } },
      '400': { description: 'Stripe not configured / invalid priceId' },
    },
  })
  async createCheckout(@Body() body: CreateSubscriptionCheckoutDto, @CurrentUser() user: UserProfile) {
    const data = await this.subscriptionService.createCheckoutSession(
      user.orgId,
      user,
      body.priceId,
      body.trialPeriodDays,
    )
    return { success: true, data }
  }

  @Get('/plans')
  @OpenAPI({
    summary: 'List the org\'s available subscription plans',
    tags: ['Subscriptions'],
    description:
      'Returns the org\'s active recurring prices (plans) read live from its Stripe account, each with the parent product\'s name/description and the price\'s amount + billing interval. The client renders these and passes the chosen `priceId` to POST /subscriptions/checkout.',
    responses: {
      '200': { description: 'Plan list', content: { 'application/json': { example: { success: true, data: [{ priceId: 'price_123', productName: 'Pro', description: 'Pro plan', amount: 1999, currency: 'usd', interval: 'month', intervalCount: 1 }] } } } },
      '400': { description: 'Stripe not configured' },
    },
  })
  async plans(@CurrentUser() user: UserProfile) {
    const data = await this.subscriptionService.listPlans(user.orgId)
    return { success: true, data }
  }

  @Get()
  @OpenAPI({
    summary: 'List the current user\'s subscriptions',
    tags: ['Subscriptions'],
    description: 'Returns the authenticated user\'s subscriptions (newest first) from the local mirror that is kept in sync by the customer.subscription.* webhooks.',
    responses: {
      '200': { description: 'Subscription list', content: { 'application/json': { example: { success: true, data: [{ stripeSubscriptionId: 'sub_123', status: 'active', priceId: 'price_123', currentPeriodEnd: '2026-07-06T10:00:00.000Z', cancelAtPeriodEnd: false }] } } } },
    },
  })
  async list(@CurrentUser() user: UserProfile) {
    const data = await this.subscriptionService.list(user.orgId, user)
    return { success: true, data }
  }

  @Post('/billing-portal')
  @OpenAPI({
    summary: 'Create a Stripe Customer Portal session',
    tags: ['Subscriptions'],
    description: 'Returns a Stripe Customer Portal URL so the user can manage billing (update card, change/cancel plan, view invoices). Requires at least one existing subscription so the customer id is known.',
    responses: {
      '200': { description: 'Portal session created', content: { 'application/json': { example: { success: true, data: { url: 'https://billing.stripe.com/p/session/...' } } } } },
      '400': { description: 'No Stripe customer found — subscribe first' },
    },
  })
  async billingPortal(@CurrentUser() user: UserProfile) {
    const data = await this.subscriptionService.createBillingPortalSession(user.orgId, user)
    return { success: true, data }
  }

  @Post('/:id/cancel')
  @OpenAPI({
    summary: 'Cancel a subscription',
    tags: ['Subscriptions'],
    description: 'Cancels a subscription the user owns. Defaults to cancel-at-period-end (access kept until the period ends); pass `{ immediately: true }` to cancel now. The local mirror is reconciled by the resulting customer.subscription.* webhook.',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Stripe subscription id', example: 'sub_123' },
    ],
    responses: {
      '200': { description: 'Cancellation requested', content: { 'application/json': { example: { success: true, data: { stripeSubscriptionId: 'sub_123', status: 'active', cancelAtPeriodEnd: true } } } } },
      '404': { description: 'Subscription not found' },
    },
  })
  async cancel(
    @Param('id') id: string,
    @Body() body: CancelSubscriptionDto,
    @CurrentUser() user: UserProfile,
  ) {
    const data = await this.subscriptionService.cancel(user.orgId, user, id, body.immediately)
    return { success: true, data }
  }
}
