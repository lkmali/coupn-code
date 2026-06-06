import mongoose, { Schema } from 'mongoose'
import { IMongoOrder, OrderStatus } from '../../../typings/order'

export { IMongoOrder }

const OrderSchema = new Schema<IMongoOrder>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    amount: { type: Number, required: true, min: 0 }, // computed on the server
    currency: { type: String, required: true, default: 'usd', lowercase: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      required: true,
    },
    paymentIntentId: { type: String },
    checkoutSessionId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isDelete: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
)

OrderSchema.index({ orgId: 1, userId: 1 })
// A payment intent maps to exactly one order; sparse so PENDING orders (no intent
// yet) don't collide on a null key.
OrderSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true })
// A Checkout Session maps to exactly one order; sparse so non-checkout orders
// (no session) don't collide on a null key.
OrderSchema.index({ checkoutSessionId: 1 }, { unique: true, sparse: true })

export const Order = mongoose.model<IMongoOrder>('Order', OrderSchema)
