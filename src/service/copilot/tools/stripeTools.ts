import { SubscriptionService } from '../../stripe'
import { CopilotTool } from './types'

const subscriptionService = SubscriptionService.Instance

/**
 * Read-only Stripe/billing tools. Limited to listing the org's subscription
 * plans and the current user's subscriptions — no mutations (no charges,
 * refunds or cancellations) are exposed to the copilot.
 */
export const stripeTools: CopilotTool[] = [
  {
    definition: {
      type: 'function',
      function: {
        name: 'list_subscription_plans',
        description: 'List the subscription plans the current organization offers (price, currency, interval).',
        parameters: { type: 'object', properties: {} },
      },
    },
    handler: async (_args, ctx) => subscriptionService.listPlans(String(ctx.user.orgId)),
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'list_my_subscriptions',
        description: "List the current user's subscriptions and their status.",
        parameters: { type: 'object', properties: {} },
      },
    },
    handler: async (_args, ctx) => subscriptionService.list(String(ctx.user.orgId), ctx.user),
  },
]
