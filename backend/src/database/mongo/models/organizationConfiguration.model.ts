import mongoose, { Schema } from 'mongoose'
import { IOrganizationConfiguration } from '../../../typings/mongoModel'

// Re-export for backward compatibility
export { IOrganizationConfiguration }

const OrganizationConfigurationSchema = new Schema<IOrganizationConfiguration>(
  {
    configId: { type: Schema.Types.ObjectId }, // Same as _id, for SQL naming compatibility
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    workingHours: { type: Schema.Types.Mixed, required: true },
    logoUrl: { type: String },
    metaAttributes: { type: Schema.Types.Mixed },
    welcomeMessage: { type: Schema.Types.Mixed },
    organizationAddress: { type: Schema.Types.Mixed },
    appointmentInformation: { type: Schema.Types.Mixed },
    whatsappTemplate: { type: Schema.Types.Mixed },
    phoneNumbersId: [{ type: String }],
    phoneNumberInformation: [{ type: Schema.Types.Mixed }],
    testimonialMessage: { type: Schema.Types.Mixed },
    exotelConfiguration: { type: Schema.Types.Mixed },
    adminUserId: { type: Schema.Types.ObjectId },
    openaiApiKey: { type: String },
    geminiAIConfiguration: {
      apiKey: { type: String },
      baseUrl: { type: String },
    },
    appointmentReminderSchedules: [
      {
        minutesBefore: { type: Number, required: true },
        isEnabled: { type: Boolean, default: true },
        maxCount: { type: Number, default: 1 },
      },
    ],
    defaultLanguage: { type: String, default: 'HINDI' },
    // Per-org WhatsApp task-notification settings, managed by SuperAdmin. Read by the external-cron
    // dispatchers in TaskNotificationService. A missing block falls back to TASK_NOTIFICATION_DEFAULTS.
    // Per-org WhatsApp task-notification SETTINGS only (no runtime counts — those live on each task at
    // task.notificationsSent.counts). `maxCount` = how many times that notification may be sent per
    // task. `time` fields ('HH:mm' org-local) = the daily time the digest / due-today notification goes
    // out. A missing block falls back to TASK_NOTIFICATION_DEFAULTS.
    taskNotificationConfig: {
      enabled: { type: Boolean, default: true },
      assignmentAlert: { enabled: { type: Boolean, default: true }, maxCount: { type: Number, default: 1 } },
      dailyDigest: { enabled: { type: Boolean, default: true }, time: { type: String, default: '08:00' } },
      dueToday: { enabled: { type: Boolean, default: true }, time: { type: String, default: '09:00' }, maxCount: { type: Number, default: 1 } },
      preTaskReminder: { enabled: { type: Boolean, default: true }, leadMinutes: { type: Number, default: 30 }, maxCount: { type: Number, default: 1 } },
      overdueEscalation: { enabled: { type: Boolean, default: true }, thresholdMinutes: { type: Number, default: 60 }, maxCount: { type: Number, default: 1 } },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    reminderConfig: {
      autoReminderEnabled: { type: Boolean, default: false },
      reminderTypes: [{ type: String, enum: ['WHATSAPP', 'EMAIL', 'CALL'] }],
      defaultReminderSchedules: [
        {
          offsetMinutes: { type: Number, required: true },
          direction: { type: String, enum: ['BEFORE', 'AFTER'], default: 'BEFORE' },
          isEnabled: { type: Boolean, default: true },
          message: { type: String },
        },
      ],
    },
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

// Pre-save middleware to ensure configId equals _id
OrganizationConfigurationSchema.pre('save', function () {
  if (!this.configId) {
    this.configId = this._id
  }
})

// Indexes
OrganizationConfigurationSchema.index({ orgId: 1 }, { unique: true })

export const OrganizationConfiguration = mongoose.model<IOrganizationConfiguration>(
  'OrganizationConfiguration',
  OrganizationConfigurationSchema
)
