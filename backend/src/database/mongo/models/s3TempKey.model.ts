import mongoose, { Schema } from 'mongoose'
import { IS3TempKey } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IS3TempKey }

const S3TempKeySchema = new Schema<IS3TempKey>(
  {
    id: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    s3Key: { type: String, required: true },
    s3PublicUrl: { type: String },
    s3Bucket: { type: String },
    metaData: { type: Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date },
    isDelete: { type: Boolean, default: false },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 's3_temp_keys',
  }
)

// Pre-save middleware to ensure id equals _id
S3TempKeySchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id
  }
})

// Indexes
S3TempKeySchema.index({ orgId: 1, isDelete: 1 })
S3TempKeySchema.index({ s3Key: 1 })
S3TempKeySchema.index({ expiresAt: 1 })

export const S3TempKey = mongoose.model<IS3TempKey>('S3TempKey', S3TempKeySchema)
