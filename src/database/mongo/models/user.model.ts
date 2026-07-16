import mongoose, { Schema } from 'mongoose'
import { IUser } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IUser }

const UserSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    upiId: { type: String, required: true },
    machineIds: { type: [String], default: [] },
    fingerprints: { type: [String], default: [] },
    isDelete: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: true,
    collection: 'users',
  }
)

// mobileNumber is the real identity: one person, one record, however many
// devices they show up on. Partial filter keeps soft-deleted rows from
// blocking a re-register with the same number.
UserSchema.index(
  { mobileNumber: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } }
)
UserSchema.index({ machineIds: 1 })
UserSchema.index({ fingerprints: 1 })

export const User = mongoose.model<IUser>('User', UserSchema)
