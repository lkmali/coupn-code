import { isNil } from 'lodash'
import {
  MongoOrderRepository,
  MongoPaymentRepository,
  MongoProductRepository,
  toObjectId,
} from '../database'
import { LoggerProvider } from '../provider/logger.provider'
import { notFoundData } from '../utils'
import {
  IMongoOrder,
  OrderStatus,
  UserProfile,
  AuditAction,
  Role,
  IOrderListResult,
} from '../typings'
import { ProductService } from './product.service'
import { AuditLogService } from './auditLog.service'

const loggerProvider = LoggerProvider.Instance

export class OrderService {
  private static instance: OrderService
  private readonly repo = new MongoOrderRepository()
  private readonly paymentRepo = new MongoPaymentRepository()
  private readonly productRepo = new MongoProductRepository()
  private readonly productService = ProductService.Instance
  private readonly auditLogService = AuditLogService.Instance

  /**
   * Create a PENDING order. The amount is computed from the server-side product
   * price — the client only supplies the productId.
   */
  async createOrder(
    orgId: string,
    userProfile: UserProfile,
    input: { productId: string; metadata?: Record<string, unknown> },
  ): Promise<{ orderId: string; amount: number; currency: string; status: OrderStatus }> {
    try {
      const product = await this.productService.getActiveProductOrThrow(orgId, input.productId)

      const order = await this.repo.save({
        orgId: toObjectId(orgId),
        userId: toObjectId(userProfile.userId),
        productId: toObjectId(product._id),
        amount: product.amount, // computed on the server — never from the client
        currency: product.currency,
        status: OrderStatus.PENDING,
        metadata: input.metadata,
        isDelete: false,
      })

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.ORDER_CREATED,
        resourceType: 'Order',
        resourceId: String(order._id),
        payload: { amount: order.amount, currency: order.currency, productId: input.productId },
      })

      return {
        orderId: String(order._id),
        amount: order.amount,
        currency: order.currency,
        status: order.status,
      }
    } catch (error: any) {
      loggerProvider.logger.error('createOrder_Error', { error: error.message, stack: error.stack, orgId })
      throw error
    }
  }

  /** Load an order scoped to its owner; throws 404 otherwise. */
  async getOwnedOrderOrThrow(orgId: string, userId: string, orderId: string): Promise<IMongoOrder> {
    const order = await this.repo.findOne({
      _id: toObjectId(orderId),
      orgId: toObjectId(orgId),
      userId: toObjectId(userId),
      isDelete: false,
    })
    if (!order) throw notFoundData('Order not found')
    return order
  }

  async getOrderStatus(
    orgId: string,
    userId: string,
    orderId: string,
  ): Promise<{ id: string; status: OrderStatus; amount: number; currency: string }> {
    const order = await this.getOwnedOrderOrThrow(orgId, userId, orderId)
    return { id: String(order._id), status: order.status, amount: order.amount, currency: order.currency }
  }

  /**
   * Paginated order list with each order's reconciled payment record joined in.
   * Admins see every order in the org; regular users only see their own.
   */
  async listOrders(
    orgId: string,
    user: UserProfile,
    query: { pageNumber?: number; limit?: number; status?: OrderStatus } = {},
  ): Promise<IOrderListResult> {
    try {
      const pageNumber = Math.max(1, Number(query.pageNumber) || 1)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 10))
      const isAdmin = (user.roles ?? []).includes(Role.ADMIN)

      const filter: Record<string, unknown> = { orgId: toObjectId(orgId), isDelete: false }
      // Non-admins are scoped to their own orders; admins see the whole org.
      if (!isAdmin) filter.userId = toObjectId(user.userId)
      if (query.status) filter.status = query.status

      const [orders, total] = await Promise.all([
        this.repo.find(filter, { sort: { createdAt: -1 }, skip: (pageNumber - 1) * limit, limit }),
        this.repo.count(filter),
      ])

      if (orders.length === 0) return { items: [], total, pageNumber, limit }

      const orderIds = orders.map((o) => toObjectId(o._id))
      const productIds = orders.filter((o) => o.productId).map((o) => toObjectId(o.productId))

      const [payments, products] = await Promise.all([
        this.paymentRepo.find({ orgId: toObjectId(orgId), orderId: { $in: orderIds } }),
        productIds.length ? this.productRepo.find({ _id: { $in: productIds } }) : Promise.resolve([]),
      ])

      const paymentByOrder = new Map(payments.map((p) => [String(p.orderId), p]))
      const productById = new Map(products.map((p) => [String(p._id), p]))

      const items = orders.map((o) => {
        const payment = paymentByOrder.get(String(o._id))
        const product = o.productId ? productById.get(String(o.productId)) : undefined
        return {
          orderId: String(o._id),
          amount: o.amount,
          currency: o.currency,
          status: o.status,
          productName: product?.name,
          paymentIntentId: o.paymentIntentId,
          createdAt: o.createdAt,
          payment: payment
            ? {
                status: payment.status,
                amount: payment.amount,
                amountRefunded: payment.amountRefunded ?? 0,
                currency: payment.currency,
                chargeId: payment.chargeId,
                paymentIntentId: payment.paymentIntentId,
              }
            : null,
        }
      })

      return { items, total, pageNumber, limit }
    } catch (error: any) {
      loggerProvider.logger.error('listOrders_Error', { error: error.message, stack: error.stack, orgId })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
