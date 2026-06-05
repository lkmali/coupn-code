import mongoose, { Schema } from 'mongoose'
import { IOrganization } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IOrganization }

const OrganizationSchema = new Schema<IOrganization>(
  {
    orgId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    adminMobile: { type: String, required: true },
    adminEmail: { type: String, required: true },
    orgName: { type: String },
    orgShortName: { type: String },
    countryCode: { type: String, default: '+91' },
    description: { type: String },
    isActive: { type: Boolean, default: false, required: true },
    isDelete: { type: Boolean, default: false, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'organizations',
  }
)

// Pre-save middleware to ensure orgId equals _id
OrganizationSchema.pre('save', function () {
  if (!this.orgId) {
    this.orgId = this._id
  }
})

// Indexes matching PostgreSQL
OrganizationSchema.index({ adminMobile: 1 }, { unique: true })
OrganizationSchema.index({ adminEmail: 1 }, { unique: true })
OrganizationSchema.index({ isActive: 1, isDelete: 1 })
OrganizationSchema.index({ orgShortName: 1 })

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema)
