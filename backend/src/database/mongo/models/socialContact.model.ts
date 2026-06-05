import mongoose, { Schema } from 'mongoose'
import { ISocialContact } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { ISocialContact }

export enum SocialMediaType {
  INSTAGRAM = 'INSTAGRAM',
  MESSENGER = 'MESSENGER',
  WHATSAPP = 'WHATSAPP',
}

const SocialContactSchema = new Schema<ISocialContact>(
  {
    contactId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    socialId: { type: String, required: true },
    name: { type: String },
    mobileNumber: { type: String },
    emailId: { type: String },
    socialType: {
      type: String,
      enum: Object.values(SocialMediaType),
    },
    lastSeen: { type: Date },
    language: { type: String },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    phoneNumberId: { type: String },
    isBlocked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'social_contacts',
  }
)

// Pre-save middleware to ensure contactId equals _id
SocialContactSchema.pre('save', function () {
  console.log("SocialContactSchema",this)
  if (!this.contactId) {
    this.contactId = this._id
  }
})

// Indexes
SocialContactSchema.index({ socialId: 1, orgId: 1 }, { unique: true })
SocialContactSchema.index({ mobileNumber: 1, orgId: 1 })
SocialContactSchema.index({ orgId: 1, socialType: 1 })
SocialContactSchema.index({ emailId: 1 })
SocialContactSchema.index({ lastSeen: -1 })

export const SocialContact = mongoose.model<ISocialContact>('SocialContact', SocialContactSchema)
