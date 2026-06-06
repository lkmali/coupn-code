import mongoose, { Schema } from 'mongoose'
import { IMongoAuditLog } from '../../../typings/payment'

export { IMongoAuditLog }

/**
 * Append-only audit trail for payment-sensitive actions. `payload` must never
 * contain card data, CVV or full Stripe secrets (callers redact before writing).
 */
const AuditLogSchema = new Schema<IMongoAuditLog>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    payload: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  },
)

AuditLogSchema.index({ orgId: 1, createdAt: -1 })
AuditLogSchema.index({ resourceType: 1, resourceId: 1 })

export const AuditLog = mongoose.model<IMongoAuditLog>('AuditLog', AuditLogSchema)
