import mongoose, { Schema } from 'mongoose'
import { ISocialMessage } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { ISocialMessage }

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum SocialMediaType {
  INSTAGRAM = 'INSTAGRAM',
  MESSENGER = 'MESSENGER',
  WHATSAPP = 'WHATSAPP',
}

export enum WhatsAppMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

const SocialMessageSchema = new Schema<ISocialMessage>(
  {
    id: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    contactId: { type: Schema.Types.ObjectId, ref: 'SocialContact', required: true },
    messageId: { type: Schema.Types.ObjectId },
    direction: {
      type: String,
      enum: Object.values(MessageDirection),
    },
    socialType: {
      type: String,
      enum: Object.values(SocialMediaType),
    },
    buttons: { type: [String], default: [] },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    type: { type: String },
    body: { type: String },
    caption: { type: String },
    bucketKey: { type: String },
    mimeType: { type: String },
    fileId: { type: String },
    timestamp: { type: Date },
    userType: { type: String },
    filename: { type: String },
    publicUrl: { type: String },
    trackingId: { type: String },
    whatsappMessageId: { type: String },
    messageStatus: {
      type: String,
      enum: Object.values(WhatsAppMessageStatus),
      default: WhatsAppMessageStatus.PENDING,
    },
    errorMessage: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'social_messages',
  }
)

// Pre-save middleware to ensure id and messageId equal _id
SocialMessageSchema.pre('save', function () {
  if (!this.id) {
    this.id = this._id
  }
  if (!this.messageId) {
    this.messageId = this._id
  }
})

// Indexes
SocialMessageSchema.index({ contactId: 1, timestamp: -1 })
SocialMessageSchema.index({ timestamp: -1 })
SocialMessageSchema.index({ messageId: 1 })
SocialMessageSchema.index({ orgId: 1, direction: 1, timestamp: -1 })
SocialMessageSchema.index({ socialType: 1, orgId: 1 })

export const SocialMessage = mongoose.model<ISocialMessage>('SocialMessage', SocialMessageSchema)
