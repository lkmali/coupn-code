import mongoose, { Schema } from 'mongoose'
import { IRolePermission } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IRolePermission }

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    rolePermissionId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    permissionIds: { type: [Schema.Types.ObjectId], ref: 'Permission', default: [] },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'role_permissions',
  }
)

// Pre-save middleware to ensure rolePermissionId equals _id
RolePermissionSchema.pre('save', function () {
  if (!this.rolePermissionId) {
    this.rolePermissionId = this._id
  }
})

// Indexes
RolePermissionSchema.index({ roleId: 1, orgId: 1 }, { unique: true })
RolePermissionSchema.index({ orgId: 1 })

export const RolePermission = mongoose.model<IRolePermission>('RolePermission', RolePermissionSchema)
