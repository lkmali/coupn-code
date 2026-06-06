import mongoose, { Schema } from 'mongoose'
import { IUser } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IUser }

const UserSchema = new Schema<IUser>(
  {
    userId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    roles: { type: [String], required: true, default: ['PATIENT'] },
    mobileNumber: { type: String, required: true },
    countryCode: { type: String, default: '+91' },
    userName: { type: String },
    email: { type: String },
    isVerified: { type: Boolean, default: false },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isMainAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false, required: true },
    isDelete: { type: Boolean, default: false, required: true },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    exotel: {
      type: {
        sipId: { type: String, required: true },
        sipSecret: { type: String, required: true },
        exotelUserId: { type: String },
        registeredAt: { type: Date },
        isAvailable: { type: Boolean },
        availabilityUpdatedAt: { type: Date },
      },
      _id: false,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
)

// Pre-save middleware to ensure userId equals _id
UserSchema.pre('save', function () {
  if (!this.userId) {
    this.userId = this._id
  }
})

// Indexes matching PostgreSQL
UserSchema.index({ mobileNumber: 1, orgId: 1 })
UserSchema.index({ orgId: 1, isActive: 1, isDelete: 1 })
UserSchema.index({ orgId: 1, roles: 1 })
UserSchema.index({ roles: 1 })
UserSchema.index({ email: 1 })
UserSchema.index({ createdBy: 1 })

export const User = mongoose.model<IUser>('User', UserSchema)
