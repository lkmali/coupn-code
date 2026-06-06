import { JsonController, Post, Get, Body, Param, QueryParam } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { OrderService } from '../service'
import { CurrentUser } from '../decorators'
import { UserProfile, OrderStatus } from '../typings'
import { CreateOrderDto } from '../dto'

/**
 * Orders. Amounts are always computed server-side from the product price; the
 * client only supplies a productId. All routes require JWT authentication.
 */
@JsonController('/orders')
export class OrderController {
  private orderService = OrderService.Instance

  @Post()
  @OpenAPI({
    summary: 'Create an order',
    tags: ['Payments'],
    description: 'Creates a PENDING order for the authenticated user. The amount is calculated on the server from the product price — the client-supplied amount is never trusted.',
    responses: {
      '200': {
        description: 'Order created',
        content: { 'application/json': { example: { success: true, data: { orderId: '669960860c8379e64aea586a', amount: 1999, currency: 'usd', status: 'PENDING' } } } },
      },
      '404': { description: 'Product not found' },
    },
  })
  async createOrder(@Body() body: CreateOrderDto, @CurrentUser() user: UserProfile) {
    const data = await this.orderService.createOrder(user.orgId, user, body)
    return { success: true, data }
  }

  @Get()
  @OpenAPI({
    summary: 'List orders with payment info',
    tags: ['Payments'],
    description: 'Paginated list of orders, each joined with its reconciled payment record. Admins see every order in the org; regular users only see their own. Optional `status` filter and `pageNumber`/`limit` paging.',
    responses: {
      '200': {
        description: 'Order list',
        content: { 'application/json': { example: { success: true, data: { items: [{ orderId: '669960860c8379e64aea586a', amount: 1999, currency: 'usd', status: 'PAID', productName: 'Pro plan', createdAt: '2026-06-06T10:00:00.000Z', payment: { status: 'SUCCEEDED', amount: 1999, amountRefunded: 0, currency: 'usd', paymentIntentId: 'pi_3...' } }], total: 1, pageNumber: 1, limit: 10 } } } },
      },
    },
  })
  async listOrders(
    @CurrentUser() user: UserProfile,
    @QueryParam('pageNumber') pageNumber?: number,
    @QueryParam('limit') limit?: number,
    @QueryParam('status') status?: OrderStatus,
  ) {
    const data = await this.orderService.listOrders(user.orgId, user, { pageNumber, limit, status })
    return { success: true, data }
  }

  @Get('/:id')
  @OpenAPI({
    summary: 'Get order status',
    tags: ['Payments'],
    description: 'Returns the status of an order owned by the authenticated user.',
    responses: {
      '200': { description: 'Order status', content: { 'application/json': { example: { success: true, data: { id: '669960860c8379e64aea586a', status: 'PAID', amount: 1999, currency: 'usd' } } } } },
      '404': { description: 'Order not found' },
    },
  })
  async getOrder(@Param('id') id: string, @CurrentUser() user: UserProfile) {
    const data = await this.orderService.getOrderStatus(user.orgId, user.userId, id)
    return { success: true, data }
  }
}
