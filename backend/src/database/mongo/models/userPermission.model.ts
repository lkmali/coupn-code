import mongoose, { Schema } from 'mongoose'
import { IUserPermission } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IUserPermission }

const UserPermissionSchema = new Schema<IUserPermission>(
  {
    userPermissionId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permissionIds: { type: [Schema.Types.ObjectId], ref: 'Permission', default: [] },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'user_permissions',
  }
)

// Pre-save middleware to ensure userPermissionId equals _id
UserPermissionSchema.pre('save', function () {
  if (!this.userPermissionId) {
    this.userPermissionId = this._id
  }
})

// Indexes
UserPermissionSchema.index({ userId: 1, orgId: 1 }, { unique: true })
UserPermissionSchema.index({ orgId: 1 })

export const UserPermission = mongoose.model<IUserPermission>('UserPermission', UserPermissionSchema)
