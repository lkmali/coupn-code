import mongoose, { Schema } from 'mongoose'
import { IMongoProduct } from '../../../typings/payment'

export { IMongoProduct }

/**
 * Minimal server-side price source. Order amounts are computed from a Product
 * (never trusted from the client). Org-scoped so each tenant has its own catalog.
 */
const ProductSchema = new Schema<IMongoProduct>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true, min: 0 }, // smallest currency unit
    currency: { type: String, required: true, default: 'usd', lowercase: true },
    isActive: { type: Boolean, default: true, required: true },
    isDelete: { type: Boolean, default: false, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'products',
  },
)

ProductSchema.index({ orgId: 1, isDelete: 1 })

export const Product = mongoose.model<IMongoProduct>('Product', ProductSchema)
