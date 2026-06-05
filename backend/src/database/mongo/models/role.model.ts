import mongoose, { Schema } from 'mongoose'
import { IRole } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IRole }

const RoleSchema = new Schema<IRole>(
  {
    roleId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    roleKey: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'roles',
  }
)

// Pre-save middleware to ensure roleId equals _id
RoleSchema.pre('save', function () {
  if (!this.roleId) {
    this.roleId = this._id
  }
})

// Indexes
RoleSchema.index({ roleKey: 1 })
RoleSchema.index({ isActive: 1, isDelete: 1 })

export const Role = mongoose.model<IRole>('Role', RoleSchema)
