import mongoose, { Schema } from 'mongoose'
import { IOrganizationConfiguration } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IOrganizationConfiguration }

const OrganizationConfigurationSchema = new Schema<IOrganizationConfiguration>(
  {
    configId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    logoUrl: { type: String },
    metaAttributes: { type: Schema.Types.Mixed },
    welcomeMessage: { type: Schema.Types.Mixed },
    organizationAddress: { type: Schema.Types.Mixed },
    phoneNumbersId: [{ type: String }],
    phoneNumberInformation: [{ type: Schema.Types.Mixed }],
    exotelConfiguration: { type: Schema.Types.Mixed },
    // Per-org Stripe config. secretKey/webhookSecret are stored as encrypted
    // envelopes (enc:v1:...) — see EncryptionService.encryptSecret / StripeConfigService.
    stripeConfiguration: { type: Schema.Types.Mixed },
    adminUserId: { type: Schema.Types.ObjectId },
    openaiApiKey: { type: String },
    geminiAIConfiguration: {
      apiKey: { type: String },
      baseUrl: { type: String },
    },
    defaultLanguage: { type: String, default: 'HINDI' },
    isDeleteAllowed: { type: Boolean, default: false, required: true },
    isActive: { type: Boolean, default: true, required: true },
    isDelete: { type: Boolean, default: false, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'organization_configurations',
  }
)



// Indexes
OrganizationConfigurationSchema.index({ orgId: 1 }, { unique: true })

export const OrganizationConfiguration = mongoose.model<IOrganizationConfiguration>(
  'OrganizationConfiguration',
  OrganizationConfigurationSchema
)
