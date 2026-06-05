import mongoose, { Schema } from 'mongoose'
import { IPassword } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IPassword }

const PasswordSchema = new Schema<IPassword>(
  {
    id: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    password: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'passwords',
  }
)

// Pre-save middleware to ensure id equals _id
PasswordSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id
  }
})

// Indexes
PasswordSchema.index({ userId: 1 }, { unique: false })

export const Password = mongoose.model<IPassword>('Password', PasswordSchema)
