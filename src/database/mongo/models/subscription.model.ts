import mongoose, { Schema } from 'mongoose'
import { IMongoSubscription, SubscriptionStatus } from '../../../typings/payment'

export { IMongoSubscription }

/**
 * Local mirror of a Stripe Subscription, kept in sync by the
 * `customer.subscription.*` webhooks. Status mirrors Stripe verbatim.
 */
const SubscriptionSchema = new Schema<IMongoSubscription>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    stripeSubscriptionId: { type: String, required: true },
    stripeCustomerId: { type: String },
    priceId: { type: String },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      required: true,
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    // Raw Stripe object snapshot for traceability.
    stripeResponse: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'subscriptions',
  },
)

// One record per Stripe subscription (webhooks are idempotent on this key).
SubscriptionSchema.index({ stripeSubscriptionId: 1 }, { unique: true })
SubscriptionSchema.index({ orgId: 1, stripeCustomerId: 1 })

export const Subscription = mongoose.model<IMongoSubscription>('Subscription', SubscriptionSchema)
