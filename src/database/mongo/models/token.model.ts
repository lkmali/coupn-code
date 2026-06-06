import mongoose, { Schema } from 'mongoose'
import { IToken } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IToken }

const TokenSchema = new Schema<IToken>(
  {
    id: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    verificationKey: { type: String, required: true, unique: true },
    verifyCode: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    metaData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'tokens',
  }
)

// Pre-save middleware to ensure id equals _id
TokenSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id
  }
})

// Indexes
TokenSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 })

export const Token = mongoose.model<IToken>('Token', TokenSchema)
