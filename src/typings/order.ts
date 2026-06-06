import mongoose, { Document } from 'mongoose'
import type { PaymentStatus } from './payment'

/**
 * Order domain typings. An order is the server-side source of truth for an
 * amount: it is always computed from the product price, never trusted from the
 * client. Payment reconciliation lives in `./payment`.
 */

// ==================== Enums ====================

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// ==================== Order ====================

export interface IMongoOrder extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  productId?: mongoose.Types.ObjectId
  amount: number // smallest currency unit, computed on the server
  currency: string
  status: OrderStatus
  paymentIntentId?: string
  checkoutSessionId?: string // set when paid via the hosted Checkout flow
  metadata?: Record<string, unknown>
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Flattened order + payment view returned by the admin "Orders" list. Combines
 * an order's status with its reconciled payment record (null until a webhook
 * creates one).
 */
export interface IOrderListItem {
  orderId: string
  amount: number
  currency: string
  status: OrderStatus
  productName?: string
  paymentIntentId?: string
  createdAt: Date
  payment: {
    status: PaymentStatus
    amount: number
    amountRefunded: number
    currency: string
    chargeId?: string
    paymentIntentId: string
  } | null
}

export interface IOrderListResult {
  items: IOrderListItem[]
  total: number
  pageNumber: number
  limit: number
}
