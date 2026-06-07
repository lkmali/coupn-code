import { OrderService } from '../../order.service'
import { OrderStatus } from '../../../typings'
import { CopilotTool } from './types'

const orderService = OrderService.Instance

/**
 * Read-only order tools. They delegate to {@link OrderService}, so the same
 * org/owner scoping that protects the REST endpoints applies here too — the
 * copilot can never read another tenant's orders.
 */
export const orderTools: CopilotTool[] = [
  {
    definition: {
      type: 'function',
      function: {
        name: 'list_orders',
        description:
          'List orders for the current organization. Admins see every order in the org; ' +
          'regular users only see their own. Supports an optional status filter and paging.',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: Object.values(OrderStatus),
              description: 'Optional order status filter.',
            },
            pageNumber: { type: 'number', description: 'Page number, 1-based. Defaults to 1.' },
            limit: { type: 'number', description: 'Page size, max 100. Defaults to 10.' },
          },
        },
      },
    },
    handler: async (args, ctx) =>
      orderService.listOrders(String(ctx.user.orgId), ctx.user, {
        status: args?.status,
        pageNumber: args?.pageNumber,
        limit: args?.limit,
      }),
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_order_status',
        description: 'Get the status, amount and currency of a single order owned by the current user.',
        parameters: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: 'The order id (Mongo ObjectId).' },
          },
          required: ['orderId'],
        },
      },
    },
    handler: async (args, ctx) =>
      orderService.getOrderStatus(String(ctx.user.orgId), String(ctx.user.userId), args.orderId),
  },
]
