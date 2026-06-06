import mongoose, { Schema } from 'mongoose'
import { IMongoConnectedAccount } from '../../../typings/payment'

export { IMongoConnectedAccount }

/**
 * Stripe Connect connected account (future: vendor onboarding, payouts,
 * marketplace transfers). Defined now so Connect can be layered in without a
 * schema migration.
 */
const ConnectedAccountSchema = new Schema<IMongoConnectedAccount>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stripeAccountId: { type: String, required: true },
    onboardingStatus: { type: String, default: 'PENDING' },
    chargesEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    detailsSubmitted: { type: Boolean, default: false },
    // Raw Stripe Account snapshot from the latest account.updated event.
    stripeResponse: { type: Schema.Types.Mixed },
    isDelete: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
    collection: 'connected_accounts',
  },
)

ConnectedAccountSchema.index({ orgId: 1, userId: 1 })
ConnectedAccountSchema.index({ stripeAccountId: 1 }, { unique: true })

export const ConnectedAccount = mongoose.model<IMongoConnectedAccount>(
  'ConnectedAccount',
  ConnectedAccountSchema,
)
