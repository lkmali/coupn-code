import mongoose, { Schema } from 'mongoose'
import { IMongoPayment, PaymentStatus } from '../../../typings/payment'

export { IMongoPayment }

const PaymentSchema = new Schema<IMongoPayment>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentIntentId: { type: String, required: true },
    chargeId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    amountRefunded: { type: Number, default: 0 },
    currency: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },
    // Raw Stripe object snapshot for traceability — never contains card data.
    stripeResponse: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'payments',
  },
)

// One payment record per payment intent (webhooks are idempotent on this key).
PaymentSchema.index({ paymentIntentId: 1 }, { unique: true })
PaymentSchema.index({ orderId: 1 })

export const Payment = mongoose.model<IMongoPayment>('Payment', PaymentSchema)
