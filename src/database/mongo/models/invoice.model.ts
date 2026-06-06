import mongoose, { Schema } from 'mongoose'
import { IMongoInvoice, InvoiceStatus } from '../../../typings/payment'

export { IMongoInvoice }

/**
 * Local mirror of a Stripe Invoice (subscription billing history), kept in sync
 * by the `invoice.*` webhooks. Amounts are in the smallest currency unit.
 */
const InvoiceSchema = new Schema<IMongoInvoice>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    stripeInvoiceId: { type: String, required: true },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    paymentIntentId: { type: String },
    amountDue: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    currency: { type: String, required: true, lowercase: true },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      required: true,
    },
    hostedInvoiceUrl: { type: String },
    // Raw Stripe object snapshot for traceability.
    stripeResponse: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'invoices',
  },
)

// One record per Stripe invoice (webhooks are idempotent on this key).
InvoiceSchema.index({ stripeInvoiceId: 1 }, { unique: true })
InvoiceSchema.index({ orgId: 1, stripeSubscriptionId: 1 })

export const Invoice = mongoose.model<IMongoInvoice>('Invoice', InvoiceSchema)
