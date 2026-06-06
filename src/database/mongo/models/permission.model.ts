import mongoose, { Schema } from 'mongoose'
import { IPermission } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IPermission }

const PermissionSchema = new Schema<IPermission>(
  {
    permissionId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'permissions',
  }
)

// Pre-save middleware to ensure permissionId equals _id
PermissionSchema.pre('save', function () {
  if (!this.permissionId) {
    this.permissionId = this._id
  }
})

// Indexes
PermissionSchema.index({ category: 1 })
PermissionSchema.index({ isActive: 1, isDelete: 1 })

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema)
