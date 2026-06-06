import mongoose, { Schema } from 'mongoose'
import { IMongoPayout, PayoutStatus } from '../../../typings/payment'

export { IMongoPayout }

/**
 * Local mirror of a Stripe Payout (funds moving from Stripe to a bank /
 * connected account), kept in sync by the `payout.*` webhooks. Amounts are in
 * the smallest currency unit.
 */
const PayoutSchema = new Schema<IMongoPayout>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    stripePayoutId: { type: String, required: true },
    stripeAccountId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      required: true,
    },
    arrivalDate: { type: Date },
    failureCode: { type: String },
    failureMessage: { type: String },
    // Raw Stripe object snapshot for traceability.
    stripeResponse: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'payouts',
  },
)

// One record per Stripe payout (webhooks are idempotent on this key).
PayoutSchema.index({ stripePayoutId: 1 }, { unique: true })
PayoutSchema.index({ orgId: 1 })

export const Payout = mongoose.model<IMongoPayout>('Payout', PayoutSchema)
