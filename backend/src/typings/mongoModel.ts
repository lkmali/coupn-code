import mongoose, { ClientSession, Document } from 'mongoose'

// ==================== User ====================
export interface IUserExotelCredentials {
  sipId: string
  sipSecret: string
  exotelUserId?: string
  registeredAt?: Date
  // Toggled by the agent's softphone widget. When false, pickAgentForIncomingCall
  // skips this user. Undefined / true → eligible.
  isAvailable?: boolean
  availabilityUpdatedAt?: Date
  // VirtualNumber currently bound to this agent on Exotel's side
  // (from the /usermapping registration). Compared against the org's
  // current exotelConfiguration.virtualNumber on every call; on mismatch
  // we push the org value back to Exotel so the recipient always sees
  // the number from OrganizationConfiguration, not a stale per-user one.
  lastSyncedVirtualNumber?: string
}

export interface IMongoUser extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roles: string[]
  mobileNumber: string
  countryCode?: string
  userName?: string
  email?: string
  isVerified: boolean
  orgId: mongoose.Types.ObjectId
  isMainAdmin: boolean
  isBlocked: boolean
  isActive: boolean
  isDelete: boolean
  lastLoginAt?: Date
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  exotel?: IUserExotelCredentials
  createdAt: Date
  updatedAt: Date
}

// ==================== Users Session ====================
export interface IMongoUsersSession extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  deviceName?: string
  deviceType?: string
  deviceId?: string
  location?: string
  version?: string
  loginTime: Date
  expiresAt: Date
  isMainDevice: boolean
  isActive: boolean
  isDelete: boolean
  isBlocked: boolean
  latitude?: number
  longitude?: number
  isVerified: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Organization ====================
export interface IMongoOrganization extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  adminMobile: string
  adminEmail: string
  orgName?: string
  orgShortName?: string
  countryCode?: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient ====================
export interface IMongoPatient extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  patientNumber: number // Auto-incrementing patient number
  name: string
  source?: string
  mobileNumber: string
  referenceId: string
  countryCode?: string
  age?: string
  email?: string
  stage?: string
  maritalStatus: string
  currentCondition?: string
  gender: string
  medicalHistory: string[]
  isDelete: boolean
  orgId: mongoose.Types.ObjectId
  assignDoctorId?: mongoose.Types.ObjectId
  aiSummary?: string
  notes?: string
  // Registration
  registrationNumber?: string
  registrationDate?: Date
  // Discriminated nested object for new writes; plain string for legacy rows
  // written before the structured shape was introduced. `hospitalName` is
  // persisted only when type === 'DOCTOR'.
  referredBy?: string | {
    type?: 'DOCTOR' | 'ASHA_WORKER' | 'OTHER'
    name?: string
    phone?: string
    area?: string
    hospitalName?: string
  }
  treatmentType?: string
  // Wife extras
  bloodGroup?: string
  profession?: string
  aadharNumber?: string
  address?: string
  city?: string
  // Identity of the patient's opposite-sex partner. Distinct from `femalePartner` /
  // `malePartner` below, which are CLINICAL sub-docs.
  partner?: {
    name?: string
    age?: string
    bloodGroup?: string
    profession?: string
    phoneNumber?: string
    email?: string
    aadharNumber?: string
  }
  // Marriage & Infertility
  marriageDate?: Date
  yearsMarried?: number
  yearsTryingToConceive?: number
  infertilityType?: string
  // Female Partner
  femalePartner?: {
    menstrualHistory?: {
      lastMenstrualPeriod?: Date
      cycleDuration?: number
      cycleLength?: number
      cycleRegularity?: string
      menarcheAge?: number
      menstrualFlow?: string
      dysmenorrhea?: string
    }
    amhReport?: {
      amhValue?: number
      testDate?: Date
      afcRightOvary?: number
      afcLeftOvary?: number
      interpretation?: string
    }
    pregnancyHistory?: {
      gravida?: number
      para?: number
      abortion?: number
      living?: number
      ectopic?: number
      molar?: number
      details?: string
    }
    pastMedicalHistory?: string
    familyMedicalHistory?: string
    previousSurgeries?: string[]
    chronicConditions?: string[]
    generalExamination?: {
      heightCm?: number
      weightKg?: number
      bmi?: number
      bloodPressure?: string
      pulseBpm?: number
      temperatureF?: number
    }
    systematicExamination?: {
      cvs?: string
      rs?: string
      abdomen?: string
      pallor?: string
      icterus?: string
      edema?: string
      breast?: string
      thyroid?: string
    }
    currentMedications?: string[]
    allergies?: string[]
    lifestyleFactors?: {
      alcoholConsumption?: string
      smoking?: string
      dietPattern?: string
      exerciseRoutine?: string
      stressLevel?: string
      sleepQuality?: string
    }
    sexualHealthHistory?: {
      sexuallyActive?: string
      frequencyOfIntercourse?: string
      sexualDysfunction?: string
      painDuringIntercourse?: string
      contraceptionHistory?: string
    }
  }
  // Male Partner
  malePartner?: {
    pastMedicalHistory?: string
    familyMedicalHistory?: string
    previousSurgeries?: string[]
    chronicConditions?: string[]
    allergies?: string[]
    lifestyleFactors?: {
      alcoholConsumption?: string
      smoking?: string
      dietPattern?: string
      exerciseRoutine?: string
      occupationalHazards?: string
      stressLevel?: string
    }
    sexualHealthHistory?: {
      erectileDysfunction?: string
      ejaculatoryIssues?: string
      libidoLevel?: string
      sexualSatisfaction?: string
    }
    semenAnalysis?: {
      testDate?: Date
      volumeMl?: number
      countMillionPerMl?: number
      motilityPercent?: number
      normalMorphologyPercent?: number
      abstinenceDays?: number
      interpretation?: string
    }
    currentMedications?: string[]
  }
  // Registration Step (0=not started, 1=form1 done, 2=form2 done, 3=all complete)
  registrationStep?: number
  treatmentCategory?: string
  // Treatment Reference
  activeTreatmentPlanId?: mongoose.Types.ObjectId
  // SOP Fields
  patientType?: string
  activePatientTimelineId?: mongoose.Types.ObjectId
  section?: string
  pregnancyStatus?: string
  priorityFlag?: string
  previousLSCS?: boolean
  numberOfPreviousLSCS?: number
  conceptionMethod?: string
  edd?: Date
  // IPD (in-patient department) admission state. Independent of `treatmentType`/
  // `status` — patient can be admitted while also in a treatment cycle. Discharge
  // gate finds open IPD work via Task filter on patientId + treatmentCategory:'IPD'.
  //
  // LEGACY: single-instance fields. Kept populated as a write-through shim during
  // the multi-instance migration so old readers don't break. Sourced from the
  // last ACTIVE entry of `ipds[]` (or undefined if no IPD is active). Plan to
  // drop in PR 4 once every caller reads `ipds[]` directly.
  ipd?: {
    active: boolean
    startedAt?: Date
    endedAt?: Date
  }
  // Multi-instance treatments. A patient can run several DIFFERENT treatment
  // SOPs concurrently (e.g. IVF + a parallel medication-only protocol) but
  // not two instances of the same SOP at once. The "no duplicate active SOP"
  // rule is enforced in TreatmentFlowService.startTreatment.
  activeTreatments?: Array<{
    instanceId: mongoose.Types.ObjectId
    treatmentType: string        // SOP name, mirrors legacy patient.treatmentType
    sopId?: mongoose.Types.ObjectId
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    startedAt: Date
    endedAt?: Date
  }>
  // Multi-instance IPD admissions, each scoped to one `activeTreatments[].instanceId`.
  // Starting a second IPD for the same `treatmentInstanceId` while another is still
  // ACTIVE is rejected with 409 IPD_ALREADY_ACTIVE.
  ipds?: Array<{
    instanceId: mongoose.Types.ObjectId
    // Treatment scope. Nullable for legacy stand-alone admits captured during the
    // migration window; new admits always carry a value (see TreatmentFlowService.admitIpd).
    treatmentInstanceId?: mongoose.Types.ObjectId | null
    sopId?: mongoose.Types.ObjectId   // SOPTreatmentType._id captured at admit time
    status: 'ACTIVE' | 'DISCHARGED'
    startedAt: Date
    endedAt?: Date
  }>
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Doctor ====================
export interface IMongoDoctor extends Document {
  _id: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  name: string
  specialization: string[]
  qualifications: string[]
  registrationNumber?: string
  experienceYears: number
  mobileNumber: string
  countryCode?: string
  orgId: mongoose.Types.ObjectId
  email: string
  consultationFee?: number
  languagesSpoken: string[]
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Current Follow Up (embedded in Lead) ====================
export interface ICurrentFollowUp {
  followUpId?: mongoose.Types.ObjectId
  followUpDate?: Date
  status?: string // 'PENDING' | 'COMPLETED' | 'CANCELLED'
  assignToUserId?: mongoose.Types.ObjectId
  notes?: string
}

// ==================== Lead ====================
export interface IMongoLead extends Document {
  _id: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  leadNumber: number // Auto-incrementing lead number
  orgId: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  name: string
  referenceId?: string
  lastCallId?: string
  hasMissedCall?: boolean
  leadResourceId?: string
  aiSummary?: string
  others?: string
  description?: string
  mobileNumber?: string
  email?: string
  source?: string
  status: string
  assignUserId?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  isBlock: boolean
  followUpDate?: Date
  followupCounts: number
  reminderCount: number
  unReadMessageCount: number
  // Unread inbound emails. Bumped in the same atomic update as emailCount on
  // inbound links; reset to zero when the user opens the lead's email view.
  // Outbound sends never touch this counter.
  unReadEmailCount: number
  // Lifetime count of emails (inbound + outbound) tied to this lead. Stamped at
  // the source events: createLeadFromEmail bumps it when a UserEmail is freshly
  // linked, sendEmailToLead bumps it on a successful outbound send. Never
  // decrements — purely a "how busy is this conversation" indicator.
  emailCount: number
  requiredFollowup: boolean
  userSentimentSummary?: string
  age?: number
  gender?: string
  isValidName: boolean
  dob?: string
  language?: string
  malePartner?: Record<string, any>
  femalePartner?: Record<string, any>
  marriedSince?: string
  referral?: Record<string, any>
  sourceId?: string
  adId?: string // Ad ID from ad assignment (for UI filtering)
  centerName?: string
  routingPhoneNumber?: string
  sourceTags: string[]
  refersBy?: string
  campLocation?: string
  lastActivityAt?: Date
  visitStatus?: string // 'IN' | 'OUT'
  lastCheckIn?: Date
  lastCheckOut?: Date
  totalVisits?: number
  currentFollowUp?: ICurrentFollowUp
  currentAppointment?: Date | null
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Lead Social ====================
export interface IMongoLeadSocial extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  leadId: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  whatsappId?: string
  instagramId?: string
  messengerId?: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Lead Activity ====================
export interface IMongoLeadActivity extends Document {
  _id: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  apiSource?: string
  parentMethod?: string
  updatedFields?: Record<string, any>
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

// ==================== Activity ====================
export interface IMongoActivity extends Document {
  _id: mongoose.Types.ObjectId
  activityId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  activityType: string
  activityTime: Date
  title: string
  description?: string
  duration?: number
  result?: string
  leadId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  doctorId?: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  nextAction?: string
  source?: string
  orgId: mongoose.Types.ObjectId
  noteTags: string[]
  reportIds?: mongoose.Types.ObjectId[]
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Appointment ====================
export interface IMongoAppointment extends Document {
  _id: mongoose.Types.ObjectId
  appointmentId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  patientId?: mongoose.Types.ObjectId
  appointmentType?: string
  duration?: string
  orgId: mongoose.Types.ObjectId
  referenceId: string
  leadId?: mongoose.Types.ObjectId
  description?: string
  comment?: string
  source?: string
  doctorId?: mongoose.Types.ObjectId
  startDate: Date
  endDate: Date
  status: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  appointmentMode?: string
  meetingLink?: string
  reminderCount?: number
  remindersSent?: IReminderSent[]
  needToReminder?: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Reminder Sent Tracking ====================
export interface IReminderSent {
  minutesBefore: number
  count: number
}

// ==================== Task ====================
// Subtask is an embedded sub-document on Task. After consolidating timeline_subtasks → tasks,
// `status` and `completedBy` were added so timeline-driven subtasks (which had a status enum)
// keep parity. The legacy `completed` boolean stays for back-compat with non-timeline callers.
export interface IMongoTaskSubtask {
  subtaskId?: mongoose.Types.ObjectId
  title: string
  completed: boolean
  completedAt?: Date
  status?: string
  completedBy?: mongoose.Types.ObjectId
}

export interface IMongoTask extends Document {
  _id: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  taskNumber?: number // Sequential per-org task number
  title: string
  assignToUserId: mongoose.Types.ObjectId
  priority?: string
  category?: string
  description?: string
  patientId?: mongoose.Types.ObjectId
  leadId?: mongoose.Types.ObjectId
  dueDate: Date
  orgId: mongoose.Types.ObjectId
  status: string
  subtasks?: IMongoTaskSubtask[]
  tags?: string[]
  relatedModule?: string
  completedDate?: Date
  isDelete?: boolean
  // Timeline fields. After consolidating timeline_tasks into the tasks collection, every
  // SOP-generated task carries:
  //   - timelineId         → the timeline_event._id this task belongs to (was TimelineTask.eventId)
  //   - patientTimelineId  → the parent patient_timeline._id (used by cycle/pregnancy services
  //                          to fetch all tasks for a patient's timeline in one query)
  //   - sopTaskTemplateId  → the SOP template that generated this task
  timelineId?: mongoose.Types.ObjectId
  patientTimelineId?: mongoose.Types.ObjectId
  // 'TREATMENT' (default) or 'IPD'. Inherited from the source SOP / admit call
  // at task-create time. Drives the completeTreatment + endIpd gates.
  treatmentCategory?: 'TREATMENT' | 'IPD'
  // Multi-instance scoping. `treatmentInstanceId` matches `patient.activeTreatments[].instanceId`;
  // `ipdInstanceId` matches `patient.ipds[].instanceId`. Either may be null on legacy rows written
  // before the multi-instance migration. Stamped by TreatmentFlowService when materialising tasks.
  treatmentInstanceId?: mongoose.Types.ObjectId | null
  ipdInstanceId?: mongoose.Types.ObjectId | null
  sopTaskTemplateId?: mongoose.Types.ObjectId
  taskType?: string
  assignedRole?: string
  isSystemManaged?: boolean
  // Module-registry routing — array of {moduleKey, sectionKey} pairs. A task can belong to multiple
  // sections (inherited from the parent SOPEvent.moduleSectionKeys at SOP-run time, override allowed
  // per-task). Backend list filter uses $elemMatch so `?moduleKey=ivf&sectionKey=opu` still selects a
  // single tab's tasks.
  moduleSectionKeys?: IModuleSectionRef[]
  // Specific record this task is attached to (e.g. ivfCycleId). Independent of the section array.
  refId?: string
  // Form fields
  formId?: string
  formConfig?: IFormConfig
  formData?: Record<string, any>
  formCompletedAt?: Date
  formCompletedBy?: mongoose.Types.ObjectId
  // Optional reviewing-doctor workflow. When set, task completion auto-spawns a follow-up
  // "Review Reports" task assigned to this doctor; the spawned task carries `parentTaskId`
  // pointing back to the original (used by the doctor's review-task UI to fetch parent
  // formData + uploaded reports without duplicating data).
  reviewerDoctorId?: mongoose.Types.ObjectId
  parentTaskId?: mongoose.Types.ObjectId
  // When true, completing this task should notify the patient (channel/template wired later).
  informPatient?: boolean
  // Patient-portal visibility. `private` = staff only; `public` = surfaced to the patient.
  // Mirrors the pattern used on reports/follow-ups/patient notes.
  visibility?: 'public' | 'private'
  // WhatsApp notification idempotency stamps. Each scheduled/event-driven notification writes a
  // timestamp here once sent so the external-cron dispatchers never double-send. `digestDates`
  // tracks which local days ('YYYY-MM-DD') this task was already included in a morning digest for.
  notificationsSent?: {
    assignment?: Date
    reminder30?: Date
    overdue?: Date
    dueToday?: Date
    digestDates?: string[]
    // How many times each notification has actually been sent for this task.
    counts?: {
      assignment?: number
      reminder30?: number
      overdue?: number
      dueToday?: number
      digest?: number
    }
  }
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Task History (audit log) ====================
export interface IMongoTaskHistory extends Document {
  _id: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  action: string
  changedFields?: string[]
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  description?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

// ==================== Follow-Up History (audit log) ====================
export interface IMongoFollowUpHistory extends Document {
  _id: mongoose.Types.ObjectId
  followUpId: mongoose.Types.ObjectId
  leadId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  action: string
  changedFields?: string[]
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  description?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

// ==================== Patient Note ====================
// Free-text note attached to a patient. Visibility controls who sees it:
//   - 'public'  → staff + patient portal
//   - 'private' → staff only
// Mirrors the report-visibility convention (memory:
// `project_report_visibility_public_private`).
export type PatientNoteVisibility = 'public' | 'private'

export interface IMongoPatientNote extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  content: string
  visibility: PatientNoteVisibility | string
  /** Optional tag for categorisation — kept simple, not enum-restricted. */
  category?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient History ====================
export interface IMongoPatientHistory extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  patientId: mongoose.Types.ObjectId
  doctorId?: mongoose.Types.ObjectId
  reportIds: mongoose.Types.ObjectId[]
  appointmentId?: mongoose.Types.ObjectId
  history?: Record<string, any>
  condition?: string
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  // Timeline fields for treatment workflow
  recordType?: string
  title?: string
  description?: string
  status?: string
  recordDate?: Date
  recordTime?: string
  assigneeRole?: string
  fileUrls?: string[]
  fileTypes?: string[]
  fileNames?: string[]
  treatmentPlanId?: mongoose.Types.ObjectId
  treatmentCycleId?: mongoose.Types.ObjectId
  workflowTaskId?: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Report ====================
export interface IMongoReport extends Document {
  _id: mongoose.Types.ObjectId
  reportId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  reports?: Record<string, any>
  reportResult?: string
  patientId: mongoose.Types.ObjectId
  doctorId?: mongoose.Types.ObjectId
  fileUrl?: string
  reportType?: string
  fileType?: string
  description?: string
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  // Timeline fields
  timelineId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  activityId?: mongoose.Types.ObjectId
  visitId?: mongoose.Types.ObjectId
  fileName?: string
  fileSize?: number
  reportDate?: Date
  status?: string
  visibility?: 'public' | 'private'
  reviewedBy?: mongoose.Types.ObjectId
  reviewDate?: Date
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Lab Test ====================
export interface IMongoLabTestResult {
  parameter: string
  value: string
  unit?: string
  normalRange?: string
  flag?: string // 'Normal' | 'High' | 'Low' | 'Critical'
}

export interface IMongoLabTest extends Document {
  _id: mongoose.Types.ObjectId
  labTestId: mongoose.Types.ObjectId
  testNumber: number
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  testType: string
  category: string
  status: string
  orderedBy: mongoose.Types.ObjectId
  orderedDate: Date
  results: IMongoLabTestResult[]
  reviewedBy?: mongoose.Types.ObjectId
  reviewDate?: Date
  treatmentCycleId?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Call Activity ====================
export interface IMongoCallActivity extends Document {
  _id: mongoose.Types.ObjectId
  callActivityId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  leadId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  referenceId?: string
  sid?: string
  callId?: string
  callStatus?: string
  callSuccessful?: boolean
  disconnectionReason?: string
  callDuration?: number
  description?: string
  action?: string
  userSentiment?: string
  circle?: string
  aiSummery?: string
  recordingUrl?: string
  // Lambda-driven rehost: when the org has `exotelConfiguration.recordingStoreInS3`
  // enabled, a scheduled Lambda fetches rows where `recordingS3Key` is null
  // (and `recordingS3Error` is null — failures are terminal, never retried),
  // downloads the audio from Exotel, uploads to S3, and sets this key.
  recordingS3Key?: string
  // If Exotel returns an error while the Lambda is downloading, we stamp
  // the message here so the row is skipped on future runs. No retry logic.
  recordingS3Error?: string
  // Whether `recordingUrl` can be opened directly by a browser.
  //  - PUBLIC  = presigned S3 URL rehosted on our bucket (playable as-is)
  //  - PRIVATE = raw Exotel URL that needs Basic-auth to fetch; frontend
  //              must go through the `/api/exotel/recordings/.../stream`
  //              proxy instead of hitting `recordingUrl` directly.
  recordingUrlType?: 'PUBLIC' | 'PRIVATE'
  fromNumber?: string
  toNumber?: string
  direction: string
  orgId: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Social Contact ====================
export interface IMongoSocialContact extends Document {
  _id: mongoose.Types.ObjectId
  contactId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  socialId: string
  name?: string
  mobileNumber?: string
  emailId?: string
  socialType: string
  lastSeen?: Date
  language?: string
  orgId: mongoose.Types.ObjectId
  phoneNumberId?: string
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Social Message ====================
export interface IMongoSocialMessage extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  contactId: mongoose.Types.ObjectId
  messageId: mongoose.Types.ObjectId // Same as _id, dual-ID pattern
  direction: string
  socialType: string
  buttons?: string[]
  orgId: mongoose.Types.ObjectId
  type?: string
  body?: string
  caption?: string
  bucketKey?: string
  mimeType?: string
  fileId?: string
  timestamp: Date
  userType?: string
  filename?: string
  publicUrl?: string
  trackingId?: string
  whatsappMessageId?: string
  messageStatus: string
  errorMessage?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Chat History ====================
export interface IMongoChatHistory extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  message: string
  role: string
  createdAt: Date
  updatedAt: Date
}

// ==================== Copilot Session ====================
export interface IMongoCopilotSession extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: mongoose.Types.ObjectId // Same as _id
  userId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  conversationSummary: string
  pendingTool?: string | null
  pendingToolContext?: any
  title?: string
  isPinned?: boolean
  pinnedAt?: Date | null
  isDeleted?: boolean
  deletedAt?: Date | null
  messageCount?: number
  lastMessageAt?: Date
  lastActiveAt: Date
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

// ==================== Copilot Conversation ====================
export interface IMongoCopilotConversation extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id
  sessionId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  message: string
  toolName?: string | null
  cardType?: string | null
  rawData?: any | null
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// ==================== Address ====================
export interface IMongoAddress extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  area?: string
  address?: string
  city?: string
  location?: Record<string, any>
  state?: string
  country?: string
  pinCode?: string
  orgId: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Token ====================
export interface IMongoToken extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  verificationKey: string
  verifyCode: string
  otpExpires: Date
  metaData?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// ==================== Password ====================
export interface IMongoPassword extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  password: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Client Key ====================
export interface IMongoClientKey extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId: mongoose.Types.ObjectId
  botName: string
  userId: mongoose.Types.ObjectId
  clientSecret: string
  clientKey: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Webhook Routing (standalone, no orgId) ====================
export interface IMongoWebhookRouting extends Document {
  _id: mongoose.Types.ObjectId
  webhookRoutingId: mongoose.Types.ObjectId
  mobileNumber: string
  appSecret: string
  routingUrl: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== S3 Temp Key ====================
export interface IMongoS3TempKey extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  s3Key: string
  s3PublicUrl?: string
  s3Bucket?: string
  metaData?: Record<string, any>
  expiresAt?: Date
  isDelete: boolean
  orgId: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Phone Number Info ====================
export interface IPhoneNumberInfo {
  phoneNumber: string
  location: string
  isEnabled?: boolean
}

// ==================== Organization Configuration ====================
export interface IMongoOrganizationConfiguration extends Document {
  _id: mongoose.Types.ObjectId
  configId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId: mongoose.Types.ObjectId
  workingHours?: Record<string, any>
  logoUrl?: string
  metaAttributes?: Record<string, any>
  welcomeMessage?: Record<string, any>
  organizationAddress?: Record<string, any>
  appointmentInformation?: Record<string, any>
  whatsappTemplate?: Record<string, any>
  phoneNumbersId?: string[]
  phoneNumberInformation?: IPhoneNumberInfo[]
  testimonialMessage?: Record<string, any>
  exotelConfiguration?: IExotelConfiguration
  geminiAIConfiguration?: IGeminiAIConfiguration
  openaiApiKey?: string
  appointmentReminderSchedules?: IAppointmentReminderSchedule[]
  reminderConfig?: IReminderConfig
  taskNotificationConfig?: ITaskNotificationConfig
  defaultLanguage?: string // Default language for the organization (e.g. HINDI, ENGLISH, GUJARATI)
  adminUserId: mongoose.Types.ObjectId
  isDeleteAllowed: boolean
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Task Notification Config ====================
// Per-org WhatsApp task-notification settings, managed by SuperAdmin. The external-cron dispatchers
// read these to decide which notifications to send and with what timing. All fields optional so a
// missing block falls back to TASK_NOTIFICATION_DEFAULTS in taskNotification.service.
// Per-org task-notification SETTINGS only. Runtime "how many sent" counts live per task at
// task.notificationsSent.counts — never here. `maxCount` = how many times to send that notification
// per task; `time` = the daily org-local time the digest / due-today notification fires.
export interface ITaskNotificationConfig {
  enabled?: boolean // master switch — false disables every task notification for the org
  assignmentAlert?: { enabled?: boolean; maxCount?: number /* default 1 */ }
  dailyDigest?: { enabled?: boolean; time?: string /* 'HH:mm' org-local, default '08:00' */ }
  dueToday?: { enabled?: boolean; time?: string /* 'HH:mm' org-local, default '09:00' */; maxCount?: number /* default 1 */ }
  preTaskReminder?: { enabled?: boolean; leadMinutes?: number /* default 30 */; maxCount?: number /* default 1 */ }
  overdueEscalation?: { enabled?: boolean; thresholdMinutes?: number /* default 60 */; maxCount?: number /* default 1 */ }
  timezone?: string // IANA tz used for digest/due-today day boundaries; defaults to Asia/Kolkata
}

// ==================== Appointment Reminder Schedule ====================
export interface IAppointmentReminderSchedule {
  minutesBefore: number
  isEnabled: boolean
  maxCount: number
}

// ==================== Reminder Config ====================
export interface IReminderScheduleItem {
  type: string // 'WHATSAPP' | 'EMAIL' | 'CALL'
  offsetMinutes: number // e.g. 30, 45, 60
  direction: string // 'BEFORE' | 'AFTER'
  isEnabled: boolean
  message?: string // Custom message template for this reminder
}

export interface IReminderConfig {
  autoReminderEnabled: boolean
  reminderTypes: string[] // ['WHATSAPP', 'EMAIL', 'CALL'] — kept for backward compat
  defaultReminderSchedules: IReminderScheduleItem[]
}

// ==================== Exotel Configuration ====================
export interface IExotelConfiguration {
  customerId: string
  customerSecret: string
  appId: string
  appSecret: string
  accountSid: string
  virtualNumber: string
  domain: string
  integrationsBaseUrl: string
  subdomain: string
  apiKey: string
  apiToken: string
  webhookToken?: string
  isEnabled: boolean
  recordingStoreInS3?: boolean
}

// ==================== Gemini AI Configuration ====================
export interface IGeminiAIConfiguration {
  apiKey?: string
  baseUrl?: string
}

// ==================== Module Registry ====================
// Lets super-admin declare clinical modules (ivf, maternity, …) and their sections (stimulation, opu, anc_visit, …)
// at runtime. SOPEvent.moduleSectionKeys + Task.moduleSectionKeys reference these entries, so new domains
// wire themselves to tabs without code changes. The attach itself lives on the SOP Event (multi-select array)
// and is inherited by every task generated from that event; per-task override is allowed.
export interface IModuleSectionEntry {
  sectionKey: string
  label: string
  order?: number
  enabled?: boolean
}

// (moduleKey, sectionKey) pair carried on SOPEvent and Task — array form because one event can belong to
// multiple sections (e.g. an "Embryo transfer day" event covers both Transfer and Outcome tabs).
export interface IModuleSectionRef {
  moduleKey: string
  sectionKey: string
}

export interface IModuleRegistryEntry {
  moduleKey: string
  label: string
  icon?: string
  // 'custom' = the domain ships its own page/controllers (e.g. IVF); the registry exists only to name its
  //            tabs so tasks/SOP can reference them. 'generic' = driven entirely by schema (future).
  driver?: 'custom' | 'generic'
  route?: string
  order?: number
  enabled?: boolean
  sections: IModuleSectionEntry[]
}

// ==================== Cryogenic Storage Configuration ====================
// Per-org physical layout of cryo tanks. Drives the embryo / oocyte freeze dialog
// (cascading dropdowns) and is the source of truth that `cryo_slot_assignments`
// validates against to keep two specimens from sharing one straw position.
export interface ICryoGoblet {
  gobletId: string
  label?: string
  vizoColours?: string[]
  strawPositions?: string[]
}

export interface ICryoCanister {
  canisterId: string
  label?: string
  goblets?: ICryoGoblet[]
}

export interface ICryoTank {
  tankId: string
  label?: string
  /** Display-only operating temperature (e.g. "-196°C"). Free-form
   *  string written by admins via the Cryo Storage editor. */
  temperature?: string
  canisters?: ICryoCanister[]
}

export interface ICryoStorage {
  tanks?: ICryoTank[]
}

// ==================== Organization Master Data ====================
export interface IMongoOrganizationMasterData extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId: mongoose.Types.ObjectId
  logoUrl?: string
  sideMenuItems?: string[]
  menuItemsConfig?: Array<{
    id: string
    label: string
    icon: string
    roles: string[]
    order: number
    enabled: boolean
    /** Sidebar group key (e.g. 'core', 'patient-care', 'laboratory',
     *  'operations', 'settings', 'footer'). Must match a `key` in
     *  `sidebarSections` (or fall back to the hardcoded section list). */
    section?: string
  }>
  sidebarSections?: Array<{
    key: string
    label: string
    icon?: string
    order: number
    enabled?: boolean
    defaultCollapsed?: boolean
  }>
  roleUiConfig?: Array<{
    role: string
    label: string
    colorClass: string
    borderColorClass: string
    iconName: string
  }>
  activityType?: Array<{ id: string; title: string }>
  leadSource?: Array<{ id: string; title: string }>
  leadStatus?: Array<{ id: string; title: string }>
  appointmentType?: Array<{ id: string; title: string }>
  appointmentMode?: Array<{ id: string; title: string }>
  documentType?: Array<{ id: string; title: string }>
  sopEnabled?: boolean
  visitTabEnabled?: boolean
  /** Prefix applied to auto-generated patient registration numbers (e.g. 'REG-',
   *  'MH-', 'AKR-'). Per-hospital — set in PatientConfigManager. Falls back to
   *  'REG-' when unset. Only affects NEW registration numbers + the FE fallback;
   *  already-stored `registrationNumber` values keep their original prefix. */
  patientRegistrationPrefix?: string
  sopTreatmentTypes?: Array<{ id: string; title: string }>
  sopTaskCategories?: Array<{ id: string; title: string }>
  organizationForms?: IOrganizationForm[]
  defaultPatientTasks?: IDefaultPatientTask[]
  treatmentPrerequisiteConfig?: ITreatmentPrerequisiteConfig[]
  moduleRegistry?: IModuleRegistryEntry[]
  cryoStorage?: ICryoStorage
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Role ====================
export interface IMongoRole extends Document {
  _id: mongoose.Types.ObjectId
  roleId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roleKey: string
  name: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Permission ====================
export interface IMongoPermission extends Document {
  _id: mongoose.Types.ObjectId
  permissionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  code: string
  name: string
  category: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Role Permission ====================
export interface IMongoRolePermission extends Document {
  _id: mongoose.Types.ObjectId
  rolePermissionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roleId: mongoose.Types.ObjectId
  permissionIds: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== User Permission ====================
export interface IMongoUserPermission extends Document {
  _id: mongoose.Types.ObjectId
  userPermissionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  permissionIds: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Whatsapp API Response ====================
export interface IMongoWhatsappApiResponse extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  messageId?: mongoose.Types.ObjectId // References SocialMessage._id
  trackingId: string
  eventName?: string
  status?: string
  body?: string
  response?: Record<string, any>
  orgId: mongoose.Types.ObjectId
  mobileNumber?: string
  createdAt: Date
  updatedAt: Date
}

// ==================== Meta Webhook Payload ====================
export interface IMongoMetaWebhookPayload extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId?: mongoose.Types.ObjectId
  webhookType?: string
  objectType?: string
  messageType?: string
  payload: Record<string, any>
  processedStatus?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

// ==================== AI Error ====================
export interface IMongoAIError extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  trackingId: string
  agentUrl: string
  requestBody: Record<string, any>
  responseBody?: Record<string, any>
  errorMessage?: string
  orgId: mongoose.Types.ObjectId
  socialId?: string
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== AI Analysis ====================
export interface IMongoAIAnalysis extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId
  orgId?: mongoose.Types.ObjectId
  backendDocumentId?: string
  uploadUrl?: string
  imageUrl?: string
  title?: string
  status: string
  metadata?: Record<string, any>
  result?: Record<string, any>
  errorMessage?: string
  clientKey?: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Treatment Type ====================
export interface IMongoTreatmentTypeStage {
  stageNumber: number
  name: string
  description?: string
}

export interface IMongoTreatmentType extends Document {
  _id: mongoose.Types.ObjectId
  treatmentTypeId: mongoose.Types.ObjectId
  name: string
  code: string
  description?: string
  stages: IMongoTreatmentTypeStage[]
  maxCycles?: number
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Timeline Event ====================
export interface IMongoTimelineEvent extends Document {
  _id: mongoose.Types.ObjectId
  timelineEventId: mongoose.Types.ObjectId
  cycleId?: mongoose.Types.ObjectId
  treatmentPlanId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  stageKey: string
  title: string
  order: number
  status: string
  patientTimelineId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  description?: string
  phaseKey?: string
  weekRange?: { from: number; to: number }
  triggerCondition?: string
  conditionKey?: string
  conditionMet?: boolean
  scheduledDate?: Date
  completedDate?: Date
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// IMongoTimelineTask removed. The `timeline_tasks` collection was consolidated into `tasks`;
// every consumer now uses IMongoTask with `timelineId` (timeline_event ref) + `patientTimelineId`.

// IMongoTimelineSubtask removed — `timeline_subtasks` consolidated into the embedded
// IMongoTaskSubtask array on Task (see IMongoTask.subtasks).

// ==================== Ad Assignment ====================
export interface IMongoAdAssignment extends Document {
  _id: mongoose.Types.ObjectId
  adAssignmentId: mongoose.Types.ObjectId // Same as _id
  orgId: mongoose.Types.ObjectId
  adId: string // source_id from referral (the Ad ID)
  adName?: string
  platform?: string // e.g. instagram, facebook, google
  description?: string
  assignToUserId: mongoose.Types.ObjectId // staff member to auto-assign leads
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Phone Routing ====================
export interface IMongoPhoneRouting extends Document {
  _id: mongoose.Types.ObjectId
  phoneRoutingId: mongoose.Types.ObjectId // Same as _id
  orgId: mongoose.Types.ObjectId
  phoneNumber: string
  centerName: string
  description?: string
  assignToUserId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== SOP Treatment Type ====================
export interface IMongoSOPTreatmentType extends Document {
  _id: mongoose.Types.ObjectId
  sopTreatmentTypeId: mongoose.Types.ObjectId
  treatmentType: string
  name: string
  description?: string
  // `TREATMENT` (default) for regular per-treatment SOPs; `IPD` flags the single global
  // in-patient SOP the IPD toggle reads from.
  category: 'TREATMENT' | 'IPD'
  status: string // ACTIVE | DRAFT | ARCHIVED
  version: number
  icon?: string
  color?: string
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== SOP Event ====================
export interface IMongoSOPEvent extends Document {
  _id: mongoose.Types.ObjectId
  sopEventId: mongoose.Types.ObjectId
  sopTreatmentTypeId: mongoose.Types.ObjectId
  title: string
  description?: string
  order: number
  timeUnit?: string // week | day | '' (optional — no offset means no due date)
  week?: number
  day?: number
  weekRange?: { from: number; to: number }
  triggerCondition?: string // AUTO | CONDITIONAL | MANUAL
  conditionKey?: string
  // Module-registry attach for the whole event. Every task generated from this event inherits this
  // array verbatim; per-task override on Task.moduleSectionKeys still wins. Array form because one
  // event can legitimately belong to multiple sections (e.g. day-13 OPU also covers Embryology kickoff).
  moduleSectionKeys?: IModuleSectionRef[]
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Form Config (shared) ====================
export interface IFormFieldOption {
  label: string
  value: string
}

export interface IFormFieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  customMessage?: string
}

export interface IFormFieldDependsOn {
  field: string
  value: any
}

export interface IFormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'email' | 'phone' | 'aadhaar'
  required?: boolean
  placeholder?: string
  defaultValue?: any
  options?: IFormFieldOption[]
  validation?: IFormFieldValidation
  /** Opaque, stable id minted at field-create time. Form responses live in the
   *  `form_responses` collection keyed by this id, so renaming `name`/`label`
   *  never orphans answers and the patient mongoose schema is never exposed
   *  to the form builder UI. Format: "fk_<10 base36 chars>". */
  fieldKey?: string
  displayOrder?: number
  section?: string
  colSpan?: number
  dependsOn?: IFormFieldDependsOn
}

/** Where in the patient view UI a form's submissions render. One form may have many targets;
 *  see FORM_BUILDER_PLAN.md §2.2. moduleKey/sectionKey align with the existing module registry
 *  (IModuleSectionRef) so tasks/SOP/forms all speak the same vocabulary. */
export interface IFormDisplayTarget {
  moduleKey: string
  sectionKey?: string
  layout?: 'card' | 'table'
  displayOrder?: number
  showLabel?: boolean
}

export interface IFormConfig {
  enabled: boolean
  formTitle?: string
  formSubtitle?: string
  fields: IFormField[]
}

// ==================== Organization Form Template ====================
export interface IOrganizationForm {
  id: string
  name: string
  description?: string
  category?: string // e.g. 'PATIENT_INTAKE', 'INVESTIGATION', 'DENTAL', 'SURGERY', etc.
  formTitle?: string
  formSubtitle?: string
  fields: IFormField[]
  isActive?: boolean
  /** 0..N patient-view destinations. Empty/undefined → form is "task-form only", no auto-render. */
  displayTargets?: IFormDisplayTarget[]
  /** When true, every task submission of this form is preserved & rendered as a row/card in the
   *  display targets. When false (default), only the latest submission per patient is shown. */
  allowDuplicates?: boolean
  /** Gate which patient gender this form is offered to in the dynamic patient-view sections.
   *  ANY/undefined → all patients. MALE → only MALE patients. FEMALE → only FEMALE patients.
   *  Typical use: a "Wife details" form (collected for the wife) is set to MALE because it's
   *  the male patient's wife; a "Husband details" form is set to FEMALE for the same reason. */
  applicableGender?: 'ANY' | 'MALE' | 'FEMALE'
  /** When true, this form is offered as a step in the Add Patient wizard (after the patient is
   *  created from the fixed Basic Information step) and saved against the new patientId. Forms
   *  not flagged are task-form / patient-view only. Stored on the Mixed `organizationForms`
   *  array, so no schema change is needed — this type entry is purely for documentation. */
  showAtPatientRegistration?: boolean
}

// ==================== Default Patient Task Config ====================
export interface IDefaultPatientTask {
  id: string
  title: string
  description?: string
  category?: string
  assignedRole?: string
  priority?: string
  isActive?: boolean
  formId?: string  // references IOrganizationForm.id
  formConfig?: IFormConfig  // resolved at runtime from formId or inline
}

// ==================== Treatment Prerequisite Config ====================
export interface IPrerequisiteTask {
  id: string
  title: string
  subtitle?: string
  description?: string
  category?: string
  assignedRole?: string
  order?: number
  formConfig?: IFormConfig
}

export interface ITreatmentPrerequisiteConfig {
  treatmentType: string
  enabled: boolean
  description?: string
  estimatedTime?: string
  prerequisiteTasks: IPrerequisiteTask[]
}

// ==================== SOP Task Template ====================
export interface IMongoSOPTaskTemplate extends Document {
  _id: mongoose.Types.ObjectId
  sopTaskTemplateId: mongoose.Types.ObjectId
  sopEventId: mongoose.Types.ObjectId
  title: string
  description?: string
  category: string // Investigation | Counselling | Task | Medication | Procedure
  assignedRole?: string
  order: number
  metadata?: Record<string, any>
  formConfig?: IFormConfig
  // Reference to a published org form (organizationForms[].id). Customer screens only pick a form;
  // they cannot edit its fields. The full form structure lives on OrganizationMasterData.organizationForms,
  // not on the template — keeps a single source of truth so renaming a field updates everywhere.
  formId?: string
  // Per-task override of the parent event's moduleSectionKeys. `undefined` = inherit from event
  // (most tasks). When set, this wins at SOP-run time so an outlier task can land in a different
  // tab than the rest of its event's tasks.
  moduleSectionKeys?: IModuleSectionRef[]
  // Seed value copied onto generated Task.informPatient at SOP-run time.
  informPatient?: boolean
  // Seed value copied onto generated Task.visibility at SOP-run time.
  visibility?: 'public' | 'private'
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient Timeline ====================
export interface IMongoPatientTimeline extends Document {
  _id: mongoose.Types.ObjectId
  patientTimelineId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  treatmentPlanId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  // 'TREATMENT' for regular treatment runs, 'IPD' for in-patient admissions.
  // Set by generateTimeline() from the source SOP's category.
  treatmentCategory?: 'TREATMENT' | 'IPD'
  // Multi-instance scoping — set when the patient_timeline is generated from a
  // specific treatment-instance or IPD-instance start call. Lets the IPD history
  // list pull only the events that belong to one admission.
  treatmentInstanceId?: mongoose.Types.ObjectId | null
  ipdInstanceId?: mongoose.Types.ObjectId | null
  status: string
  progressPercent: number
  currentPhaseKey?: string
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Timeline ====================
export interface IMongoTimeline extends Document {
  _id: mongoose.Types.ObjectId
  timelineId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  title: string
  description?: string
  order: number
  status: string
  // Discriminator for the entry kind. Existing rows have no value (treated as the
  // pre-existing SOP/manual semantics). 'CONSULTATION' marks rows created from the
  // Dr Consultation composer on the patient page; the `consultation` subdoc carries
  // the doctor's public/private notes plus the AI extraction + linked task/appointment ids.
  type?: string // 'SOP' | 'MANUAL' | 'CONSULTATION'
  source?: string // AUTO | SOP | MANUAL
  // 'TREATMENT' (default) or 'IPD'. Inherited from the parent SOP's category at
  // generation time; manual rows default to 'TREATMENT'. Drives the patient
  // page's Treatments-vs-IPD tab split.
  treatmentCategory?: 'TREATMENT' | 'IPD'
  // Multi-instance scoping. Mirrors the same fields on Task. The IPD tab uses
  // `ipdInstanceId` to scope the timeline list to one admission when the user
  // selects a row from the IPD history list.
  treatmentInstanceId?: mongoose.Types.ObjectId | null
  ipdInstanceId?: mongoose.Types.ObjectId | null
  doctorNotes?: string
  phaseKey?: string
  weekRange?: { from: number; to: number }
  triggerCondition?: string
  conditionKey?: string
  conditionMet?: boolean
  scheduledDate?: Date
  completedDate?: Date
  consultation?: {
    // The doctor who started the Consultation. The Consultation is shared —
    // any doctor can add comments to it — but we keep the originator for
    // audit/debug.
    doctorId?: mongoose.Types.ObjectId
    doctorName?: string
    // Draft → Done lifecycle. A Consultation is editable while isDraft is true.
    // Comments inside it can be edited/deleted only while isDraft is true.
    isDraft?: boolean
    // Set when the Done button is clicked. Renamed from committedAt in v2.
    doneAt?: Date
    timezone?: string
    // ----- Legacy v1 fields, kept on the type so the lazy migration can read
    // them. New code does NOT write these. They get UNSET on any row that's
    // touched by the migration in getConsultationComments.
    note?: string
    visibility?: 'PUBLIC' | 'PRIVATE'
    mentions?: { userId: string; display: string }[]
    aiExtractions?: any
    extractedAt?: Date
    committedAt?: Date
    lastAutosaveAt?: Date
  }
  createdTaskIds?: mongoose.Types.ObjectId[]
  createdAppointmentIds?: mongoose.Types.ObjectId[]
  createdMedicineIds?: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Medicine ====================
export interface IMongoMedicine extends Document {
  _id: mongoose.Types.ObjectId
  medicineId: mongoose.Types.ObjectId
  timelineId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  medicineName: string
  dosage: string
  frequency: string
  medicineTime?: string[]
  durationValue?: number
  durationUnit?: string
  route?: string
  specialInstructions?: string
  // Standard prescription header — denormalized onto every medicine in a single
  // submit. `examination` is internal clinical history and must be excluded from any
  // patient-facing prescription render (PDF/print/share).
  complaint?: string
  diagnosis?: string
  examination?: string
  advice?: string
  status: string
  startDate?: Date
  endDate?: Date
  prescribedBy?: mongoose.Types.ObjectId
  leadId?: mongoose.Types.ObjectId
  visitId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Comment ====================
export interface IMongoComment extends Document {
  _id: mongoose.Types.ObjectId
  commentId: mongoose.Types.ObjectId
  timelineId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  reportId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  comment: string
  commentBy: mongoose.Types.ObjectId
  commentByRole?: string
  parentCommentId?: mongoose.Types.ObjectId
  // Discriminator. 'CONSULTATION' marks comments authored from the Dr Consultation
  // composer; legacy comments default to 'GENERAL'. Lets the consultation thread
  // query (timelineId + type) ignore unrelated comments that may share a
  // timelineId.
  type?: 'CONSULTATION' | 'GENERAL' | string
  // Per-comment visibility. The Consultation row itself has no visibility — a
  // single consultation can mix public and private comments.
  visibility?: 'PUBLIC' | 'PRIVATE'
  // @-tags inside the comment text. Stored alongside the markup so the patient
  // portal / notification consumers don't have to re-parse the body.
  mentions?: { userId: string; display: string }[]
  // Back-link to Tasks the LLM auto-created from this specific comment. Lets the
  // detail dialog group "tasks created from this comment" beneath the comment.
  aiExtractedTaskIds?: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Cryo Slot Assignment ====================
// Single-source-of-truth occupancy ledger for cryo storage. Every frozen embryo
// or oocyte that lands in a physical slot creates exactly one ACTIVE row here
// (releasedAt: null). Released rows are kept for audit. A partial unique index
// on (orgId + 5 location fields) WHERE releasedAt: null guarantees two specimens
// cannot share one straw position — applies across embryos AND oocytes.
export type CryoOccupantType = 'EMBRYO' | 'OOCYTE'

export interface IMongoCryoSlotAssignment extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  // 5-tuple location — must exactly match the freezeLocation stored on the embryo/oocyte.
  tankId: string
  canister: string
  globules: string
  vizoColour: string
  storm: string
  // What's in the slot.
  occupantType: CryoOccupantType
  occupantId: mongoose.Types.ObjectId
  // Display id (E-00042 / O-00007) cached for UI tooltips without an extra lookup.
  displayId?: string
  // When the specimen was frozen into this slot. Comes from the FE form; defaults to now.
  frozenAt?: Date
  // Soft-release marker. Active rows have releasedAt: null. Released rows stay for audit.
  releasedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// ==================== Type Aliases for backward compatibility ====================
// These aliases map the new MongoDB interface names to the original names used in model files
export type IUser = IMongoUser
export type IUsersSession = IMongoUsersSession
export type IOrganization = IMongoOrganization
export type IPatient = IMongoPatient
export type IDoctor = IMongoDoctor
export type ILead = IMongoLead
export type ILeadSocial = IMongoLeadSocial
export type ILeadActivity = IMongoLeadActivity
export type IActivity = IMongoActivity
export type IAppointment = IMongoAppointment
export type ITask = IMongoTask
export type ITaskHistory = IMongoTaskHistory
export type IFollowUpHistory = IMongoFollowUpHistory
export type IPatientHistory = IMongoPatientHistory
export type IReport = IMongoReport
export type ICallActivity = IMongoCallActivity
export type ISocialContact = IMongoSocialContact
export type ISocialMessage = IMongoSocialMessage
export type IChatHistory = IMongoChatHistory
export type IAddress = IMongoAddress
export type IToken = IMongoToken
export type IPassword = IMongoPassword
export type IClientKey = IMongoClientKey
export type IS3TempKey = IMongoS3TempKey
export type IOrganizationConfiguration = IMongoOrganizationConfiguration
export type IOrganizationMasterData = IMongoOrganizationMasterData
export type ICryoSlotAssignment = IMongoCryoSlotAssignment
export type IRole = IMongoRole
export type IPermission = IMongoPermission
export type IRolePermission = IMongoRolePermission
export type IUserPermission = IMongoUserPermission
export type IWhatsappApiResponse = IMongoWhatsappApiResponse
export type IMetaWebhookPayload = IMongoMetaWebhookPayload
export type IAIError = IMongoAIError
export type IAIAnalysis = IMongoAIAnalysis

export type ILabTest = IMongoLabTest
export type ITreatmentType = IMongoTreatmentType
export type ITimelineEvent = IMongoTimelineEvent
// ITimelineTask removed — see note above; consumers use ITask (= IMongoTask).
// ITimelineSubtask removed — consumers use IMongoTaskSubtask (embedded on Task).
export type IAdAssignment = IMongoAdAssignment
export type IPhoneRouting = IMongoPhoneRouting
export type IWebhookRouting = IMongoWebhookRouting
export type ICopilotSession = IMongoCopilotSession
export type ICopilotConversation = IMongoCopilotConversation
export type ISOPTreatmentType = IMongoSOPTreatmentType
export type ISOPEvent = IMongoSOPEvent
export type ISOPTaskTemplate = IMongoSOPTaskTemplate
export type IPatientTimeline = IMongoPatientTimeline
export type ITimeline = IMongoTimeline
export type IMedicine = IMongoMedicine
export type IComment = IMongoComment
export type IPatientVisit = IMongoPatientVisit
export type IReminder = IMongoReminder
export type IFormResponse = IMongoFormResponse

// ==================== Form Response (per-field, per-submission) ====================
// Replaces the old `saveTo`/Patient-doc write-through. One row per filled field
// per submission. Keyed by `fieldKey` (the opaque id minted by the form builder)
// so renaming a form field's `name`/`label` never orphans existing answers and
// the underlying Patient mongoose schema is never exposed to the form builder UI.
//
// History semantics: every submission inserts new rows (we never UPDATE in place),
// so the latest answer for a field is `find({...}).sort({ submittedAt: -1 }).limit(1)`.
// Forms with `allowDuplicates: true` keep the full series; forms without it just
// query latest at render time.
export interface IMongoFormResponse extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  formId: string
  taskId?: mongoose.Types.ObjectId
  fieldKey: string
  // Mirror of the FE-side `field.name` at submission time. Stored alongside
  // `fieldKey` purely for human/debug readability — never used for lookup.
  fieldName?: string
  // Mixed: form fields can hold strings, numbers, dates, arrays (multi-select),
  // and bools (checkbox). Don't tighten this without a migration plan.
  value: any
  submittedBy: mongoose.Types.ObjectId
  submittedAt: Date
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient Visit (In/Out Tracking) ====================
export interface IMongoPatientVisit extends Document {
  _id: mongoose.Types.ObjectId
  visitId: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  checkInTime: Date
  checkOutTime?: Date
  duration?: number // minutes, calculated on check-out
  status: string // 'IN_PROGRESS' | 'COMPLETED'
  description?: string
  handledBy?: mongoose.Types.ObjectId
  medicines?: Array<{
    name: string
    dosage?: string
    frequency?: string
    duration?: string
    instructions?: string
  }>
  reportIds?: mongoose.Types.ObjectId[]
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Reminder ====================
export interface IMongoReminder extends Document {
  _id: mongoose.Types.ObjectId
  reminderId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  createdByUserId: mongoose.Types.ObjectId
  reminderDate: Date
  reminderType: string // 'WHATSAPP' | 'EMAIL' | 'CALL'
  reminderDirection: string // 'BEFORE' | 'AFTER'
  offsetMinutes: number // e.g. 30, 45, 60
  message?: string
  status: string // 'PENDING' | 'COMPLETED' | 'CANCELLED'
  isSent: boolean // whether the reminder was actually sent
  sentAt?: Date // timestamp when the reminder was sent
  sentVia?: string // channel used to send: 'WHATSAPP' | 'EMAIL' | 'CALL'
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== FollowUp ====================
export interface IFollowUp extends Document {
  _id: mongoose.Types.ObjectId
  followUpId: mongoose.Types.ObjectId // Same as _id
  leadId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  leadNumber?: number // Denormalized from Lead for search
  leadName?: string // Denormalized from Lead for search
  referenceId?: string // Denormalized from Lead for search
  followUpDate: Date
  notes?: string
  assignToUserId?: mongoose.Types.ObjectId
  status: string // 'PENDING' | 'COMPLETED' | 'CANCELLED'
  // Auto-dispatch tracking — see followUp.model.ts.
  lastSentAt?: Date | null
  sendAttempts?: number
  lastSendError?: string | null
  isDelete: boolean
  removedAt?: Date // Set when the follow-up is removed (manually or because the lead was deactivated)
  removedReason?: string // 'LEAD_DEACTIVATED' | 'MANUAL'
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Organization Media ====================
export interface IMongoOrgMedia extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  fileName: string
  fileType: string // MIME type e.g. audio/mp3, video/mp4, image/png
  fileSize?: number
  s3Key: string
  publicUrl: string
  description?: string
  category?: string // e.g. 'audio', 'video', 'image', 'document'
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type IOrgMedia = IMongoOrgMedia

// ==================== Pregnancy ====================
export interface IMongoPregnancy extends Document {
  _id: mongoose.Types.ObjectId
  pregnancyId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  conceptionType: string // 'NATURAL' | 'IUI' | 'IVF'
  sourceCycleId?: mongoose.Types.ObjectId
  sourceCycleType?: string // 'IUI' | 'IVF'
  lmpDate: Date
  eddDate: Date
  pregnancyType: string // 'NORMAL' | 'HIGH_RISK' | 'TWIN' | 'IVF'
  gravida?: number
  para?: number
  bloodGroup?: string
  rhFactor?: string
  assignedDoctorId?: mongoose.Types.ObjectId
  status: string // 'ACTIVE' | 'DELIVERED' | 'MISCARRIAGE' | 'TERMINATED' | 'ECTOPIC'
  pregnancyOutcome?: Record<string, any>
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IUI Cycle ====================
export interface IMongoIUIcycle extends Document {
  _id: mongoose.Types.ObjectId
  iuiCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  cycleNumber: number
  startDate: Date
  endDate?: Date
  protocolType?: string
  assignedDoctorId?: mongoose.Types.ObjectId
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  /** Links this cycle to its entry in `patient.activeTreatments[]` — see the
   *  matching field on IMongoIVFCycle. */
  treatmentInstanceId?: mongoose.Types.ObjectId
  monitoringRecords?: Record<string, any>[]
  triggerDetails?: Record<string, any>
  iuiDetails?: Record<string, any>
  lutealSupport?: Record<string, any>[]
  outcome?: Record<string, any>
  status: string // 'PLANNED' | 'MONITORING' | 'TRIGGERED' | 'INSEMINATED' | 'AWAITING_RESULT' | 'COMPLETED' | 'CANCELLED'
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Cycle ====================
// Nested sub-documents. Every record carries an `_id` so prescriptions,
// edits, and cross-collection refs can target a specific entry.

export interface IVFMedicationEntry {
  _id?: mongoose.Types.ObjectId
  name: string
  dosage?: string
  route?: string
}

export interface IVFStimulationDailyRecord {
  _id?: mongoose.Types.ObjectId
  date: Date | string
  day: string | number
  type?: 'Hospital' | 'Home' | 'Current' | 'Scheduled' | string
  rightOvary?: string
  leftOvary?: string
  endometriumThickness?: number | string
  hmg?: string
  fsh?: string
  antagonist?: string
  hcg?: string
  estradiol?: number | string
  lh?: number | string
  progesterone?: number | string
  medications?: IVFMedicationEntry[]
  follicles?: { left?: any; right?: any }
  videoKeyId?: string
  videoFileName?: string
  remarks?: string
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

/**
 * @deprecated Use IMongoIVFStimulation (from the ivf_stimulations collection)
 * for the source-of-truth stimulation record. This interface only describes
 * the legacy embedded shape on `IVFCycle.stimulation` / `stimulationHistory`
 * that remains during the collection-split migration.
 */
export interface IVFStimulationEmbedded {
  _id?: mongoose.Types.ObjectId
  startDate?: Date | string
  status?: 'ACTIVE' | 'TRIGGERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string
  protocol?: string
  protocolType?: string
  dailyRecords?: IVFStimulationDailyRecord[]
  triggerDetails?: {
    date?: Date | string
    medication?: string
    dosage?: string
    triggerTime?: string
  } | null
  completedAt?: Date | string
  completedBy?: mongoose.Types.ObjectId | string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFOocyteMaturityEntry {
  _id?: mongoose.Types.ObjectId
  stage: 'MII' | 'MI' | 'GV' | 'Abnormal' | string
  count: number
  description?: string
  issues?: string[]
}

/**
 * @deprecated Use IMongoIVFOPUPickup (from the ivf_opu_pickups collection)
 * for the source-of-truth pickup record. This interface only describes the
 * legacy embedded shape on `IVFCycle.opu.pickups[]`, which is retired once
 * the collection split completes.
 */
export interface IVFOPUPickupEmbedded {
  _id?: mongoose.Types.ObjectId
  pickupNumber: number
  date: Date | string
  status?: 'In Progress' | 'Completed' | 'Failed' | string
  folliclesAspirated?: number
  oocytesRetrieved?: number
  matureOocytes?: number
  miOocytes?: number
  gvOocytes?: number
  embryologistId?: mongoose.Types.ObjectId | string
  oocyteMaturity?: IVFOocyteMaturityEntry[]
  spermAnalysis?: {
    source?: string
    prewashCount?: number
    prewashMotility?: number
    postwashCount?: number
    postwashMotility?: number
    morphology?: number
  }
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFOPUSummary {
  totalFolliclesAspirated?: number
  totalOocytesRetrieved?: number
  totalMatureMII?: number
  totalMI?: number
  totalGV?: number
  lastComputedAt?: Date | string
}

export interface IVFOPU {
  _id?: mongoose.Types.ObjectId
  procedureDate?: Date | string
  procedureTime?: string
  anesthesia?: string
  duration?: number
  performedBy?: string
  embryologistId?: mongoose.Types.ObjectId | string
  folliclesAspirated?: number
  oocytesRetrieved?: number
  matureOocytes?: number
  immatureOocytes?: number
  abnormalOocytes?: number
  miOocytes?: number
  gvOocytes?: number
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED' | string
  pickups?: IVFOPUPickupEmbedded[]
  summary?: IVFOPUSummary
  complications?: string
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
  // Backward-compat legacy flat fields
  date?: Date | string
  totalOocytes?: number
  anesthesiaType?: string
}

export interface IVFPGTResult {
  _id?: mongoose.Types.ObjectId
  enabled?: boolean
  biopsyDay?: string
  biopsyDate?: Date | string
  pgtType?: 'PGT-A' | 'PGT-M' | 'PGT-SR' | string
  result?: 'Euploid' | 'Aneuploid' | 'Mosaic' | 'No Result' | string
  clinicalNotes?: string
}

export interface IVFEmbryoDay1 {
  status?: string
  pnCount?: number
  notes?: string
}

export interface IVFEmbryoDay3 {
  status?: string
  cellCount?: number
  fragmentation?: number | string
  grade?: string
  notes?: string
}

export interface IVFEmbryoDay5 {
  status?: string
  expansion?: number // 1-6
  icm?: 'A' | 'B' | 'C' | string
  te?: 'A' | 'B' | 'C' | string
  notes?: string
}

export interface IVFEmbryoDay6 {
  status?: string
  expansion?: number
  icm?: 'A' | 'B' | 'C' | string
  te?: 'A' | 'B' | 'C' | string
  notes?: string
}

export interface IVFFreezeLocation {
  tankId?: string
  canister?: string
  globules?: string
  vizoColour?: string
  storm?: string
  cane?: string
  position?: string
  frozenAt?: Date | string
}

export type IVFEmbryoPlantStatus =
  | 'FROZEN'
  | 'FRESH'
  | 'READY'
  | 'TRANSFERRED'
  | 'DISCARDED'
  | 'BIOPSIED'
  | 'ARRESTED'
  | 'NOT_ELIGIBLE'

export type IVFTransferRecommendation =
  | 'TRANSFER_RECOMMENDED'
  | 'TRANSFER_CONSIDER'
  | 'NOT_RECOMMENDED'

/**
 * @deprecated Use IMongoIVFEmbryo (from the ivf_embryos collection) for the
 * source-of-truth embryo record. This interface only describes the legacy
 * embedded shape on `IVFCycle.embryology.embryos[]` retired during the
 * collection-split migration.
 */
export interface IVFEmbryoEmbedded {
  _id?: mongoose.Types.ObjectId
  // DEPRECATED: legacy free-form id (kept for one release as legacyEmbryoId)
  embryoId?: string
  legacyEmbryoId?: string
  // New: per-org auto-increment integer. UI formats via formatEmbryoId(n) → "E-00091"
  embryoNumber?: number
  pickupNumber?: number
  pickupId?: mongoose.Types.ObjectId | string
  oocyteSource?: 'MII' | string
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | string
  fertilizationDate?: Date | string
  day1?: IVFEmbryoDay1
  day3?: IVFEmbryoDay3
  day5?: IVFEmbryoDay5
  day6?: IVFEmbryoDay6
  day1Status?: string
  day3Status?: string
  day5Status?: string
  grade?: string
  // Legacy flat status (kept for backward compat)
  status?: 'Fresh' | 'Frozen' | 'Discarded' | 'Biopsied' | 'Transferred' | 'Arrested' | string
  plantStatus?: IVFEmbryoPlantStatus | string
  transferRecommendation?: IVFTransferRecommendation | string
  manualOverrideStatus?: boolean
  pgt?: IVFPGTResult
  frozenLocation?: {
    tank?: string
    canister?: string
    cane?: string
    position?: string
  }
  freezeLocation?: IVFFreezeLocation
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFEmbryologySummary {
  fertilization?: number // Σ 2PN
  totalEmbryos?: number
  day5Blastocysts?: number
  readyCount?: number
  frozenCount?: number
  transferredCount?: number
  lastComputedAt?: Date | string
}

export interface IVFEmbryologyDelta {
  direction?: 'increased' | 'decreased' | 'unchanged' | string
  amount?: number
  detectedAt?: Date | string
}

export interface IVFEmbryology {
  _id?: mongoose.Types.ObjectId
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | string
  fertilizationDate?: Date | string
  oocytesInseminated?: number
  lastSyncedMatureMII?: number
  matureMIIDelta?: IVFEmbryologyDelta
  fertilizationCount?: number
  fertilizationRate?: number
  totalFertilized?: number
  totalEmbryos?: number
  day5Blastocysts?: number
  frozen?: number
  transferred?: number
  // Day-level fertilization breakdown
  twoPN?: number
  threePN?: number
  onePN?: number
  zeroPN?: number
  excellentGrade?: number
  goodGrade?: number
  fairGrade?: number
  embryos?: IVFEmbryoEmbedded[]
  summary?: IVFEmbryologySummary
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFETPTimelineEntry {
  _id?: mongoose.Types.ObjectId
  date: Date | string
  day: string
  thickness?: string | number
  pattern?: 'Thin' | 'Triple-line' | 'Double-line' | string
  estradiol?: string | number
  progesterone?: string | number
  medication?: string
  colorFlow?: 'Grade 1' | 'Grade 2' | 'Grade 3' | string
  /** Follicle counts/sizes for the day — right + left side. */
  follicle?: { right?: string; left?: string }
  /** Follicle blood-flow grade or free-form text. */
  follicleBloodFlow?: string
  /** LH (urinary/serum) value. */
  lh?: string | number
  /** Serum LH value — captured separately when both readings are taken. */
  serumLh?: string | number
  /** Trigger medication / time on the day Day-0 is planned. */
  trigger?: string
  remarks?: string
  isDay0?: boolean
}

export type IVFETPPreparationType = 'MODIFIED_CYCLE' | 'NATURAL_CYCLE' | 'ETP_CYCLE'

/**
 * @deprecated Use IMongoIVFETPCycle (from the ivf_etp_cycles collection)
 * for the source-of-truth ETP record. This interface only describes the
 * legacy embedded shape on `IVFCycle.endometrialPrep.cycles[]` retired
 * during the collection-split migration.
 */
export interface IVFETPCycleEmbedded {
  _id?: mongoose.Types.ObjectId
  prepNumber: number
  startDate?: Date | string
  status?: 'In Progress' | 'Completed' | 'Failed' | 'Cancelled' | string
  method?: 'Hormonal Replacement' | 'Natural Cycle' | 'Modified Natural' | 'Letrozole-based' | string
  day0Date?: Date | string
  transferDate?: Date | string
  timeline?: IVFETPTimelineEntry[]
  completedAt?: Date | string
  completedBy?: mongoose.Types.ObjectId | string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFEndometrialPrep {
  cycles?: IVFETPCycleEmbedded[]
  // Legacy flat fields kept for backward compatibility
  [key: string]: any
}

// ==================== IVF ETP Cycle (standalone collection) ====================
// One document per endometrial-preparation attempt. Only one may be
// `In Progress` per cycle at a time — backend enforces. Day records stay
// embedded on the doc (bounded, small, always read together). `COMPLETED`
// status is the gate the Transfer stage checks before creating a transfer.
export interface IMongoIVFETPCycle extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  prepNumber: number
  startDate: Date
  status: 'In Progress' | 'Completed' | 'Failed' | 'Cancelled' | string
  method?: 'Hormonal Replacement' | 'Natural Cycle' | 'Modified Natural' | 'Letrozole-based' | string
  /** Top-level clinical workflow: Modified / Natural / ETP. Drives the
   *  dynamic sub-options that get loaded on the ETP form. */
  preparationType?: IVFETPPreparationType | string
  day0Date?: Date
  transferDate?: Date
  /** Baseline endometrial thickness recorded at the start of the cycle. */
  baselineThickness?: string
  /** Baseline endometrial pattern (e.g. Trilaminar) at the start. */
  baselinePattern?: string
  /** Selected estrogen medication for the Hormonal Replacement protocol. */
  estrogenMedication?: string
  /** Free-text dosage instructions for the chosen estrogen medication. */
  estrogenDosage?: string
  timeline: IVFETPTimelineEntry[]
  completedAt?: Date
  completedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface IVFEmbryoSnapshot {
  embryoNumber: number
  grade?: string
  transferRecommendation?: IVFTransferRecommendation | string
  snapshottedAt: Date | string
}

/**
 * @deprecated Use IMongoIVFTransfer (from the ivf_transfers collection)
 * for the source-of-truth transfer record. This interface only describes
 * the legacy embedded shape on `IVFCycle.transfer.transfers[]` retired
 * during the collection-split migration.
 */
export interface IVFTransferItemEmbedded {
  _id?: mongoose.Types.ObjectId
  transferNumber: number
  date: Date | string
  time?: string
  status?: 'Completed' | 'Ongoing' | 'Failed' | string
  transferType?: 'Fresh' | 'Frozen' | string
  etpPrepId?: mongoose.Types.ObjectId | string
  embryoNumbers?: number[]
  embryoSnapshots?: IVFEmbryoSnapshot[]
  details?: {
    embryoIds?: string[]
    embryoType?: string
    embryoGrade?: string
    embryoCount?: number
    day?: string
    endometriumThickness?: string | number
    endomColorFlow?: string
    catheterType?: string
    difficulty?: 'Easy' | 'Moderate' | 'Difficult' | string
    guidanceUsed?: string
    distanceFromFundus?: string | number
    transferMethod?: string
    performedBy?: string
    ultrasoundGuided?: boolean
  }
  medications?: string[]
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
  notes?: string
  createdBy?: mongoose.Types.ObjectId | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface IVFTransferSummary {
  totalTransfers?: number
  lastTransferDate?: Date | string
  lastOutcome?: 'Positive' | 'Negative' | 'Ongoing' | null | string
}

/**
 * @deprecated Legacy embedded wrapper on `IVFCycle.transfer` retired during
 * the collection-split migration. Use the `ivf_transfers` collection.
 */
export interface IVFTransferEmbedded {
  transfers?: IVFTransferItemEmbedded[]
  summary?: IVFTransferSummary
  // Legacy flat single-transfer fields
  [key: string]: any
}

// ==================== IVF Transfer (standalone collection) ====================
// One document per transfer attempt. Only ONE may be active (`Ongoing`)
// per cycle at a time. A transfer requires at least one embryo with
// `plantStatus === 'READY'` AND the latest ETP `status === 'Completed'`
// on the parent IVF cycle — backend enforces both gates. On save, the
// referenced embryos flip to `plantStatus = 'TRANSFERRED'`.
export interface IMongoIVFTransfer extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  transferNumber: number
  date: Date
  time?: string
  status: 'Ongoing' | 'Completed' | 'Failed' | string
  transferType?: 'Fresh' | 'Frozen' | string
  etpPrepId?: mongoose.Types.ObjectId
  /** Embryo IDs that went into this transfer — refs to `ivf_embryos`. */
  embryoIds: mongoose.Types.ObjectId[]
  /** Frozen copy of the embryos at transfer time for audit (numbers + grades). */
  embryoSnapshots: IVFEmbryoSnapshot[]
  details?: {
    embryoType?: string
    embryoGrade?: string
    embryoCount?: number
    day?: string
    endometriumThickness?: string | number
    endomColorFlow?: string
    catheterType?: string
    difficulty?: 'Easy' | 'Moderate' | 'Difficult' | string
    guidanceUsed?: string
    distanceFromFundus?: string | number
    transferMethod?: string
    performedBy?: string
    ultrasoundGuided?: boolean
  }
  /**
   * Denormalized summary of the outcome linked to this transfer. Written by
   * `IVFOutcomeService` on outcome create / update / decision so the
   * Transfer tab can show the final result (Positive / Negative /
   * Biochemical / Ectopic) without fetching the outcomes collection.
   */
  outcomeSummary?: {
    outcomeId: mongoose.Types.ObjectId
    result?: 'POSITIVE' | 'NEGATIVE' | 'BIOCHEMICAL' | 'ECTOPIC' | 'PENDING'
    decision?: 'NONE' | 'PREGNANCY_STARTED' | 'NEW_CYCLE_STARTED'
    updatedAt?: Date
  } | null
  medications?: string[]
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type IVFOutcomeDecision = 'NONE' | 'PREGNANCY_STARTED' | 'NEW_CYCLE_STARTED'

/**
 * @deprecated Use IMongoIVFOutcome (from the ivf_outcomes collection) for
 * the source-of-truth outcome record. This interface only describes the
 * legacy embedded shape on `IVFCycle.outcome` retired during the
 * collection-split migration.
 */
export interface IVFOutcomeEmbedded {
  _id?: mongoose.Types.ObjectId
  transferId?: mongoose.Types.ObjectId | string
  pregnancyTestDate?: Date | string
  daysPostTransfer?: number
  betaHcgValue?: number
  result?: 'POSITIVE' | 'NEGATIVE' | 'BIOCHEMICAL' | 'ECTOPIC' | 'PENDING' | string
  progesterone?: number
  secondBetaHcgDate?: Date | string
  secondBetaHcgValue?: number
  firstUltrasoundDate?: Date | string
  gestationalSacsSeen?: number
  fetalHeartbeat?: 'detected' | 'not-detected' | 'not-applicable' | string
  numberOfFetuses?: number
  clinicalPregnancy?: boolean
  decision?: IVFOutcomeDecision | string
  pregnancyId?: mongoose.Types.ObjectId | string | null
  nextCycleId?: mongoose.Types.ObjectId | string | null
  decidedAt?: Date | string
  decidedBy?: mongoose.Types.ObjectId | string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
  notes?: string
  createdBy?: mongoose.Types.ObjectId | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// ==================== IVF Outcome (standalone collection) ====================
// One document per outcome recorded against a transfer. Positive outcomes
// transition to a Pregnancy record via `startPregnancy`; negative outcomes
// can spawn a fresh IVF cycle via `startNewCycle`. Keeps the decision +
// cross-references (`pregnancyId`, `nextCycleId`) on the same doc so the
// audit trail for what happened after each transfer lives in one place.
export interface IMongoIVFOutcome extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  transferId?: mongoose.Types.ObjectId
  pregnancyTestDate?: Date
  daysPostTransfer?: number
  betaHcgValue?: number
  result?: 'POSITIVE' | 'NEGATIVE' | 'BIOCHEMICAL' | 'ECTOPIC' | 'PENDING' | string
  progesterone?: number
  secondBetaHcgDate?: Date
  secondBetaHcgValue?: number
  firstUltrasoundDate?: Date
  gestationalSacsSeen?: number
  fetalHeartbeat?: 'detected' | 'not-detected' | 'not-applicable' | string
  numberOfFetuses?: number
  clinicalPregnancy?: boolean
  decision: IVFOutcomeDecision | string
  pregnancyId?: mongoose.Types.ObjectId
  nextCycleId?: mongoose.Types.ObjectId
  decidedAt?: Date
  decidedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface IVFFrozenEmbryo {
  _id?: mongoose.Types.ObjectId
  embryoId: string
  freezeDate?: Date | string
  tankLocation?: {
    tank?: string
    canister?: string
    cane?: string
    position?: string
  }
  grade?: string
}

export interface IMongoIVFCycle extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  cycleNumber: number
  cycleType: string // 'SELF' | 'OVUM_DONOR' | 'SPERM_DONOR' | 'EMBRYO_DONOR' | 'SELF_PLUS_DONOR'
  cycleKind: 'IVF' | 'EGG_FREEZING'
  /** Links this cycle to its entry in `patient.activeTreatments[]`. Stamped on
   *  create so the cycle is a first-class active-treatment instance (drives the
   *  IPD admit picker, the treatment journey, and per-instance completion).
   *  Flipped to COMPLETED/CANCELLED on the patient when the cycle terminates. */
  treatmentInstanceId?: mongoose.Types.ObjectId
  freezeTarget?: 'OOCYTE_ONLY' | 'EMBRYO'
  protocolType?: string
  assignedDoctorId?: mongoose.Types.ObjectId
  embryologistId?: mongoose.Types.ObjectId
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  stimulation?: IVFStimulationEmbedded | Record<string, any>
  /** Archived prior stimulations for this cycle. A single IVF cycle can have
   *  several stimulations (e.g. first one cancelled, a second one
   *  completed). The `stimulation` field is always the current / latest;
   *  every time a new one is started on top of a terminal (CANCELLED /
   *  FAILED) stim, the old one is pushed here so the full history is
   *  preserved.
   *  @deprecated Once the collection-split migration completes, history
   *  lives in the `ivf_stimulations` collection. */
  stimulationHistory?: IVFStimulationEmbedded[] | Record<string, any>[]
  opu?: IVFOPU | Record<string, any>
  spermCollection?: Record<string, any>
  embryology?: IVFEmbryology | Record<string, any>
  transfer?: IVFTransferEmbedded | Record<string, any>
  endometrialPrep?: IVFEndometrialPrep | Record<string, any>
  frozenEmbryos?: IVFFrozenEmbryo[] | Record<string, any>[]
  donorId?: mongoose.Types.ObjectId
  donorCode?: string
  outcome?: IVFOutcomeEmbedded | Record<string, any>
  status: string // 'PLANNED' | 'STIMULATION' | 'TRIGGERED' | 'OPU_DONE' | 'FERTILIZATION' | 'ETP_IN_PROGRESS' | 'TRANSFER_READY' | 'POST_ET' | 'OUTCOME_POSITIVE' | 'OUTCOME_NEGATIVE' | 'COMPLETED' | 'CANCELLED' | 'FREEZE_ALL'
  metadata?: Record<string, any>
  endDate?: Date
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Prescription ====================
export interface IVFPrescriptionMedicine {
  _id?: mongoose.Types.ObjectId
  name: string
  dosage: string
  frequency: string
  timing?: string
  duration?: string
  route?: string
  instructions?: string
}

export interface IVFPrescriptionContextRef {
  stimulationDayId?: mongoose.Types.ObjectId | string
  pickupNumber?: number
  pickupId?: mongoose.Types.ObjectId | string
  embryoId?: string
  embryoNumber?: number
  etpPrepId?: mongoose.Types.ObjectId | string
  etpDayId?: mongoose.Types.ObjectId | string
  transferId?: mongoose.Types.ObjectId | string
  outcomeId?: mongoose.Types.ObjectId | string
}

export interface IMongoIVFPrescription extends Document {
  _id: mongoose.Types.ObjectId
  prescriptionId: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  stage: 'stimulation' | 'opu' | 'embryology' | 'etp' | 'transfer' | 'outcome' | string
  stageRecordId?: mongoose.Types.ObjectId
  contextRef?: IVFPrescriptionContextRef
  prescribedBy?: mongoose.Types.ObjectId
  prescriptionDate: Date
  medicines: IVFPrescriptionMedicine[]
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF OPU Pickup (standalone collection) ====================
// One document per pickup attempt on an IVF cycle. Only one pickup may be
// `In Progress` per cycle at a time; totals (Follicles Aspirated, Oocytes
// Retrieved, Mature MII) on the parent cycle's `opu` summary are recomputed
// on every mutation, and the embryology `oocytesInseminated` is kept in
// sync via write-through in the service layer.
export interface IMongoIVFOPUPickup extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  pickupNumber: number
  date: Date
  /** Procedure time — free-form `HH:mm` string captured in the dialog. */
  procedureTime?: string
  /** Clinical pathway: `ICSI` → fertilization, `FREEZE` → cryopreservation. */
  pickupType?: 'ICSI' | 'FREEZE' | string
  /** Origin of the oocytes in this pickup. Fresh requires completed stim; Frozen/Donor bypass the stim-completed gate. */
  opuSourceType?: 'FRESH' | 'FROZEN' | 'DONOR' | string
  /** Required when opuSourceType=FROZEN — points at an ivf_oocyte_batches doc. */
  sourceBatchId?: mongoose.Types.ObjectId
  /** Required when opuSourceType=DONOR — points at a Donor doc (donorType=OVUM). */
  sourceDonorId?: mongoose.Types.ObjectId
  /** Number of oocytes pulled from the source batch / donor in this pickup. */
  consumedQty?: number
  /** FROZEN OPU only — survival % after thaw. */
  survivalRate?: number
  /** DONOR OPU only — date the clinic received the donor sample. */
  receivedDate?: Date
  status: 'In Progress' | 'Completed' | 'Failed' | string
  folliclesAspirated: number
  oocytesRetrieved: number
  matureOocytes: number
  miOocytes: number
  gvOocytes: number
  embryologistId?: mongoose.Types.ObjectId
  /** Free-form anesthesia label (e.g. `iv-sedation`, `general`). */
  anesthesiaType?: string
  /** Fertilization method — constrained to the enum at the schema level. */
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED' | string
  oocyteMaturity?: IVFOocyteMaturityEntry[]
  /** Per-pickup MII clinical grading — only meaningful when matureOocytes > 0. */
  oocyteQuality?: {
    cytoplasm?: string
    zonaPellucida?: string
    polarBody?: string
    perivitellineSpace?: string
    remarks?: string
  }
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient Sperm Record (standalone collection) ====================
// One document per sperm analysis captured for a PATIENT. Records are
// part of the patient's medical history and persist across IVF cycles —
// not created per cycle. `ivfCycleId` is optional: tag it for audit when
// the record was collected during an active cycle, but the same record
// is reused across future cycles for the same patient.
export interface IMongoIVFSpermRecord extends Document {
  _id: mongoose.Types.ObjectId
  /** Optional — tags the cycle that was active when the record was taken. */
  ivfCycleId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  date: Date
  source: 'EJACULATE' | 'TESA' | 'PESA' | 'DONOR' | 'FREEZE' | 'FROZEN' | string
  donorId?: mongoose.Types.ObjectId
  /** Batch this aliquot is part of (when the record is one unit inside a sperm_batches doc). */
  batchId?: mongoose.Types.ObjectId
  /** 1-based aliquot index inside the batch (display only). */
  numberInBatch?: number
  /** Lifecycle for individual aliquots in a batch. FROZEN/THAWED/USED/DISCARDED. Optional for legacy records that aren't tied to a batch. */
  freezeStatus?: 'FROZEN' | 'THAWED' | 'USED' | 'DISCARDED' | string
  /** Origin of sperm for THIS record — same axis as opuSourceType on OPU pickups. */
  sourceType?: 'FRESH' | 'FROZEN' | 'DONOR' | string
  sourceBatchId?: mongoose.Types.ObjectId
  sourceDonorId?: mongoose.Types.ObjectId
  consumedQty?: number
  prewashCount?: number
  prewashMotility?: number
  postwashCount?: number
  postwashMotility?: number
  morphology?: number
  volume?: number
  totalMotile?: number
  collectionMethod?: string
  abstinence?: string
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Sperm Batch (standalone collection) ====================
// Mirrors `ivf_oocyte_batches`: groups N frozen sperm aliquots into a
// single cryo slot. The per-aliquot rows live in `sperm_records` with
// `batchId` + `freezeStatus`. Patient-scoped (sperm records carry the
// patient, not the cycle) — `ivfCycleId` is optional audit tagging only.
export interface IMongoSpermBatch extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  /** Optional — the sperm_records doc this batch was frozen from. */
  sourceSpermRecordId?: mongoose.Types.ObjectId
  batchNumber: number
  source: 'EJACULATE' | 'TESA' | 'PESA' | 'DONOR' | string
  count: number
  freezeLocation?: {
    tankId?: string
    canister?: string
    globules?: string
    vizoColour?: string
    storm?: string
    cane?: string
    position?: string
    frozenAt?: Date
  }
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Embryo (standalone collection) ====================
// One document per embryo. The `embryoNumber` is an auto-incrementing
// per-org integer used to render the spec's `E-00091` display id — new
// docs ALWAYS receive one (seeded via `getNextSequence(orgId, 'embryo')`).
// `transferRecommendation` is derived from the grade via `evaluateEmbryo()`
// on every write unless `manualOverrideStatus === true`. `plantStatus`
// flips to `READY` when the embryo is clinically eligible for transfer —
// that's the gate the Transfer stage checks before creating a transfer.
export interface IMongoIVFEmbryo extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  embryoNumber: number
  /** Source pickup in the embryo's current cycle. Absent for embryos
   *  linked in from another cycle (no pickup in the receiving cycle). */
  pickupNumber?: number
  opuPickupId?: mongoose.Types.ObjectId
  /** Cross-cycle link audit — set when this embryo was moved into
   *  `ivfCycleId` from another cycle (past egg-freezing cycle, optionally
   *  a different patient for donor cases). */
  originalIvfCycleId?: mongoose.Types.ObjectId
  originalPatientId?: mongoose.Types.ObjectId
  linkedFromBatchId?: mongoose.Types.ObjectId
  linkedAt?: Date
  linkedBy?: mongoose.Types.ObjectId
  oocyteSource?: string
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED' | string
  fertilizationDate?: Date
  day1?: IVFEmbryoDay1
  day3?: IVFEmbryoDay3
  day5?: IVFEmbryoDay5
  day6?: IVFEmbryoDay6
  /** Current lifecycle state. Default FROZEN per spec. */
  plantStatus: IVFEmbryoPlantStatus | string
  /** Doctor-visible status derived from grade unless overridden. */
  transferRecommendation?: IVFTransferRecommendation | string
  /** When true, service skips auto-evaluation on grade updates. */
  manualOverrideStatus?: boolean
  grade?: {
    expansion?: number
    icm?: 'A' | 'B' | 'C' | string
    te?: 'A' | 'B' | 'C' | string
  }
  pgt?: IVFPGTResult
  freezeLocation?: IVFFreezeLocation
  /** Optional pointer at an `ivf_oocyte_batches` doc with entityType='EMBRYO'. */
  batchId?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Oocyte (standalone collection) ====================
// One document per *individually-tracked* oocyte. Most oocytes from a
// pickup never become individual records — they're just counted (MII/MI/
// GV) on the pickup doc and then either fertilised into embryos or
// discarded. A document is only created when an oocyte's lifecycle
// diverges from the pickup-level aggregate — most commonly when the
// clinician *freezes* an oocyte for later use (e.g. fertility
// preservation, or banking before chemo).
//
// `oocyteNumber` is an auto-incrementing per-org counter (`O-00001`
// display id) seeded via `getNextSequence(orgId, 'oocyte')` so each
// frozen oocyte carries a unique, scannable id for the cryo log.
// `FRESH` covers oocytes recorded *without* being physically frozen — the
// typical MI/GV case where the clinician wants the per-egg history (id,
// quality notes) preserved for future reference, but no straw is occupied.
// MII oocytes always start at `FROZEN`.
export type IVFOocyteFreezeStatus =
  | 'FRESH'
  | 'FROZEN'
  | 'THAWED'
  | 'USED_FOR_EMBRYO'
  | 'DISCARDED'

export type IVFOocyteSource = 'MII' | 'MI' | 'GV'

export interface IMongoIVFOocyte extends Document {
  _id: mongoose.Types.ObjectId
  /** Cycle this oocyte was retrieved in. */
  ivfCycleId: mongoose.Types.ObjectId
  /** Patient this oocyte belongs to (denormalised for cross-cycle lookups). */
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  oocyteNumber: number
  /** Source pickup — required since oocytes always originate from a pickup. */
  pickupNumber: number
  opuPickupId: mongoose.Types.ObjectId
  /** Batch grouping these eggs into a single cryo slot. Backfilled by the
   *  oocyte-batch migration for rows created before batches existed. */
  batchId?: mongoose.Types.ObjectId
  /** 1-based position within `batchId`. */
  numberInBatch?: number
  /** Maturity at retrieval (MII/MI/GV). */
  source: IVFOocyteSource | string
  /** Lifecycle state. Default FROZEN — bare records are created on freeze. */
  freezeStatus: IVFOocyteFreezeStatus | string
  /** Cryo-storage coordinates. Reuses the embryo freeze-location shape. */
  freezeLocation?: IVFFreezeLocation
  /** When THAWED → which embryo (if any) it became. Audit pointer only. */
  resultingEmbryoId?: mongoose.Types.ObjectId
  thawedAt?: Date
  /** Why this oocyte was thawed. Recorded once at thaw time so the cryo log
   *  can answer "how many eggs left this storage for IVF / donation / research /
   *  discard." Only meaningful when `freezeStatus === 'THAWED'`. */
  thawPurpose?: 'IVF_CYCLE' | 'DONATION' | 'RESEARCH' | 'DISCARDED' | string
  /** If thawed for an IVF cycle, the cycle that received the egg. Optional —
   *  the clinician may thaw before deciding the target cycle. */
  thawedForIvfCycleId?: mongoose.Types.ObjectId
  /** Free-form notes captured at thaw time (separate from the freeze `notes`). */
  thawNotes?: string
  thawedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Oocyte Batch (standalone collection) ====================
// Groups N per-egg `ivf_oocytes` docs into a single freeze batch. One batch =
// one cryo slot. Batches are homogeneous (single maturity class).
export interface IMongoIVFOocyteBatch extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  /** Discriminator. OOCYTE (default) groups ivf_oocytes; EMBRYO groups
   *  ivf_embryos via embryo.batchId. */
  entityType?: 'OOCYTE' | 'EMBRYO' | string
  /** Source pickup. Required for OOCYTE batches; absent for EMBRYO. */
  opuPickupId?: mongoose.Types.ObjectId
  /** 1-based per cycle. Restarts in each cycle (clinicians think per-cycle). */
  batchNumber: number
  /** Single maturity class — only meaningful for OOCYTE batches. */
  maturityClass?: 'MII' | 'MI' | 'GV' | string
  /** Denormalised count for cheap list rendering. */
  count: number
  /** 5-level cryo coordinates shared by every member of the batch. */
  freezeLocation?: IVFFreezeLocation
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Stimulation (standalone collection) ====================
// Each document represents one ovarian stimulation attempt belonging to an
// IVF cycle. A single IVF cycle can have multiple stimulation docs (e.g.
// first cancelled, second completed). The parent `IVFCycle.stimulation`
// field will become a summary projection (latestId, status, startDate,
// count, updatedAt) that's kept in sync by this collection's service layer.
export interface IMongoIVFStimulation extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  attemptNumber: number
  startDate: Date
  status: 'ACTIVE' | 'TRIGGERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string
  protocol?: string
  protocolType?: string
  dailyRecords: IVFStimulationDailyRecord[]
  triggerDetails?: {
    date?: Date | string
    medication?: string
    dosage?: string
    triggerTime?: string
  } | null
  completedAt?: Date
  completedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Donor ====================
export interface IMongoDonor extends Document {
  _id: mongoose.Types.ObjectId
  donorId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  donorCode: string
  donorType: string // 'SPERM' | 'OVUM' | 'EMBRYO'
  realName: string
  anonymousName?: string
  age?: number
  bloodGroup?: string
  rhFactor?: string
  ethnicity?: string
  height?: number
  weight?: number
  education?: string
  occupation?: string
  skinColor?: string
  hairColor?: string
  eyeColor?: string
  medicalHistory?: Record<string, any>
  screening?: Record<string, any>
  storage?: Record<string, any>
  usageHistory?: Record<string, any>[]
  status: string // 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'QUARANTINE' | 'RETIRED'
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Donor Request ====================
export interface IMongoDonorRequest extends Document {
  _id: mongoose.Types.ObjectId
  donorRequestId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  requestType: string // 'SPERM' | 'OVUM' | 'EMBRYO'
  requestedBy: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  cycleId: mongoose.Types.ObjectId
  cycleType: string // 'IUI' | 'IVF'
  preferences?: Record<string, any>
  assignedDonorId?: mongoose.Types.ObjectId
  assignedBy?: mongoose.Types.ObjectId
  assignedDate?: Date
  unitsRequested: number
  status: string // 'PENDING' | 'ASSIGNED' | 'APPROVED' | 'FULFILLED' | 'REJECTED' | 'CANCELLED'
  rejectionReason?: string
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}



// ==================== User ====================
export interface IUserExotelCredentials {
  sipId: string
  sipSecret: string
  exotelUserId?: string
  registeredAt?: Date
  // Toggled by the agent's softphone widget. When false, pickAgentForIncomingCall
  // skips this user. Undefined / true → eligible.
  isAvailable?: boolean
  availabilityUpdatedAt?: Date
  // VirtualNumber currently bound to this agent on Exotel's side
  // (from the /usermapping registration). Compared against the org's
  // current exotelConfiguration.virtualNumber on every call; on mismatch
  // we push the org value back to Exotel so the recipient always sees
  // the number from OrganizationConfiguration, not a stale per-user one.
  lastSyncedVirtualNumber?: string
}

export interface IMongoUser extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roles: string[]
  mobileNumber: string
  countryCode?: string
  userName?: string
  email?: string
  isVerified: boolean
  orgId: mongoose.Types.ObjectId
  isMainAdmin: boolean
  isBlocked: boolean
  isActive: boolean
  isDelete: boolean
  lastLoginAt?: Date
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  exotel?: IUserExotelCredentials
  createdAt: Date
  updatedAt: Date
}

// ==================== Users Session ====================
export interface IMongoUsersSession extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  deviceName?: string
  deviceType?: string
  deviceId?: string
  location?: string
  version?: string
  loginTime: Date
  expiresAt: Date
  isMainDevice: boolean
  isActive: boolean
  isDelete: boolean
  isBlocked: boolean
  latitude?: number
  longitude?: number
  isVerified: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Organization ====================
export interface IMongoOrganization extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  adminMobile: string
  adminEmail: string
  orgName?: string
  orgShortName?: string
  countryCode?: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient ====================
export interface IMongoPatient extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  patientNumber: number // Auto-incrementing patient number
  name: string
  source?: string
  mobileNumber: string
  referenceId: string
  countryCode?: string
  age?: string
  email?: string
  stage?: string
  maritalStatus: string
  currentCondition?: string
  gender: string
  medicalHistory: string[]
  isDelete: boolean
  orgId: mongoose.Types.ObjectId
  assignDoctorId?: mongoose.Types.ObjectId
  aiSummary?: string
  notes?: string
  // Registration
  registrationNumber?: string
  registrationDate?: Date
  // Discriminated nested object for new writes; plain string for legacy rows
  // written before the structured shape was introduced. `hospitalName` is
  // persisted only when type === 'DOCTOR'.
  referredBy?: string | {
    type?: 'DOCTOR' | 'ASHA_WORKER' | 'OTHER'
    name?: string
    phone?: string
    area?: string
    hospitalName?: string
  }
  treatmentType?: string
  // Wife extras
  bloodGroup?: string
  profession?: string
  aadharNumber?: string
  address?: string
  city?: string
  // Identity of the patient's opposite-sex partner. Distinct from `femalePartner` /
  // `malePartner` below, which are CLINICAL sub-docs.
  partner?: {
    name?: string
    age?: string
    bloodGroup?: string
    profession?: string
    phoneNumber?: string
    email?: string
    aadharNumber?: string
  }
  // Marriage & Infertility
  marriageDate?: Date
  yearsMarried?: number
  yearsTryingToConceive?: number
  infertilityType?: string
  // Female Partner
  femalePartner?: {
    menstrualHistory?: {
      lastMenstrualPeriod?: Date
      cycleDuration?: number
      cycleLength?: number
      cycleRegularity?: string
      menarcheAge?: number
      menstrualFlow?: string
      dysmenorrhea?: string
    }
    amhReport?: {
      amhValue?: number
      testDate?: Date
      afcRightOvary?: number
      afcLeftOvary?: number
      interpretation?: string
    }
    pregnancyHistory?: {
      gravida?: number
      para?: number
      abortion?: number
      living?: number
      ectopic?: number
      molar?: number
      details?: string
    }
    pastMedicalHistory?: string
    familyMedicalHistory?: string
    previousSurgeries?: string[]
    chronicConditions?: string[]
    generalExamination?: {
      heightCm?: number
      weightKg?: number
      bmi?: number
      bloodPressure?: string
      pulseBpm?: number
      temperatureF?: number
    }
    systematicExamination?: {
      cvs?: string
      rs?: string
      abdomen?: string
      pallor?: string
      icterus?: string
      edema?: string
      breast?: string
      thyroid?: string
    }
    currentMedications?: string[]
    allergies?: string[]
    lifestyleFactors?: {
      alcoholConsumption?: string
      smoking?: string
      dietPattern?: string
      exerciseRoutine?: string
      stressLevel?: string
      sleepQuality?: string
    }
    sexualHealthHistory?: {
      sexuallyActive?: string
      frequencyOfIntercourse?: string
      sexualDysfunction?: string
      painDuringIntercourse?: string
      contraceptionHistory?: string
    }
  }
  // Male Partner
  malePartner?: {
    pastMedicalHistory?: string
    familyMedicalHistory?: string
    previousSurgeries?: string[]
    chronicConditions?: string[]
    allergies?: string[]
    lifestyleFactors?: {
      alcoholConsumption?: string
      smoking?: string
      dietPattern?: string
      exerciseRoutine?: string
      occupationalHazards?: string
      stressLevel?: string
    }
    sexualHealthHistory?: {
      erectileDysfunction?: string
      ejaculatoryIssues?: string
      libidoLevel?: string
      sexualSatisfaction?: string
    }
    semenAnalysis?: {
      testDate?: Date
      volumeMl?: number
      countMillionPerMl?: number
      motilityPercent?: number
      normalMorphologyPercent?: number
      abstinenceDays?: number
      interpretation?: string
    }
    currentMedications?: string[]
  }
  // Registration Step (0=not started, 1=form1 done, 2=form2 done, 3=all complete)
  registrationStep?: number
  treatmentCategory?: string
  // Treatment Reference
  activeTreatmentPlanId?: mongoose.Types.ObjectId
  // SOP Fields
  patientType?: string
  activePatientTimelineId?: mongoose.Types.ObjectId
  section?: string
  pregnancyStatus?: string
  priorityFlag?: string
  previousLSCS?: boolean
  numberOfPreviousLSCS?: number
  conceptionMethod?: string
  edd?: Date
  // IPD (in-patient department) admission state. Independent of `treatmentType`/
  // `status` — patient can be admitted while also in a treatment cycle. Discharge
  // gate finds open IPD work via Task filter on patientId + treatmentCategory:'IPD'.
  //
  // LEGACY: single-instance fields. Kept populated as a write-through shim during
  // the multi-instance migration so old readers don't break. Sourced from the
  // last ACTIVE entry of `ipds[]` (or undefined if no IPD is active). Plan to
  // drop in PR 4 once every caller reads `ipds[]` directly.
  ipd?: {
    active: boolean
    startedAt?: Date
    endedAt?: Date
  }
  // Multi-instance treatments. A patient can run several DIFFERENT treatment
  // SOPs concurrently (e.g. IVF + a parallel medication-only protocol) but
  // not two instances of the same SOP at once. The "no duplicate active SOP"
  // rule is enforced in TreatmentFlowService.startTreatment.
  activeTreatments?: Array<{
    instanceId: mongoose.Types.ObjectId
    treatmentType: string        // SOP name, mirrors legacy patient.treatmentType
    sopId?: mongoose.Types.ObjectId
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    startedAt: Date
    endedAt?: Date
  }>
  // Multi-instance IPD admissions, each scoped to one `activeTreatments[].instanceId`.
  // Starting a second IPD for the same `treatmentInstanceId` while another is still
  // ACTIVE is rejected with 409 IPD_ALREADY_ACTIVE.
  ipds?: Array<{
    instanceId: mongoose.Types.ObjectId
    // Treatment scope. Nullable for legacy stand-alone admits captured during the
    // migration window; new admits always carry a value (see TreatmentFlowService.admitIpd).
    treatmentInstanceId?: mongoose.Types.ObjectId | null
    sopId?: mongoose.Types.ObjectId   // SOPTreatmentType._id captured at admit time
    status: 'ACTIVE' | 'DISCHARGED'
    startedAt: Date
    endedAt?: Date
  }>
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Doctor ====================
export interface IMongoDoctor extends Document {
  _id: mongoose.Types.ObjectId
  doctorId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  name: string
  specialization: string[]
  qualifications: string[]
  registrationNumber?: string
  experienceYears: number
  mobileNumber: string
  countryCode?: string
  orgId: mongoose.Types.ObjectId
  email: string
  consultationFee?: number
  languagesSpoken: string[]
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Current Follow Up (embedded in Lead) ====================
export interface ICurrentFollowUp {
  followUpId?: mongoose.Types.ObjectId
  followUpDate?: Date
  status?: string // 'PENDING' | 'COMPLETED' | 'CANCELLED'
  assignToUserId?: mongoose.Types.ObjectId
  notes?: string
}

// ==================== Lead ====================
export interface IMongoLead extends Document {
  _id: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  leadNumber: number // Auto-incrementing lead number
  orgId: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  name: string
  referenceId?: string
  lastCallId?: string
  hasMissedCall?: boolean
  leadResourceId?: string
  aiSummary?: string
  others?: string
  description?: string
  mobileNumber?: string
  email?: string
  source?: string
  status: string
  assignUserId?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  isBlock: boolean
  followUpDate?: Date
  followupCounts: number
  reminderCount: number
  unReadMessageCount: number
  // Unread inbound emails. Bumped in the same atomic update as emailCount on
  // inbound links; reset to zero when the user opens the lead's email view.
  // Outbound sends never touch this counter.
  unReadEmailCount: number
  // Lifetime count of emails (inbound + outbound) tied to this lead. Stamped at
  // the source events: createLeadFromEmail bumps it when a UserEmail is freshly
  // linked, sendEmailToLead bumps it on a successful outbound send. Never
  // decrements — purely a "how busy is this conversation" indicator.
  emailCount: number
  requiredFollowup: boolean
  userSentimentSummary?: string
  age?: number
  gender?: string
  isValidName: boolean
  dob?: string
  language?: string
  malePartner?: Record<string, any>
  femalePartner?: Record<string, any>
  marriedSince?: string
  referral?: Record<string, any>
  sourceId?: string
  adId?: string // Ad ID from ad assignment (for UI filtering)
  centerName?: string
  routingPhoneNumber?: string
  sourceTags: string[]
  refersBy?: string
  campLocation?: string
  lastActivityAt?: Date
  visitStatus?: string // 'IN' | 'OUT'
  lastCheckIn?: Date
  lastCheckOut?: Date
  totalVisits?: number
  currentFollowUp?: ICurrentFollowUp
  currentAppointment?: Date | null
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Lead Social ====================
export interface IMongoLeadSocial extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  leadId: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  whatsappId?: string
  instagramId?: string
  messengerId?: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Lead Activity ====================
export interface IMongoLeadActivity extends Document {
  _id: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  apiSource?: string
  parentMethod?: string
  updatedFields?: Record<string, any>
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

// ==================== Activity ====================
export interface IMongoActivity extends Document {
  _id: mongoose.Types.ObjectId
  activityId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  activityType: string
  activityTime: Date
  title: string
  description?: string
  duration?: number
  result?: string
  leadId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  doctorId?: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  nextAction?: string
  source?: string
  orgId: mongoose.Types.ObjectId
  noteTags: string[]
  reportIds?: mongoose.Types.ObjectId[]
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Appointment ====================
export interface IMongoAppointment extends Document {
  _id: mongoose.Types.ObjectId
  appointmentId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  patientId?: mongoose.Types.ObjectId
  appointmentType?: string
  duration?: string
  orgId: mongoose.Types.ObjectId
  referenceId: string
  leadId?: mongoose.Types.ObjectId
  description?: string
  comment?: string
  source?: string
  doctorId?: mongoose.Types.ObjectId
  startDate: Date
  endDate: Date
  status: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  appointmentMode?: string
  meetingLink?: string
  reminderCount?: number
  remindersSent?: IReminderSent[]
  needToReminder?: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Reminder Sent Tracking ====================
export interface IReminderSent {
  minutesBefore: number
  count: number
}

// ==================== Task ====================
// Subtask is an embedded sub-document on Task. After consolidating timeline_subtasks → tasks,
// `status` and `completedBy` were added so timeline-driven subtasks (which had a status enum)
// keep parity. The legacy `completed` boolean stays for back-compat with non-timeline callers.
export interface IMongoTaskSubtask {
  subtaskId?: mongoose.Types.ObjectId
  title: string
  completed: boolean
  completedAt?: Date
  status?: string
  completedBy?: mongoose.Types.ObjectId
}

export interface IMongoTask extends Document {
  _id: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  taskNumber?: number // Sequential per-org task number
  title: string
  assignToUserId: mongoose.Types.ObjectId
  priority?: string
  category?: string
  description?: string
  patientId?: mongoose.Types.ObjectId
  leadId?: mongoose.Types.ObjectId
  dueDate: Date
  orgId: mongoose.Types.ObjectId
  status: string
  subtasks?: IMongoTaskSubtask[]
  tags?: string[]
  relatedModule?: string
  completedDate?: Date
  isDelete?: boolean
  // Timeline fields. After consolidating timeline_tasks into the tasks collection, every
  // SOP-generated task carries:
  //   - timelineId         → the timeline_event._id this task belongs to (was TimelineTask.eventId)
  //   - patientTimelineId  → the parent patient_timeline._id (used by cycle/pregnancy services
  //                          to fetch all tasks for a patient's timeline in one query)
  //   - sopTaskTemplateId  → the SOP template that generated this task
  timelineId?: mongoose.Types.ObjectId
  patientTimelineId?: mongoose.Types.ObjectId
  // 'TREATMENT' (default) or 'IPD'. Inherited from the source SOP / admit call
  // at task-create time. Drives the completeTreatment + endIpd gates.
  treatmentCategory?: 'TREATMENT' | 'IPD'
  // Multi-instance scoping. `treatmentInstanceId` matches `patient.activeTreatments[].instanceId`;
  // `ipdInstanceId` matches `patient.ipds[].instanceId`. Either may be null on legacy rows written
  // before the multi-instance migration. Stamped by TreatmentFlowService when materialising tasks.
  treatmentInstanceId?: mongoose.Types.ObjectId | null
  ipdInstanceId?: mongoose.Types.ObjectId | null
  sopTaskTemplateId?: mongoose.Types.ObjectId
  taskType?: string
  assignedRole?: string
  isSystemManaged?: boolean
  // Module-registry routing — array of {moduleKey, sectionKey} pairs. A task can belong to multiple
  // sections (inherited from the parent SOPEvent.moduleSectionKeys at SOP-run time, override allowed
  // per-task). Backend list filter uses $elemMatch so `?moduleKey=ivf&sectionKey=opu` still selects a
  // single tab's tasks.
  moduleSectionKeys?: IModuleSectionRef[]
  // Specific record this task is attached to (e.g. ivfCycleId). Independent of the section array.
  refId?: string
  // Form fields
  formId?: string
  formConfig?: IFormConfig
  formData?: Record<string, any>
  formCompletedAt?: Date
  formCompletedBy?: mongoose.Types.ObjectId
  // Optional reviewing-doctor workflow. When set, task completion auto-spawns a follow-up
  // "Review Reports" task assigned to this doctor; the spawned task carries `parentTaskId`
  // pointing back to the original (used by the doctor's review-task UI to fetch parent
  // formData + uploaded reports without duplicating data).
  reviewerDoctorId?: mongoose.Types.ObjectId
  parentTaskId?: mongoose.Types.ObjectId
  // When true, completing this task should notify the patient (channel/template wired later).
  informPatient?: boolean
  // Patient-portal visibility. `private` = staff only; `public` = surfaced to the patient.
  // Mirrors the pattern used on reports/follow-ups/patient notes.
  visibility?: 'public' | 'private'
  // WhatsApp notification idempotency stamps. Each scheduled/event-driven notification writes a
  // timestamp here once sent so the external-cron dispatchers never double-send. `digestDates`
  // tracks which local days ('YYYY-MM-DD') this task was already included in a morning digest for.
  notificationsSent?: {
    assignment?: Date
    reminder30?: Date
    overdue?: Date
    dueToday?: Date
    digestDates?: string[]
    // How many times each notification has actually been sent for this task.
    counts?: {
      assignment?: number
      reminder30?: number
      overdue?: number
      dueToday?: number
      digest?: number
    }
  }
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Task History (audit log) ====================
export interface IMongoTaskHistory extends Document {
  _id: mongoose.Types.ObjectId
  taskId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  action: string
  changedFields?: string[]
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  description?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

// ==================== Follow-Up History (audit log) ====================
export interface IMongoFollowUpHistory extends Document {
  _id: mongoose.Types.ObjectId
  followUpId: mongoose.Types.ObjectId
  leadId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  action: string
  changedFields?: string[]
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  description?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
}

// ==================== Patient Note ====================
// Free-text note attached to a patient. Visibility controls who sees it:
//   - 'public'  → staff + patient portal
//   - 'private' → staff only
// Mirrors the report-visibility convention (memory:
// `project_report_visibility_public_private`).
export type PatientNoteVisibility = 'public' | 'private'

export interface IMongoPatientNote extends Document {
  _id: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  content: string
  visibility: PatientNoteVisibility | string
  /** Optional tag for categorisation — kept simple, not enum-restricted. */
  category?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient History ====================
export interface IMongoPatientHistory extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  patientId: mongoose.Types.ObjectId
  doctorId?: mongoose.Types.ObjectId
  reportIds: mongoose.Types.ObjectId[]
  appointmentId?: mongoose.Types.ObjectId
  history?: Record<string, any>
  condition?: string
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  // Timeline fields for treatment workflow
  recordType?: string
  title?: string
  description?: string
  status?: string
  recordDate?: Date
  recordTime?: string
  assigneeRole?: string
  fileUrls?: string[]
  fileTypes?: string[]
  fileNames?: string[]
  treatmentPlanId?: mongoose.Types.ObjectId
  treatmentCycleId?: mongoose.Types.ObjectId
  workflowTaskId?: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Report ====================
export interface IMongoReport extends Document {
  _id: mongoose.Types.ObjectId
  reportId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  reports?: Record<string, any>
  reportResult?: string
  patientId: mongoose.Types.ObjectId
  doctorId?: mongoose.Types.ObjectId
  fileUrl?: string
  reportType?: string
  fileType?: string
  description?: string
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  // Timeline fields
  timelineId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  activityId?: mongoose.Types.ObjectId
  visitId?: mongoose.Types.ObjectId
  fileName?: string
  fileSize?: number
  reportDate?: Date
  status?: string
  visibility?: 'public' | 'private'
  reviewedBy?: mongoose.Types.ObjectId
  reviewDate?: Date
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Lab Test ====================
export interface IMongoLabTestResult {
  parameter: string
  value: string
  unit?: string
  normalRange?: string
  flag?: string // 'Normal' | 'High' | 'Low' | 'Critical'
}

export interface IMongoLabTest extends Document {
  _id: mongoose.Types.ObjectId
  labTestId: mongoose.Types.ObjectId
  testNumber: number
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  testType: string
  category: string
  status: string
  orderedBy: mongoose.Types.ObjectId
  orderedDate: Date
  results: IMongoLabTestResult[]
  reviewedBy?: mongoose.Types.ObjectId
  reviewDate?: Date
  treatmentCycleId?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Call Activity ====================
export interface IMongoCallActivity extends Document {
  _id: mongoose.Types.ObjectId
  callActivityId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  leadId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  referenceId?: string
  sid?: string
  callId?: string
  callStatus?: string
  callSuccessful?: boolean
  disconnectionReason?: string
  callDuration?: number
  description?: string
  action?: string
  userSentiment?: string
  circle?: string
  aiSummery?: string
  recordingUrl?: string
  // Lambda-driven rehost: when the org has `exotelConfiguration.recordingStoreInS3`
  // enabled, a scheduled Lambda fetches rows where `recordingS3Key` is null
  // (and `recordingS3Error` is null — failures are terminal, never retried),
  // downloads the audio from Exotel, uploads to S3, and sets this key.
  recordingS3Key?: string
  // If Exotel returns an error while the Lambda is downloading, we stamp
  // the message here so the row is skipped on future runs. No retry logic.
  recordingS3Error?: string
  // Whether `recordingUrl` can be opened directly by a browser.
  //  - PUBLIC  = presigned S3 URL rehosted on our bucket (playable as-is)
  //  - PRIVATE = raw Exotel URL that needs Basic-auth to fetch; frontend
  //              must go through the `/api/exotel/recordings/.../stream`
  //              proxy instead of hitting `recordingUrl` directly.
  recordingUrlType?: 'PUBLIC' | 'PRIVATE'
  fromNumber?: string
  toNumber?: string
  direction: string
  orgId: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Social Contact ====================
export interface IMongoSocialContact extends Document {
  _id: mongoose.Types.ObjectId
  contactId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  socialId: string
  name?: string
  mobileNumber?: string
  emailId?: string
  socialType: string
  lastSeen?: Date
  language?: string
  orgId: mongoose.Types.ObjectId
  phoneNumberId?: string
  isBlocked: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Social Message ====================
export interface IMongoSocialMessage extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  contactId: mongoose.Types.ObjectId
  messageId: mongoose.Types.ObjectId // Same as _id, dual-ID pattern
  direction: string
  socialType: string
  buttons?: string[]
  orgId: mongoose.Types.ObjectId
  type?: string
  body?: string
  caption?: string
  bucketKey?: string
  mimeType?: string
  fileId?: string
  timestamp: Date
  userType?: string
  filename?: string
  publicUrl?: string
  trackingId?: string
  whatsappMessageId?: string
  messageStatus: string
  errorMessage?: string
  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Chat History ====================
export interface IMongoChatHistory extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  message: string
  role: string
  createdAt: Date
  updatedAt: Date
}

// ==================== Copilot Session ====================
export interface IMongoCopilotSession extends Document {
  _id: mongoose.Types.ObjectId
  sessionId: mongoose.Types.ObjectId // Same as _id
  userId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  conversationSummary: string
  pendingTool?: string | null
  pendingToolContext?: any
  title?: string
  isPinned?: boolean
  pinnedAt?: Date | null
  isDeleted?: boolean
  deletedAt?: Date | null
  messageCount?: number
  lastMessageAt?: Date
  lastActiveAt: Date
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

// ==================== Copilot Conversation ====================
export interface IMongoCopilotConversation extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id
  sessionId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  role: 'user' | 'assistant'
  message: string
  toolName?: string | null
  cardType?: string | null
  rawData?: any | null
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// ==================== Address ====================
export interface IMongoAddress extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  area?: string
  address?: string
  city?: string
  location?: Record<string, any>
  state?: string
  country?: string
  pinCode?: string
  orgId: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Token ====================
export interface IMongoToken extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  verificationKey: string
  verifyCode: string
  otpExpires: Date
  metaData?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// ==================== Password ====================
export interface IMongoPassword extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  password: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Client Key ====================
export interface IMongoClientKey extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId: mongoose.Types.ObjectId
  botName: string
  userId: mongoose.Types.ObjectId
  clientSecret: string
  clientKey: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Webhook Routing (standalone, no orgId) ====================
export interface IMongoWebhookRouting extends Document {
  _id: mongoose.Types.ObjectId
  webhookRoutingId: mongoose.Types.ObjectId
  mobileNumber: string
  appSecret: string
  routingUrl: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== S3 Temp Key ====================
export interface IMongoS3TempKey extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  s3Key: string
  s3PublicUrl?: string
  s3Bucket?: string
  metaData?: Record<string, any>
  expiresAt?: Date
  isDelete: boolean
  orgId: mongoose.Types.ObjectId
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Phone Number Info ====================
export interface IPhoneNumberInfo {
  phoneNumber: string
  location: string
  isEnabled?: boolean
}

// ==================== Organization Configuration ====================
export interface IMongoOrganizationConfiguration extends Document {
  _id: mongoose.Types.ObjectId
  configId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId: mongoose.Types.ObjectId
  workingHours?: Record<string, any>
  logoUrl?: string
  metaAttributes?: Record<string, any>
  welcomeMessage?: Record<string, any>
  organizationAddress?: Record<string, any>
  appointmentInformation?: Record<string, any>
  whatsappTemplate?: Record<string, any>
  phoneNumbersId?: string[]
  phoneNumberInformation?: IPhoneNumberInfo[]
  testimonialMessage?: Record<string, any>
  exotelConfiguration?: IExotelConfiguration
  geminiAIConfiguration?: IGeminiAIConfiguration
  openaiApiKey?: string
  appointmentReminderSchedules?: IAppointmentReminderSchedule[]
  reminderConfig?: IReminderConfig
  taskNotificationConfig?: ITaskNotificationConfig
  defaultLanguage?: string // Default language for the organization (e.g. HINDI, ENGLISH, GUJARATI)
  adminUserId: mongoose.Types.ObjectId
  isDeleteAllowed: boolean
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Task Notification Config ====================
// Per-org WhatsApp task-notification settings, managed by SuperAdmin. The external-cron dispatchers
// read these to decide which notifications to send and with what timing. All fields optional so a
// missing block falls back to TASK_NOTIFICATION_DEFAULTS in taskNotification.service.
// Per-org task-notification SETTINGS only. Runtime "how many sent" counts live per task at
// task.notificationsSent.counts — never here. `maxCount` = how many times to send that notification
// per task; `time` = the daily org-local time the digest / due-today notification fires.
export interface ITaskNotificationConfig {
  enabled?: boolean // master switch — false disables every task notification for the org
  assignmentAlert?: { enabled?: boolean; maxCount?: number /* default 1 */ }
  dailyDigest?: { enabled?: boolean; time?: string /* 'HH:mm' org-local, default '08:00' */ }
  dueToday?: { enabled?: boolean; time?: string /* 'HH:mm' org-local, default '09:00' */; maxCount?: number /* default 1 */ }
  preTaskReminder?: { enabled?: boolean; leadMinutes?: number /* default 30 */; maxCount?: number /* default 1 */ }
  overdueEscalation?: { enabled?: boolean; thresholdMinutes?: number /* default 60 */; maxCount?: number /* default 1 */ }
  timezone?: string // IANA tz used for digest/due-today day boundaries; defaults to Asia/Kolkata
}

// ==================== Appointment Reminder Schedule ====================
export interface IAppointmentReminderSchedule {
  minutesBefore: number
  isEnabled: boolean
  maxCount: number
}

// ==================== Reminder Config ====================
export interface IReminderScheduleItem {
  type: string // 'WHATSAPP' | 'EMAIL' | 'CALL'
  offsetMinutes: number // e.g. 30, 45, 60
  direction: string // 'BEFORE' | 'AFTER'
  isEnabled: boolean
  message?: string // Custom message template for this reminder
}

export interface IReminderConfig {
  autoReminderEnabled: boolean
  reminderTypes: string[] // ['WHATSAPP', 'EMAIL', 'CALL'] — kept for backward compat
  defaultReminderSchedules: IReminderScheduleItem[]
}

// ==================== Exotel Configuration ====================
export interface IExotelConfiguration {
  customerId: string
  customerSecret: string
  appId: string
  appSecret: string
  accountSid: string
  virtualNumber: string
  domain: string
  integrationsBaseUrl: string
  subdomain: string
  apiKey: string
  apiToken: string
  webhookToken?: string
  isEnabled: boolean
  recordingStoreInS3?: boolean
}

// ==================== Gemini AI Configuration ====================
export interface IGeminiAIConfiguration {
  apiKey?: string
  baseUrl?: string
}

// ==================== Module Registry ====================
// Lets super-admin declare clinical modules (ivf, maternity, …) and their sections (stimulation, opu, anc_visit, …)
// at runtime. SOPEvent.moduleSectionKeys + Task.moduleSectionKeys reference these entries, so new domains
// wire themselves to tabs without code changes. The attach itself lives on the SOP Event (multi-select array)
// and is inherited by every task generated from that event; per-task override is allowed.
export interface IModuleSectionEntry {
  sectionKey: string
  label: string
  order?: number
  enabled?: boolean
}

// (moduleKey, sectionKey) pair carried on SOPEvent and Task — array form because one event can belong to
// multiple sections (e.g. an "Embryo transfer day" event covers both Transfer and Outcome tabs).
export interface IModuleSectionRef {
  moduleKey: string
  sectionKey: string
}

export interface IModuleRegistryEntry {
  moduleKey: string
  label: string
  icon?: string
  // 'custom' = the domain ships its own page/controllers (e.g. IVF); the registry exists only to name its
  //            tabs so tasks/SOP can reference them. 'generic' = driven entirely by schema (future).
  driver?: 'custom' | 'generic'
  route?: string
  order?: number
  enabled?: boolean
  sections: IModuleSectionEntry[]
}

// ==================== Cryogenic Storage Configuration ====================
// Per-org physical layout of cryo tanks. Drives the embryo / oocyte freeze dialog
// (cascading dropdowns) and is the source of truth that `cryo_slot_assignments`
// validates against to keep two specimens from sharing one straw position.
export interface ICryoGoblet {
  gobletId: string
  label?: string
  vizoColours?: string[]
  strawPositions?: string[]
}

export interface ICryoCanister {
  canisterId: string
  label?: string
  goblets?: ICryoGoblet[]
}

export interface ICryoTank {
  tankId: string
  label?: string
  /** Display-only operating temperature (e.g. "-196°C"). Free-form
   *  string written by admins via the Cryo Storage editor. */
  temperature?: string
  canisters?: ICryoCanister[]
}

export interface ICryoStorage {
  tanks?: ICryoTank[]
}

// ==================== Organization Master Data ====================
export interface IMongoOrganizationMasterData extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId: mongoose.Types.ObjectId
  logoUrl?: string
  sideMenuItems?: string[]
  menuItemsConfig?: Array<{
    id: string
    label: string
    icon: string
    roles: string[]
    order: number
    enabled: boolean
    /** Sidebar group key (e.g. 'core', 'patient-care', 'laboratory',
     *  'operations', 'settings', 'footer'). Must match a `key` in
     *  `sidebarSections` (or fall back to the hardcoded section list). */
    section?: string
  }>
  sidebarSections?: Array<{
    key: string
    label: string
    icon?: string
    order: number
    enabled?: boolean
    defaultCollapsed?: boolean
  }>
  roleUiConfig?: Array<{
    role: string
    label: string
    colorClass: string
    borderColorClass: string
    iconName: string
  }>
  activityType?: Array<{ id: string; title: string }>
  leadSource?: Array<{ id: string; title: string }>
  leadStatus?: Array<{ id: string; title: string }>
  appointmentType?: Array<{ id: string; title: string }>
  appointmentMode?: Array<{ id: string; title: string }>
  documentType?: Array<{ id: string; title: string }>
  sopEnabled?: boolean
  visitTabEnabled?: boolean
  /** Prefix applied to auto-generated patient registration numbers (e.g. 'REG-',
   *  'MH-', 'AKR-'). Per-hospital — set in PatientConfigManager. Falls back to
   *  'REG-' when unset. Only affects NEW registration numbers + the FE fallback;
   *  already-stored `registrationNumber` values keep their original prefix. */
  patientRegistrationPrefix?: string
  sopTreatmentTypes?: Array<{ id: string; title: string }>
  sopTaskCategories?: Array<{ id: string; title: string }>
  organizationForms?: IOrganizationForm[]
  defaultPatientTasks?: IDefaultPatientTask[]
  treatmentPrerequisiteConfig?: ITreatmentPrerequisiteConfig[]
  moduleRegistry?: IModuleRegistryEntry[]
  cryoStorage?: ICryoStorage
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Role ====================
export interface IMongoRole extends Document {
  _id: mongoose.Types.ObjectId
  roleId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roleKey: string
  name: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Permission ====================
export interface IMongoPermission extends Document {
  _id: mongoose.Types.ObjectId
  permissionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  code: string
  name: string
  category: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Role Permission ====================
export interface IMongoRolePermission extends Document {
  _id: mongoose.Types.ObjectId
  rolePermissionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roleId: mongoose.Types.ObjectId
  permissionIds: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== User Permission ====================
export interface IMongoUserPermission extends Document {
  _id: mongoose.Types.ObjectId
  userPermissionId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  userId: mongoose.Types.ObjectId
  permissionIds: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Whatsapp API Response ====================
export interface IMongoWhatsappApiResponse extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  messageId?: mongoose.Types.ObjectId // References SocialMessage._id
  trackingId: string
  eventName?: string
  status?: string
  body?: string
  response?: Record<string, any>
  orgId: mongoose.Types.ObjectId
  mobileNumber?: string
  createdAt: Date
  updatedAt: Date
}

// ==================== Meta Webhook Payload ====================
export interface IMongoMetaWebhookPayload extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  orgId?: mongoose.Types.ObjectId
  webhookType?: string
  objectType?: string
  messageType?: string
  payload: Record<string, any>
  processedStatus?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

// ==================== AI Error ====================
export interface IMongoAIError extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  trackingId: string
  agentUrl: string
  requestBody: Record<string, any>
  responseBody?: Record<string, any>
  errorMessage?: string
  orgId: mongoose.Types.ObjectId
  socialId?: string
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== AI Analysis ====================
export interface IMongoAIAnalysis extends Document {
  _id: mongoose.Types.ObjectId
  id: mongoose.Types.ObjectId
  orgId?: mongoose.Types.ObjectId
  backendDocumentId?: string
  uploadUrl?: string
  imageUrl?: string
  title?: string
  status: string
  metadata?: Record<string, any>
  result?: Record<string, any>
  errorMessage?: string
  clientKey?: string
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Treatment Type ====================
export interface IMongoTreatmentTypeStage {
  stageNumber: number
  name: string
  description?: string
}

export interface IMongoTreatmentType extends Document {
  _id: mongoose.Types.ObjectId
  treatmentTypeId: mongoose.Types.ObjectId
  name: string
  code: string
  description?: string
  stages: IMongoTreatmentTypeStage[]
  maxCycles?: number
  orgId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Timeline Event ====================
export interface IMongoTimelineEvent extends Document {
  _id: mongoose.Types.ObjectId
  timelineEventId: mongoose.Types.ObjectId
  cycleId?: mongoose.Types.ObjectId
  treatmentPlanId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  stageKey: string
  title: string
  order: number
  status: string
  patientTimelineId?: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  description?: string
  phaseKey?: string
  weekRange?: { from: number; to: number }
  triggerCondition?: string
  conditionKey?: string
  conditionMet?: boolean
  scheduledDate?: Date
  completedDate?: Date
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// IMongoTimelineTask removed. The `timeline_tasks` collection was consolidated into `tasks`;
// every consumer now uses IMongoTask with `timelineId` (timeline_event ref) + `patientTimelineId`.

// IMongoTimelineSubtask removed — `timeline_subtasks` consolidated into the embedded
// IMongoTaskSubtask array on Task (see IMongoTask.subtasks).

// ==================== Ad Assignment ====================
export interface IMongoAdAssignment extends Document {
  _id: mongoose.Types.ObjectId
  adAssignmentId: mongoose.Types.ObjectId // Same as _id
  orgId: mongoose.Types.ObjectId
  adId: string // source_id from referral (the Ad ID)
  adName?: string
  platform?: string // e.g. instagram, facebook, google
  description?: string
  assignToUserId: mongoose.Types.ObjectId // staff member to auto-assign leads
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Phone Routing ====================
export interface IMongoPhoneRouting extends Document {
  _id: mongoose.Types.ObjectId
  phoneRoutingId: mongoose.Types.ObjectId // Same as _id
  orgId: mongoose.Types.ObjectId
  phoneNumber: string
  centerName: string
  description?: string
  assignToUserId: mongoose.Types.ObjectId
  isActive: boolean
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== SOP Treatment Type ====================
export interface IMongoSOPTreatmentType extends Document {
  _id: mongoose.Types.ObjectId
  sopTreatmentTypeId: mongoose.Types.ObjectId
  treatmentType: string
  name: string
  description?: string
  // `TREATMENT` (default) for regular per-treatment SOPs; `IPD` flags the single global
  // in-patient SOP the IPD toggle reads from.
  category: 'TREATMENT' | 'IPD'
  status: string // ACTIVE | DRAFT | ARCHIVED
  version: number
  icon?: string
  color?: string
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== SOP Event ====================
export interface IMongoSOPEvent extends Document {
  _id: mongoose.Types.ObjectId
  sopEventId: mongoose.Types.ObjectId
  sopTreatmentTypeId: mongoose.Types.ObjectId
  title: string
  description?: string
  order: number
  timeUnit?: string // week | day | '' (optional — no offset means no due date)
  week?: number
  day?: number
  weekRange?: { from: number; to: number }
  triggerCondition?: string // AUTO | CONDITIONAL | MANUAL
  conditionKey?: string
  // Module-registry attach for the whole event. Every task generated from this event inherits this
  // array verbatim; per-task override on Task.moduleSectionKeys still wins. Array form because one
  // event can legitimately belong to multiple sections (e.g. day-13 OPU also covers Embryology kickoff).
  moduleSectionKeys?: IModuleSectionRef[]
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Form Config (shared) ====================
export interface IFormFieldOption {
  label: string
  value: string
}

export interface IFormFieldValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  customMessage?: string
}

export interface IFormFieldDependsOn {
  field: string
  value: any
}

export interface IFormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'email' | 'phone' | 'aadhaar'
  required?: boolean
  placeholder?: string
  defaultValue?: any
  options?: IFormFieldOption[]
  validation?: IFormFieldValidation
  /** Opaque, stable id minted at field-create time. Form responses live in the
   *  `form_responses` collection keyed by this id, so renaming `name`/`label`
   *  never orphans answers and the patient mongoose schema is never exposed
   *  to the form builder UI. Format: "fk_<10 base36 chars>". */
  fieldKey?: string
  displayOrder?: number
  section?: string
  colSpan?: number
  dependsOn?: IFormFieldDependsOn
}

/** Where in the patient view UI a form's submissions render. One form may have many targets;
 *  see FORM_BUILDER_PLAN.md §2.2. moduleKey/sectionKey align with the existing module registry
 *  (IModuleSectionRef) so tasks/SOP/forms all speak the same vocabulary. */
export interface IFormDisplayTarget {
  moduleKey: string
  sectionKey?: string
  layout?: 'card' | 'table'
  displayOrder?: number
  showLabel?: boolean
}

export interface IFormConfig {
  enabled: boolean
  formTitle?: string
  formSubtitle?: string
  fields: IFormField[]
}

// ==================== Organization Form Template ====================
export interface IOrganizationForm {
  id: string
  name: string
  description?: string
  category?: string // e.g. 'PATIENT_INTAKE', 'INVESTIGATION', 'DENTAL', 'SURGERY', etc.
  formTitle?: string
  formSubtitle?: string
  fields: IFormField[]
  isActive?: boolean
  /** 0..N patient-view destinations. Empty/undefined → form is "task-form only", no auto-render. */
  displayTargets?: IFormDisplayTarget[]
  /** When true, every task submission of this form is preserved & rendered as a row/card in the
   *  display targets. When false (default), only the latest submission per patient is shown. */
  allowDuplicates?: boolean
  /** Gate which patient gender this form is offered to in the dynamic patient-view sections.
   *  ANY/undefined → all patients. MALE → only MALE patients. FEMALE → only FEMALE patients.
   *  Typical use: a "Wife details" form (collected for the wife) is set to MALE because it's
   *  the male patient's wife; a "Husband details" form is set to FEMALE for the same reason. */
  applicableGender?: 'ANY' | 'MALE' | 'FEMALE'
  /** When true, this form is offered as a step in the Add Patient wizard (after the patient is
   *  created from the fixed Basic Information step) and saved against the new patientId. Forms
   *  not flagged are task-form / patient-view only. Stored on the Mixed `organizationForms`
   *  array, so no schema change is needed — this type entry is purely for documentation. */
  showAtPatientRegistration?: boolean
}

// ==================== Default Patient Task Config ====================
export interface IDefaultPatientTask {
  id: string
  title: string
  description?: string
  category?: string
  assignedRole?: string
  priority?: string
  isActive?: boolean
  formId?: string  // references IOrganizationForm.id
  formConfig?: IFormConfig  // resolved at runtime from formId or inline
}

// ==================== Treatment Prerequisite Config ====================
export interface IPrerequisiteTask {
  id: string
  title: string
  subtitle?: string
  description?: string
  category?: string
  assignedRole?: string
  order?: number
  formConfig?: IFormConfig
}

export interface ITreatmentPrerequisiteConfig {
  treatmentType: string
  enabled: boolean
  description?: string
  estimatedTime?: string
  prerequisiteTasks: IPrerequisiteTask[]
}

// ==================== SOP Task Template ====================
export interface IMongoSOPTaskTemplate extends Document {
  _id: mongoose.Types.ObjectId
  sopTaskTemplateId: mongoose.Types.ObjectId
  sopEventId: mongoose.Types.ObjectId
  title: string
  description?: string
  category: string // Investigation | Counselling | Task | Medication | Procedure
  assignedRole?: string
  order: number
  metadata?: Record<string, any>
  formConfig?: IFormConfig
  // Reference to a published org form (organizationForms[].id). Customer screens only pick a form;
  // they cannot edit its fields. The full form structure lives on OrganizationMasterData.organizationForms,
  // not on the template — keeps a single source of truth so renaming a field updates everywhere.
  formId?: string
  // Per-task override of the parent event's moduleSectionKeys. `undefined` = inherit from event
  // (most tasks). When set, this wins at SOP-run time so an outlier task can land in a different
  // tab than the rest of its event's tasks.
  moduleSectionKeys?: IModuleSectionRef[]
  // Seed value copied onto generated Task.informPatient at SOP-run time.
  informPatient?: boolean
  // Seed value copied onto generated Task.visibility at SOP-run time.
  visibility?: 'public' | 'private'
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient Timeline ====================
export interface IMongoPatientTimeline extends Document {
  _id: mongoose.Types.ObjectId
  patientTimelineId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  treatmentPlanId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  // 'TREATMENT' for regular treatment runs, 'IPD' for in-patient admissions.
  // Set by generateTimeline() from the source SOP's category.
  treatmentCategory?: 'TREATMENT' | 'IPD'
  // Multi-instance scoping — set when the patient_timeline is generated from a
  // specific treatment-instance or IPD-instance start call. Lets the IPD history
  // list pull only the events that belong to one admission.
  treatmentInstanceId?: mongoose.Types.ObjectId | null
  ipdInstanceId?: mongoose.Types.ObjectId | null
  status: string
  progressPercent: number
  currentPhaseKey?: string
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Timeline ====================
export interface IMongoTimeline extends Document {
  _id: mongoose.Types.ObjectId
  timelineId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  title: string
  description?: string
  order: number
  status: string
  // Discriminator for the entry kind. Existing rows have no value (treated as the
  // pre-existing SOP/manual semantics). 'CONSULTATION' marks rows created from the
  // Dr Consultation composer on the patient page; the `consultation` subdoc carries
  // the doctor's public/private notes plus the AI extraction + linked task/appointment ids.
  type?: string // 'SOP' | 'MANUAL' | 'CONSULTATION'
  source?: string // AUTO | SOP | MANUAL
  // 'TREATMENT' (default) or 'IPD'. Inherited from the parent SOP's category at
  // generation time; manual rows default to 'TREATMENT'. Drives the patient
  // page's Treatments-vs-IPD tab split.
  treatmentCategory?: 'TREATMENT' | 'IPD'
  // Multi-instance scoping. Mirrors the same fields on Task. The IPD tab uses
  // `ipdInstanceId` to scope the timeline list to one admission when the user
  // selects a row from the IPD history list.
  treatmentInstanceId?: mongoose.Types.ObjectId | null
  ipdInstanceId?: mongoose.Types.ObjectId | null
  doctorNotes?: string
  phaseKey?: string
  weekRange?: { from: number; to: number }
  triggerCondition?: string
  conditionKey?: string
  conditionMet?: boolean
  scheduledDate?: Date
  completedDate?: Date
  consultation?: {
    // The doctor who started the Consultation. The Consultation is shared —
    // any doctor can add comments to it — but we keep the originator for
    // audit/debug.
    doctorId?: mongoose.Types.ObjectId
    doctorName?: string
    // Draft → Done lifecycle. A Consultation is editable while isDraft is true.
    // Comments inside it can be edited/deleted only while isDraft is true.
    isDraft?: boolean
    // Set when the Done button is clicked. Renamed from committedAt in v2.
    doneAt?: Date
    timezone?: string
    // ----- Legacy v1 fields, kept on the type so the lazy migration can read
    // them. New code does NOT write these. They get UNSET on any row that's
    // touched by the migration in getConsultationComments.
    note?: string
    visibility?: 'PUBLIC' | 'PRIVATE'
    mentions?: { userId: string; display: string }[]
    aiExtractions?: any
    extractedAt?: Date
    committedAt?: Date
    lastAutosaveAt?: Date
  }
  createdTaskIds?: mongoose.Types.ObjectId[]
  createdAppointmentIds?: mongoose.Types.ObjectId[]
  createdMedicineIds?: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Medicine ====================
export interface IMongoMedicine extends Document {
  _id: mongoose.Types.ObjectId
  medicineId: mongoose.Types.ObjectId
  timelineId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  medicineName: string
  dosage: string
  frequency: string
  medicineTime?: string[]
  durationValue?: number
  durationUnit?: string
  route?: string
  specialInstructions?: string
  // Standard prescription header — denormalized onto every medicine in a single
  // submit. `examination` is internal clinical history and must be excluded from any
  // patient-facing prescription render (PDF/print/share).
  complaint?: string
  diagnosis?: string
  examination?: string
  advice?: string
  status: string
  startDate?: Date
  endDate?: Date
  prescribedBy?: mongoose.Types.ObjectId
  leadId?: mongoose.Types.ObjectId
  visitId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Comment ====================
export interface IMongoComment extends Document {
  _id: mongoose.Types.ObjectId
  commentId: mongoose.Types.ObjectId
  timelineId?: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  reportId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  comment: string
  commentBy: mongoose.Types.ObjectId
  commentByRole?: string
  parentCommentId?: mongoose.Types.ObjectId
  // Discriminator. 'CONSULTATION' marks comments authored from the Dr Consultation
  // composer; legacy comments default to 'GENERAL'. Lets the consultation thread
  // query (timelineId + type) ignore unrelated comments that may share a
  // timelineId.
  type?: 'CONSULTATION' | 'GENERAL' | string
  // Per-comment visibility. The Consultation row itself has no visibility — a
  // single consultation can mix public and private comments.
  visibility?: 'PUBLIC' | 'PRIVATE'
  // @-tags inside the comment text. Stored alongside the markup so the patient
  // portal / notification consumers don't have to re-parse the body.
  mentions?: { userId: string; display: string }[]
  // Back-link to Tasks the LLM auto-created from this specific comment. Lets the
  // detail dialog group "tasks created from this comment" beneath the comment.
  aiExtractedTaskIds?: mongoose.Types.ObjectId[]
  orgId: mongoose.Types.ObjectId
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Cryo Slot Assignment ====================
// Single-source-of-truth occupancy ledger for cryo storage. Every frozen embryo
// or oocyte that lands in a physical slot creates exactly one ACTIVE row here
// (releasedAt: null). Released rows are kept for audit. A partial unique index
// on (orgId + 5 location fields) WHERE releasedAt: null guarantees two specimens
// cannot share one straw position — applies across embryos AND oocytes.
export type CryoOccupantType = 'EMBRYO' | 'OOCYTE'

export interface IMongoCryoSlotAssignment extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  // 5-tuple location — must exactly match the freezeLocation stored on the embryo/oocyte.
  tankId: string
  canister: string
  globules: string
  vizoColour: string
  storm: string
  // What's in the slot.
  occupantType: CryoOccupantType
  occupantId: mongoose.Types.ObjectId
  // Display id (E-00042 / O-00007) cached for UI tooltips without an extra lookup.
  displayId?: string
  // When the specimen was frozen into this slot. Comes from the FE form; defaults to now.
  frozenAt?: Date
  // Soft-release marker. Active rows have releasedAt: null. Released rows stay for audit.
  releasedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// ==================== Type Aliases for backward compatibility ====================
// These aliases map the new MongoDB interface names to the original names used in model files
export type IUser = IMongoUser
export type IUsersSession = IMongoUsersSession
export type IOrganization = IMongoOrganization
export type IPatient = IMongoPatient
export type IDoctor = IMongoDoctor
export type ILead = IMongoLead
export type ILeadSocial = IMongoLeadSocial
export type ILeadActivity = IMongoLeadActivity
export type IActivity = IMongoActivity
export type IAppointment = IMongoAppointment
export type ITask = IMongoTask
export type ITaskHistory = IMongoTaskHistory
export type IFollowUpHistory = IMongoFollowUpHistory
export type IPatientHistory = IMongoPatientHistory
export type IReport = IMongoReport
export type ICallActivity = IMongoCallActivity
export type ISocialContact = IMongoSocialContact
export type ISocialMessage = IMongoSocialMessage
export type IChatHistory = IMongoChatHistory
export type IAddress = IMongoAddress
export type IToken = IMongoToken
export type IPassword = IMongoPassword
export type IClientKey = IMongoClientKey
export type IS3TempKey = IMongoS3TempKey
export type IOrganizationConfiguration = IMongoOrganizationConfiguration
export type IOrganizationMasterData = IMongoOrganizationMasterData
export type ICryoSlotAssignment = IMongoCryoSlotAssignment
export type IRole = IMongoRole
export type IPermission = IMongoPermission
export type IRolePermission = IMongoRolePermission
export type IUserPermission = IMongoUserPermission
export type IWhatsappApiResponse = IMongoWhatsappApiResponse
export type IMetaWebhookPayload = IMongoMetaWebhookPayload
export type IAIError = IMongoAIError
export type IAIAnalysis = IMongoAIAnalysis

export type ILabTest = IMongoLabTest
export type ITreatmentType = IMongoTreatmentType
export type ITimelineEvent = IMongoTimelineEvent
// ITimelineTask removed — see note above; consumers use ITask (= IMongoTask).
// ITimelineSubtask removed — consumers use IMongoTaskSubtask (embedded on Task).
export type IAdAssignment = IMongoAdAssignment
export type IPhoneRouting = IMongoPhoneRouting
export type IWebhookRouting = IMongoWebhookRouting
export type ICopilotSession = IMongoCopilotSession
export type ICopilotConversation = IMongoCopilotConversation
export type ISOPTreatmentType = IMongoSOPTreatmentType
export type ISOPEvent = IMongoSOPEvent
export type ISOPTaskTemplate = IMongoSOPTaskTemplate
export type IPatientTimeline = IMongoPatientTimeline
export type ITimeline = IMongoTimeline
export type IMedicine = IMongoMedicine
export type IComment = IMongoComment
export type IPatientVisit = IMongoPatientVisit
export type IReminder = IMongoReminder
export type IFormResponse = IMongoFormResponse

// ==================== Form Response (per-field, per-submission) ====================
// Replaces the old `saveTo`/Patient-doc write-through. One row per filled field
// per submission. Keyed by `fieldKey` (the opaque id minted by the form builder)
// so renaming a form field's `name`/`label` never orphans existing answers and
// the underlying Patient mongoose schema is never exposed to the form builder UI.
//
// History semantics: every submission inserts new rows (we never UPDATE in place),
// so the latest answer for a field is `find({...}).sort({ submittedAt: -1 }).limit(1)`.
// Forms with `allowDuplicates: true` keep the full series; forms without it just
// query latest at render time.
export interface IMongoFormResponse extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  formId: string
  taskId?: mongoose.Types.ObjectId
  fieldKey: string
  // Mirror of the FE-side `field.name` at submission time. Stored alongside
  // `fieldKey` purely for human/debug readability — never used for lookup.
  fieldName?: string
  // Mixed: form fields can hold strings, numbers, dates, arrays (multi-select),
  // and bools (checkbox). Don't tighten this without a migration plan.
  value: any
  submittedBy: mongoose.Types.ObjectId
  submittedAt: Date
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient Visit (In/Out Tracking) ====================
export interface IMongoPatientVisit extends Document {
  _id: mongoose.Types.ObjectId
  visitId: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  patientId?: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  checkInTime: Date
  checkOutTime?: Date
  duration?: number // minutes, calculated on check-out
  status: string // 'IN_PROGRESS' | 'COMPLETED'
  description?: string
  handledBy?: mongoose.Types.ObjectId
  medicines?: Array<{
    name: string
    dosage?: string
    frequency?: string
    duration?: string
    instructions?: string
  }>
  reportIds?: mongoose.Types.ObjectId[]
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Reminder ====================
export interface IMongoReminder extends Document {
  _id: mongoose.Types.ObjectId
  reminderId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  leadId: mongoose.Types.ObjectId
  appointmentId?: mongoose.Types.ObjectId
  createdByUserId: mongoose.Types.ObjectId
  reminderDate: Date
  reminderType: string // 'WHATSAPP' | 'EMAIL' | 'CALL'
  reminderDirection: string // 'BEFORE' | 'AFTER'
  offsetMinutes: number // e.g. 30, 45, 60
  message?: string
  status: string // 'PENDING' | 'COMPLETED' | 'CANCELLED'
  isSent: boolean // whether the reminder was actually sent
  sentAt?: Date // timestamp when the reminder was sent
  sentVia?: string // channel used to send: 'WHATSAPP' | 'EMAIL' | 'CALL'
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== FollowUp ====================
export interface IFollowUp extends Document {
  _id: mongoose.Types.ObjectId
  followUpId: mongoose.Types.ObjectId // Same as _id
  leadId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  leadNumber?: number // Denormalized from Lead for search
  leadName?: string // Denormalized from Lead for search
  referenceId?: string // Denormalized from Lead for search
  followUpDate: Date
  notes?: string
  assignToUserId?: mongoose.Types.ObjectId
  status: string // 'PENDING' | 'COMPLETED' | 'CANCELLED'
  // Auto-dispatch tracking — see followUp.model.ts.
  lastSentAt?: Date | null
  sendAttempts?: number
  lastSendError?: string | null
  isDelete: boolean
  removedAt?: Date // Set when the follow-up is removed (manually or because the lead was deactivated)
  removedReason?: string // 'LEAD_DEACTIVATED' | 'MANUAL'
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Organization Media ====================
export interface IMongoOrgMedia extends Document {
  _id: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  fileName: string
  fileType: string // MIME type e.g. audio/mp3, video/mp4, image/png
  fileSize?: number
  s3Key: string
  publicUrl: string
  description?: string
  category?: string // e.g. 'audio', 'video', 'image', 'document'
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type IOrgMedia = IMongoOrgMedia

// ==================== Pregnancy ====================
export interface IMongoPregnancy extends Document {
  _id: mongoose.Types.ObjectId
  pregnancyId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  conceptionType: string // 'NATURAL' | 'IUI' | 'IVF'
  sourceCycleId?: mongoose.Types.ObjectId
  sourceCycleType?: string // 'IUI' | 'IVF'
  lmpDate: Date
  eddDate: Date
  pregnancyType: string // 'NORMAL' | 'HIGH_RISK' | 'TWIN' | 'IVF'
  gravida?: number
  para?: number
  bloodGroup?: string
  rhFactor?: string
  assignedDoctorId?: mongoose.Types.ObjectId
  status: string // 'ACTIVE' | 'DELIVERED' | 'MISCARRIAGE' | 'TERMINATED' | 'ECTOPIC'
  pregnancyOutcome?: Record<string, any>
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IUI Cycle ====================
export interface IMongoIUIcycle extends Document {
  _id: mongoose.Types.ObjectId
  iuiCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  cycleNumber: number
  startDate: Date
  endDate?: Date
  protocolType?: string
  assignedDoctorId?: mongoose.Types.ObjectId
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  /** Links this cycle to its entry in `patient.activeTreatments[]` — see the
   *  matching field on IMongoIVFCycle. */
  treatmentInstanceId?: mongoose.Types.ObjectId
  monitoringRecords?: Record<string, any>[]
  triggerDetails?: Record<string, any>
  iuiDetails?: Record<string, any>
  lutealSupport?: Record<string, any>[]
  outcome?: Record<string, any>
  status: string // 'PLANNED' | 'MONITORING' | 'TRIGGERED' | 'INSEMINATED' | 'AWAITING_RESULT' | 'COMPLETED' | 'CANCELLED'
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Cycle ====================
// Nested sub-documents. Every record carries an `_id` so prescriptions,
// edits, and cross-collection refs can target a specific entry.

export interface IVFMedicationEntry {
  _id?: mongoose.Types.ObjectId
  name: string
  dosage?: string
  route?: string
}

export interface IVFStimulationDailyRecord {
  _id?: mongoose.Types.ObjectId
  date: Date | string
  day: string | number
  type?: 'Hospital' | 'Home' | 'Current' | 'Scheduled' | string
  rightOvary?: string
  leftOvary?: string
  endometriumThickness?: number | string
  hmg?: string
  fsh?: string
  antagonist?: string
  hcg?: string
  estradiol?: number | string
  lh?: number | string
  progesterone?: number | string
  medications?: IVFMedicationEntry[]
  follicles?: { left?: any; right?: any }
  videoKeyId?: string
  videoFileName?: string
  remarks?: string
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

/**
 * @deprecated Use IMongoIVFStimulation (from the ivf_stimulations collection)
 * for the source-of-truth stimulation record. This interface only describes
 * the legacy embedded shape on `IVFCycle.stimulation` / `stimulationHistory`
 * that remains during the collection-split migration.
 */
export interface IVFStimulationEmbedded {
  _id?: mongoose.Types.ObjectId
  startDate?: Date | string
  status?: 'ACTIVE' | 'TRIGGERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string
  protocol?: string
  protocolType?: string
  dailyRecords?: IVFStimulationDailyRecord[]
  triggerDetails?: {
    date?: Date | string
    medication?: string
    dosage?: string
    triggerTime?: string
  } | null
  completedAt?: Date | string
  completedBy?: mongoose.Types.ObjectId | string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFOocyteMaturityEntry {
  _id?: mongoose.Types.ObjectId
  stage: 'MII' | 'MI' | 'GV' | 'Abnormal' | string
  count: number
  description?: string
  issues?: string[]
}

/**
 * @deprecated Use IMongoIVFOPUPickup (from the ivf_opu_pickups collection)
 * for the source-of-truth pickup record. This interface only describes the
 * legacy embedded shape on `IVFCycle.opu.pickups[]`, which is retired once
 * the collection split completes.
 */
export interface IVFOPUPickupEmbedded {
  _id?: mongoose.Types.ObjectId
  pickupNumber: number
  date: Date | string
  status?: 'In Progress' | 'Completed' | 'Failed' | string
  folliclesAspirated?: number
  oocytesRetrieved?: number
  matureOocytes?: number
  miOocytes?: number
  gvOocytes?: number
  embryologistId?: mongoose.Types.ObjectId | string
  oocyteMaturity?: IVFOocyteMaturityEntry[]
  spermAnalysis?: {
    source?: string
    prewashCount?: number
    prewashMotility?: number
    postwashCount?: number
    postwashMotility?: number
    morphology?: number
  }
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFOPUSummary {
  totalFolliclesAspirated?: number
  totalOocytesRetrieved?: number
  totalMatureMII?: number
  totalMI?: number
  totalGV?: number
  lastComputedAt?: Date | string
}

export interface IVFOPU {
  _id?: mongoose.Types.ObjectId
  procedureDate?: Date | string
  procedureTime?: string
  anesthesia?: string
  duration?: number
  performedBy?: string
  embryologistId?: mongoose.Types.ObjectId | string
  folliclesAspirated?: number
  oocytesRetrieved?: number
  matureOocytes?: number
  immatureOocytes?: number
  abnormalOocytes?: number
  miOocytes?: number
  gvOocytes?: number
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED' | string
  pickups?: IVFOPUPickupEmbedded[]
  summary?: IVFOPUSummary
  complications?: string
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
  // Backward-compat legacy flat fields
  date?: Date | string
  totalOocytes?: number
  anesthesiaType?: string
}

export interface IVFPGTResult {
  _id?: mongoose.Types.ObjectId
  enabled?: boolean
  biopsyDay?: string
  biopsyDate?: Date | string
  pgtType?: 'PGT-A' | 'PGT-M' | 'PGT-SR' | string
  result?: 'Euploid' | 'Aneuploid' | 'Mosaic' | 'No Result' | string
  clinicalNotes?: string
}

export interface IVFEmbryoDay1 {
  status?: string
  pnCount?: number
  notes?: string
}

export interface IVFEmbryoDay3 {
  status?: string
  cellCount?: number
  fragmentation?: number | string
  grade?: string
  notes?: string
}

export interface IVFEmbryoDay5 {
  status?: string
  expansion?: number // 1-6
  icm?: 'A' | 'B' | 'C' | string
  te?: 'A' | 'B' | 'C' | string
  notes?: string
}

export interface IVFEmbryoDay6 {
  status?: string
  expansion?: number
  icm?: 'A' | 'B' | 'C' | string
  te?: 'A' | 'B' | 'C' | string
  notes?: string
}

export interface IVFFreezeLocation {
  tankId?: string
  canister?: string
  globules?: string
  vizoColour?: string
  storm?: string
  cane?: string
  position?: string
  frozenAt?: Date | string
}

export type IVFEmbryoPlantStatus =
  | 'FROZEN'
  | 'FRESH'
  | 'READY'
  | 'TRANSFERRED'
  | 'DISCARDED'
  | 'BIOPSIED'
  | 'ARRESTED'
  | 'NOT_ELIGIBLE'

export type IVFTransferRecommendation =
  | 'TRANSFER_RECOMMENDED'
  | 'TRANSFER_CONSIDER'
  | 'NOT_RECOMMENDED'

/**
 * @deprecated Use IMongoIVFEmbryo (from the ivf_embryos collection) for the
 * source-of-truth embryo record. This interface only describes the legacy
 * embedded shape on `IVFCycle.embryology.embryos[]` retired during the
 * collection-split migration.
 */
export interface IVFEmbryoEmbedded {
  _id?: mongoose.Types.ObjectId
  // DEPRECATED: legacy free-form id (kept for one release as legacyEmbryoId)
  embryoId?: string
  legacyEmbryoId?: string
  // New: per-org auto-increment integer. UI formats via formatEmbryoId(n) → "E-00091"
  embryoNumber?: number
  pickupNumber?: number
  pickupId?: mongoose.Types.ObjectId | string
  oocyteSource?: 'MII' | string
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | string
  fertilizationDate?: Date | string
  day1?: IVFEmbryoDay1
  day3?: IVFEmbryoDay3
  day5?: IVFEmbryoDay5
  day6?: IVFEmbryoDay6
  day1Status?: string
  day3Status?: string
  day5Status?: string
  grade?: string
  // Legacy flat status (kept for backward compat)
  status?: 'Fresh' | 'Frozen' | 'Discarded' | 'Biopsied' | 'Transferred' | 'Arrested' | string
  plantStatus?: IVFEmbryoPlantStatus | string
  transferRecommendation?: IVFTransferRecommendation | string
  manualOverrideStatus?: boolean
  pgt?: IVFPGTResult
  frozenLocation?: {
    tank?: string
    canister?: string
    cane?: string
    position?: string
  }
  freezeLocation?: IVFFreezeLocation
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFEmbryologySummary {
  fertilization?: number // Σ 2PN
  totalEmbryos?: number
  day5Blastocysts?: number
  readyCount?: number
  frozenCount?: number
  transferredCount?: number
  lastComputedAt?: Date | string
}

export interface IVFEmbryologyDelta {
  direction?: 'increased' | 'decreased' | 'unchanged' | string
  amount?: number
  detectedAt?: Date | string
}

export interface IVFEmbryology {
  _id?: mongoose.Types.ObjectId
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | string
  fertilizationDate?: Date | string
  oocytesInseminated?: number
  lastSyncedMatureMII?: number
  matureMIIDelta?: IVFEmbryologyDelta
  fertilizationCount?: number
  fertilizationRate?: number
  totalFertilized?: number
  totalEmbryos?: number
  day5Blastocysts?: number
  frozen?: number
  transferred?: number
  // Day-level fertilization breakdown
  twoPN?: number
  threePN?: number
  onePN?: number
  zeroPN?: number
  excellentGrade?: number
  goodGrade?: number
  fairGrade?: number
  embryos?: IVFEmbryoEmbedded[]
  summary?: IVFEmbryologySummary
  notes?: string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFETPTimelineEntry {
  _id?: mongoose.Types.ObjectId
  date: Date | string
  day: string
  thickness?: string | number
  pattern?: 'Thin' | 'Triple-line' | 'Double-line' | string
  estradiol?: string | number
  progesterone?: string | number
  medication?: string
  colorFlow?: 'Grade 1' | 'Grade 2' | 'Grade 3' | string
  /** Follicle counts/sizes for the day — right + left side. */
  follicle?: { right?: string; left?: string }
  /** Follicle blood-flow grade or free-form text. */
  follicleBloodFlow?: string
  /** LH (urinary/serum) value. */
  lh?: string | number
  /** Serum LH value — captured separately when both readings are taken. */
  serumLh?: string | number
  /** Trigger medication / time on the day Day-0 is planned. */
  trigger?: string
  remarks?: string
  isDay0?: boolean
}

export type IVFETPPreparationType = 'MODIFIED_CYCLE' | 'NATURAL_CYCLE' | 'ETP_CYCLE'

/**
 * @deprecated Use IMongoIVFETPCycle (from the ivf_etp_cycles collection)
 * for the source-of-truth ETP record. This interface only describes the
 * legacy embedded shape on `IVFCycle.endometrialPrep.cycles[]` retired
 * during the collection-split migration.
 */
export interface IVFETPCycleEmbedded {
  _id?: mongoose.Types.ObjectId
  prepNumber: number
  startDate?: Date | string
  status?: 'In Progress' | 'Completed' | 'Failed' | 'Cancelled' | string
  method?: 'Hormonal Replacement' | 'Natural Cycle' | 'Modified Natural' | 'Letrozole-based' | string
  day0Date?: Date | string
  transferDate?: Date | string
  timeline?: IVFETPTimelineEntry[]
  completedAt?: Date | string
  completedBy?: mongoose.Types.ObjectId | string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
}

export interface IVFEndometrialPrep {
  cycles?: IVFETPCycleEmbedded[]
  // Legacy flat fields kept for backward compatibility
  [key: string]: any
}

// ==================== IVF ETP Cycle (standalone collection) ====================
// One document per endometrial-preparation attempt. Only one may be
// `In Progress` per cycle at a time — backend enforces. Day records stay
// embedded on the doc (bounded, small, always read together). `COMPLETED`
// status is the gate the Transfer stage checks before creating a transfer.
export interface IMongoIVFETPCycle extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  prepNumber: number
  startDate: Date
  status: 'In Progress' | 'Completed' | 'Failed' | 'Cancelled' | string
  method?: 'Hormonal Replacement' | 'Natural Cycle' | 'Modified Natural' | 'Letrozole-based' | string
  /** Top-level clinical workflow: Modified / Natural / ETP. Drives the
   *  dynamic sub-options that get loaded on the ETP form. */
  preparationType?: IVFETPPreparationType | string
  day0Date?: Date
  transferDate?: Date
  /** Baseline endometrial thickness recorded at the start of the cycle. */
  baselineThickness?: string
  /** Baseline endometrial pattern (e.g. Trilaminar) at the start. */
  baselinePattern?: string
  /** Selected estrogen medication for the Hormonal Replacement protocol. */
  estrogenMedication?: string
  /** Free-text dosage instructions for the chosen estrogen medication. */
  estrogenDosage?: string
  timeline: IVFETPTimelineEntry[]
  completedAt?: Date
  completedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface IVFEmbryoSnapshot {
  embryoNumber: number
  grade?: string
  transferRecommendation?: IVFTransferRecommendation | string
  snapshottedAt: Date | string
}

/**
 * @deprecated Use IMongoIVFTransfer (from the ivf_transfers collection)
 * for the source-of-truth transfer record. This interface only describes
 * the legacy embedded shape on `IVFCycle.transfer.transfers[]` retired
 * during the collection-split migration.
 */
export interface IVFTransferItemEmbedded {
  _id?: mongoose.Types.ObjectId
  transferNumber: number
  date: Date | string
  time?: string
  status?: 'Completed' | 'Ongoing' | 'Failed' | string
  transferType?: 'Fresh' | 'Frozen' | string
  etpPrepId?: mongoose.Types.ObjectId | string
  embryoNumbers?: number[]
  embryoSnapshots?: IVFEmbryoSnapshot[]
  details?: {
    embryoIds?: string[]
    embryoType?: string
    embryoGrade?: string
    embryoCount?: number
    day?: string
    endometriumThickness?: string | number
    endomColorFlow?: string
    catheterType?: string
    difficulty?: 'Easy' | 'Moderate' | 'Difficult' | string
    guidanceUsed?: string
    distanceFromFundus?: string | number
    transferMethod?: string
    performedBy?: string
    ultrasoundGuided?: boolean
  }
  medications?: string[]
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
  notes?: string
  createdBy?: mongoose.Types.ObjectId | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface IVFTransferSummary {
  totalTransfers?: number
  lastTransferDate?: Date | string
  lastOutcome?: 'Positive' | 'Negative' | 'Ongoing' | null | string
}

/**
 * @deprecated Legacy embedded wrapper on `IVFCycle.transfer` retired during
 * the collection-split migration. Use the `ivf_transfers` collection.
 */
export interface IVFTransferEmbedded {
  transfers?: IVFTransferItemEmbedded[]
  summary?: IVFTransferSummary
  // Legacy flat single-transfer fields
  [key: string]: any
}

// ==================== IVF Transfer (standalone collection) ====================
// One document per transfer attempt. Only ONE may be active (`Ongoing`)
// per cycle at a time. A transfer requires at least one embryo with
// `plantStatus === 'READY'` AND the latest ETP `status === 'Completed'`
// on the parent IVF cycle — backend enforces both gates. On save, the
// referenced embryos flip to `plantStatus = 'TRANSFERRED'`.
export interface IMongoIVFTransfer extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  transferNumber: number
  date: Date
  time?: string
  status: 'Ongoing' | 'Completed' | 'Failed' | string
  transferType?: 'Fresh' | 'Frozen' | string
  etpPrepId?: mongoose.Types.ObjectId
  /** Embryo IDs that went into this transfer — refs to `ivf_embryos`. */
  embryoIds: mongoose.Types.ObjectId[]
  /** Frozen copy of the embryos at transfer time for audit (numbers + grades). */
  embryoSnapshots: IVFEmbryoSnapshot[]
  details?: {
    embryoType?: string
    embryoGrade?: string
    embryoCount?: number
    day?: string
    endometriumThickness?: string | number
    endomColorFlow?: string
    catheterType?: string
    difficulty?: 'Easy' | 'Moderate' | 'Difficult' | string
    guidanceUsed?: string
    distanceFromFundus?: string | number
    transferMethod?: string
    performedBy?: string
    ultrasoundGuided?: boolean
  }
  /**
   * Denormalized summary of the outcome linked to this transfer. Written by
   * `IVFOutcomeService` on outcome create / update / decision so the
   * Transfer tab can show the final result (Positive / Negative /
   * Biochemical / Ectopic) without fetching the outcomes collection.
   */
  outcomeSummary?: {
    outcomeId: mongoose.Types.ObjectId
    result?: 'POSITIVE' | 'NEGATIVE' | 'BIOCHEMICAL' | 'ECTOPIC' | 'PENDING'
    decision?: 'NONE' | 'PREGNANCY_STARTED' | 'NEW_CYCLE_STARTED'
    updatedAt?: Date
  } | null
  medications?: string[]
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export type IVFOutcomeDecision = 'NONE' | 'PREGNANCY_STARTED' | 'NEW_CYCLE_STARTED'

/**
 * @deprecated Use IMongoIVFOutcome (from the ivf_outcomes collection) for
 * the source-of-truth outcome record. This interface only describes the
 * legacy embedded shape on `IVFCycle.outcome` retired during the
 * collection-split migration.
 */
export interface IVFOutcomeEmbedded {
  _id?: mongoose.Types.ObjectId
  transferId?: mongoose.Types.ObjectId | string
  pregnancyTestDate?: Date | string
  daysPostTransfer?: number
  betaHcgValue?: number
  result?: 'POSITIVE' | 'NEGATIVE' | 'BIOCHEMICAL' | 'ECTOPIC' | 'PENDING' | string
  progesterone?: number
  secondBetaHcgDate?: Date | string
  secondBetaHcgValue?: number
  firstUltrasoundDate?: Date | string
  gestationalSacsSeen?: number
  fetalHeartbeat?: 'detected' | 'not-detected' | 'not-applicable' | string
  numberOfFetuses?: number
  clinicalPregnancy?: boolean
  decision?: IVFOutcomeDecision | string
  pregnancyId?: mongoose.Types.ObjectId | string | null
  nextCycleId?: mongoose.Types.ObjectId | string | null
  decidedAt?: Date | string
  decidedBy?: mongoose.Types.ObjectId | string
  prescriptionIds?: mongoose.Types.ObjectId[] | string[]
  notes?: string
  createdBy?: mongoose.Types.ObjectId | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// ==================== IVF Outcome (standalone collection) ====================
// One document per outcome recorded against a transfer. Positive outcomes
// transition to a Pregnancy record via `startPregnancy`; negative outcomes
// can spawn a fresh IVF cycle via `startNewCycle`. Keeps the decision +
// cross-references (`pregnancyId`, `nextCycleId`) on the same doc so the
// audit trail for what happened after each transfer lives in one place.
export interface IMongoIVFOutcome extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  transferId?: mongoose.Types.ObjectId
  pregnancyTestDate?: Date
  daysPostTransfer?: number
  betaHcgValue?: number
  result?: 'POSITIVE' | 'NEGATIVE' | 'BIOCHEMICAL' | 'ECTOPIC' | 'PENDING' | string
  progesterone?: number
  secondBetaHcgDate?: Date
  secondBetaHcgValue?: number
  firstUltrasoundDate?: Date
  gestationalSacsSeen?: number
  fetalHeartbeat?: 'detected' | 'not-detected' | 'not-applicable' | string
  numberOfFetuses?: number
  clinicalPregnancy?: boolean
  decision: IVFOutcomeDecision | string
  pregnancyId?: mongoose.Types.ObjectId
  nextCycleId?: mongoose.Types.ObjectId
  decidedAt?: Date
  decidedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface IVFFrozenEmbryo {
  _id?: mongoose.Types.ObjectId
  embryoId: string
  freezeDate?: Date | string
  tankLocation?: {
    tank?: string
    canister?: string
    cane?: string
    position?: string
  }
  grade?: string
}

export interface IMongoIVFCycle extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  cycleNumber: number
  cycleType: string // 'SELF' | 'OVUM_DONOR' | 'SPERM_DONOR' | 'EMBRYO_DONOR' | 'SELF_PLUS_DONOR'
  cycleKind: 'IVF' | 'EGG_FREEZING'
  /** Links this cycle to its entry in `patient.activeTreatments[]`. Stamped on
   *  create so the cycle is a first-class active-treatment instance (drives the
   *  IPD admit picker, the treatment journey, and per-instance completion).
   *  Flipped to COMPLETED/CANCELLED on the patient when the cycle terminates. */
  treatmentInstanceId?: mongoose.Types.ObjectId
  freezeTarget?: 'OOCYTE_ONLY' | 'EMBRYO'
  protocolType?: string
  assignedDoctorId?: mongoose.Types.ObjectId
  embryologistId?: mongoose.Types.ObjectId
  sopTreatmentTypeId?: mongoose.Types.ObjectId
  stimulation?: IVFStimulationEmbedded | Record<string, any>
  /** Archived prior stimulations for this cycle. A single IVF cycle can have
   *  several stimulations (e.g. first one cancelled, a second one
   *  completed). The `stimulation` field is always the current / latest;
   *  every time a new one is started on top of a terminal (CANCELLED /
   *  FAILED) stim, the old one is pushed here so the full history is
   *  preserved.
   *  @deprecated Once the collection-split migration completes, history
   *  lives in the `ivf_stimulations` collection. */
  stimulationHistory?: IVFStimulationEmbedded[] | Record<string, any>[]
  opu?: IVFOPU | Record<string, any>
  spermCollection?: Record<string, any>
  embryology?: IVFEmbryology | Record<string, any>
  transfer?: IVFTransferEmbedded | Record<string, any>
  endometrialPrep?: IVFEndometrialPrep | Record<string, any>
  frozenEmbryos?: IVFFrozenEmbryo[] | Record<string, any>[]
  donorId?: mongoose.Types.ObjectId
  donorCode?: string
  outcome?: IVFOutcomeEmbedded | Record<string, any>
  status: string // 'PLANNED' | 'STIMULATION' | 'TRIGGERED' | 'OPU_DONE' | 'FERTILIZATION' | 'ETP_IN_PROGRESS' | 'TRANSFER_READY' | 'POST_ET' | 'OUTCOME_POSITIVE' | 'OUTCOME_NEGATIVE' | 'COMPLETED' | 'CANCELLED' | 'FREEZE_ALL'
  metadata?: Record<string, any>
  endDate?: Date
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Prescription ====================
export interface IVFPrescriptionMedicine {
  _id?: mongoose.Types.ObjectId
  name: string
  dosage: string
  frequency: string
  timing?: string
  duration?: string
  route?: string
  instructions?: string
}

export interface IVFPrescriptionContextRef {
  stimulationDayId?: mongoose.Types.ObjectId | string
  pickupNumber?: number
  pickupId?: mongoose.Types.ObjectId | string
  embryoId?: string
  embryoNumber?: number
  etpPrepId?: mongoose.Types.ObjectId | string
  etpDayId?: mongoose.Types.ObjectId | string
  transferId?: mongoose.Types.ObjectId | string
  outcomeId?: mongoose.Types.ObjectId | string
}

export interface IMongoIVFPrescription extends Document {
  _id: mongoose.Types.ObjectId
  prescriptionId: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  stage: 'stimulation' | 'opu' | 'embryology' | 'etp' | 'transfer' | 'outcome' | string
  stageRecordId?: mongoose.Types.ObjectId
  contextRef?: IVFPrescriptionContextRef
  prescribedBy?: mongoose.Types.ObjectId
  prescriptionDate: Date
  medicines: IVFPrescriptionMedicine[]
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF OPU Pickup (standalone collection) ====================
// One document per pickup attempt on an IVF cycle. Only one pickup may be
// `In Progress` per cycle at a time; totals (Follicles Aspirated, Oocytes
// Retrieved, Mature MII) on the parent cycle's `opu` summary are recomputed
// on every mutation, and the embryology `oocytesInseminated` is kept in
// sync via write-through in the service layer.
export interface IMongoIVFOPUPickup extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  pickupNumber: number
  date: Date
  /** Procedure time — free-form `HH:mm` string captured in the dialog. */
  procedureTime?: string
  /** Clinical pathway: `ICSI` → fertilization, `FREEZE` → cryopreservation. */
  pickupType?: 'ICSI' | 'FREEZE' | string
  /** Origin of the oocytes in this pickup. Fresh requires completed stim; Frozen/Donor bypass the stim-completed gate. */
  opuSourceType?: 'FRESH' | 'FROZEN' | 'DONOR' | string
  /** Required when opuSourceType=FROZEN — points at an ivf_oocyte_batches doc. */
  sourceBatchId?: mongoose.Types.ObjectId
  /** Required when opuSourceType=DONOR — points at a Donor doc (donorType=OVUM). */
  sourceDonorId?: mongoose.Types.ObjectId
  /** Number of oocytes pulled from the source batch / donor in this pickup. */
  consumedQty?: number
  /** FROZEN OPU only — survival % after thaw. */
  survivalRate?: number
  /** DONOR OPU only — date the clinic received the donor sample. */
  receivedDate?: Date
  status: 'In Progress' | 'Completed' | 'Failed' | string
  folliclesAspirated: number
  oocytesRetrieved: number
  matureOocytes: number
  miOocytes: number
  gvOocytes: number
  embryologistId?: mongoose.Types.ObjectId
  /** Free-form anesthesia label (e.g. `iv-sedation`, `general`). */
  anesthesiaType?: string
  /** Fertilization method — constrained to the enum at the schema level. */
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED' | string
  oocyteMaturity?: IVFOocyteMaturityEntry[]
  /** Per-pickup MII clinical grading — only meaningful when matureOocytes > 0. */
  oocyteQuality?: {
    cytoplasm?: string
    zonaPellucida?: string
    polarBody?: string
    perivitellineSpace?: string
    remarks?: string
  }
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Patient Sperm Record (standalone collection) ====================
// One document per sperm analysis captured for a PATIENT. Records are
// part of the patient's medical history and persist across IVF cycles —
// not created per cycle. `ivfCycleId` is optional: tag it for audit when
// the record was collected during an active cycle, but the same record
// is reused across future cycles for the same patient.
export interface IMongoIVFSpermRecord extends Document {
  _id: mongoose.Types.ObjectId
  /** Optional — tags the cycle that was active when the record was taken. */
  ivfCycleId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  date: Date
  source: 'EJACULATE' | 'TESA' | 'PESA' | 'DONOR' | 'FREEZE' | 'FROZEN' | string
  donorId?: mongoose.Types.ObjectId
  /** Batch this aliquot is part of (when the record is one unit inside a sperm_batches doc). */
  batchId?: mongoose.Types.ObjectId
  /** 1-based aliquot index inside the batch (display only). */
  numberInBatch?: number
  /** Lifecycle for individual aliquots in a batch. FROZEN/THAWED/USED/DISCARDED. Optional for legacy records that aren't tied to a batch. */
  freezeStatus?: 'FROZEN' | 'THAWED' | 'USED' | 'DISCARDED' | string
  /** Origin of sperm for THIS record — same axis as opuSourceType on OPU pickups. */
  sourceType?: 'FRESH' | 'FROZEN' | 'DONOR' | string
  sourceBatchId?: mongoose.Types.ObjectId
  sourceDonorId?: mongoose.Types.ObjectId
  consumedQty?: number
  prewashCount?: number
  prewashMotility?: number
  postwashCount?: number
  postwashMotility?: number
  morphology?: number
  volume?: number
  totalMotile?: number
  collectionMethod?: string
  abstinence?: string
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Sperm Batch (standalone collection) ====================
// Mirrors `ivf_oocyte_batches`: groups N frozen sperm aliquots into a
// single cryo slot. The per-aliquot rows live in `sperm_records` with
// `batchId` + `freezeStatus`. Patient-scoped (sperm records carry the
// patient, not the cycle) — `ivfCycleId` is optional audit tagging only.
export interface IMongoSpermBatch extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId?: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  /** Optional — the sperm_records doc this batch was frozen from. */
  sourceSpermRecordId?: mongoose.Types.ObjectId
  batchNumber: number
  source: 'EJACULATE' | 'TESA' | 'PESA' | 'DONOR' | string
  count: number
  freezeLocation?: {
    tankId?: string
    canister?: string
    globules?: string
    vizoColour?: string
    storm?: string
    cane?: string
    position?: string
    frozenAt?: Date
  }
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Embryo (standalone collection) ====================
// One document per embryo. The `embryoNumber` is an auto-incrementing
// per-org integer used to render the spec's `E-00091` display id — new
// docs ALWAYS receive one (seeded via `getNextSequence(orgId, 'embryo')`).
// `transferRecommendation` is derived from the grade via `evaluateEmbryo()`
// on every write unless `manualOverrideStatus === true`. `plantStatus`
// flips to `READY` when the embryo is clinically eligible for transfer —
// that's the gate the Transfer stage checks before creating a transfer.
export interface IMongoIVFEmbryo extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  embryoNumber: number
  /** Source pickup in the embryo's current cycle. Absent for embryos
   *  linked in from another cycle (no pickup in the receiving cycle). */
  pickupNumber?: number
  opuPickupId?: mongoose.Types.ObjectId
  /** Cross-cycle link audit — set when this embryo was moved into
   *  `ivfCycleId` from another cycle (past egg-freezing cycle, optionally
   *  a different patient for donor cases). */
  originalIvfCycleId?: mongoose.Types.ObjectId
  originalPatientId?: mongoose.Types.ObjectId
  linkedFromBatchId?: mongoose.Types.ObjectId
  linkedAt?: Date
  linkedBy?: mongoose.Types.ObjectId
  oocyteSource?: string
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT' | 'MIXED' | string
  fertilizationDate?: Date
  day1?: IVFEmbryoDay1
  day3?: IVFEmbryoDay3
  day5?: IVFEmbryoDay5
  day6?: IVFEmbryoDay6
  /** Current lifecycle state. Default FROZEN per spec. */
  plantStatus: IVFEmbryoPlantStatus | string
  /** Doctor-visible status derived from grade unless overridden. */
  transferRecommendation?: IVFTransferRecommendation | string
  /** When true, service skips auto-evaluation on grade updates. */
  manualOverrideStatus?: boolean
  grade?: {
    expansion?: number
    icm?: 'A' | 'B' | 'C' | string
    te?: 'A' | 'B' | 'C' | string
  }
  pgt?: IVFPGTResult
  freezeLocation?: IVFFreezeLocation
  /** Optional pointer at an `ivf_oocyte_batches` doc with entityType='EMBRYO'. */
  batchId?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Oocyte (standalone collection) ====================
// One document per *individually-tracked* oocyte. Most oocytes from a
// pickup never become individual records — they're just counted (MII/MI/
// GV) on the pickup doc and then either fertilised into embryos or
// discarded. A document is only created when an oocyte's lifecycle
// diverges from the pickup-level aggregate — most commonly when the
// clinician *freezes* an oocyte for later use (e.g. fertility
// preservation, or banking before chemo).
//
// `oocyteNumber` is an auto-incrementing per-org counter (`O-00001`
// display id) seeded via `getNextSequence(orgId, 'oocyte')` so each
// frozen oocyte carries a unique, scannable id for the cryo log.
// `FRESH` covers oocytes recorded *without* being physically frozen — the
// typical MI/GV case where the clinician wants the per-egg history (id,
// quality notes) preserved for future reference, but no straw is occupied.
// MII oocytes always start at `FROZEN`.
export type IVFOocyteFreezeStatus =
  | 'FRESH'
  | 'FROZEN'
  | 'THAWED'
  | 'USED_FOR_EMBRYO'
  | 'DISCARDED'

export type IVFOocyteSource = 'MII' | 'MI' | 'GV'

export interface IMongoIVFOocyte extends Document {
  _id: mongoose.Types.ObjectId
  /** Cycle this oocyte was retrieved in. */
  ivfCycleId: mongoose.Types.ObjectId
  /** Patient this oocyte belongs to (denormalised for cross-cycle lookups). */
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  oocyteNumber: number
  /** Source pickup — required since oocytes always originate from a pickup. */
  pickupNumber: number
  opuPickupId: mongoose.Types.ObjectId
  /** Batch grouping these eggs into a single cryo slot. Backfilled by the
   *  oocyte-batch migration for rows created before batches existed. */
  batchId?: mongoose.Types.ObjectId
  /** 1-based position within `batchId`. */
  numberInBatch?: number
  /** Maturity at retrieval (MII/MI/GV). */
  source: IVFOocyteSource | string
  /** Lifecycle state. Default FROZEN — bare records are created on freeze. */
  freezeStatus: IVFOocyteFreezeStatus | string
  /** Cryo-storage coordinates. Reuses the embryo freeze-location shape. */
  freezeLocation?: IVFFreezeLocation
  /** When THAWED → which embryo (if any) it became. Audit pointer only. */
  resultingEmbryoId?: mongoose.Types.ObjectId
  thawedAt?: Date
  /** Why this oocyte was thawed. Recorded once at thaw time so the cryo log
   *  can answer "how many eggs left this storage for IVF / donation / research /
   *  discard." Only meaningful when `freezeStatus === 'THAWED'`. */
  thawPurpose?: 'IVF_CYCLE' | 'DONATION' | 'RESEARCH' | 'DISCARDED' | string
  /** If thawed for an IVF cycle, the cycle that received the egg. Optional —
   *  the clinician may thaw before deciding the target cycle. */
  thawedForIvfCycleId?: mongoose.Types.ObjectId
  /** Free-form notes captured at thaw time (separate from the freeze `notes`). */
  thawNotes?: string
  thawedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Oocyte Batch (standalone collection) ====================
// Groups N per-egg `ivf_oocytes` docs into a single freeze batch. One batch =
// one cryo slot. Batches are homogeneous (single maturity class).
export interface IMongoIVFOocyteBatch extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  /** Discriminator. OOCYTE (default) groups ivf_oocytes; EMBRYO groups
   *  ivf_embryos via embryo.batchId. */
  entityType?: 'OOCYTE' | 'EMBRYO' | string
  /** Source pickup. Required for OOCYTE batches; absent for EMBRYO. */
  opuPickupId?: mongoose.Types.ObjectId
  /** 1-based per cycle. Restarts in each cycle (clinicians think per-cycle). */
  batchNumber: number
  /** Single maturity class — only meaningful for OOCYTE batches. */
  maturityClass?: 'MII' | 'MI' | 'GV' | string
  /** Denormalised count for cheap list rendering. */
  count: number
  /** 5-level cryo coordinates shared by every member of the batch. */
  freezeLocation?: IVFFreezeLocation
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== IVF Stimulation (standalone collection) ====================
// Each document represents one ovarian stimulation attempt belonging to an
// IVF cycle. A single IVF cycle can have multiple stimulation docs (e.g.
// first cancelled, second completed). The parent `IVFCycle.stimulation`
// field will become a summary projection (latestId, status, startDate,
// count, updatedAt) that's kept in sync by this collection's service layer.
export interface IMongoIVFStimulation extends Document {
  _id: mongoose.Types.ObjectId
  ivfCycleId: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  attemptNumber: number
  startDate: Date
  status: 'ACTIVE' | 'TRIGGERED' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string
  protocol?: string
  protocolType?: string
  dailyRecords: IVFStimulationDailyRecord[]
  triggerDetails?: {
    date?: Date | string
    medication?: string
    dosage?: string
    triggerTime?: string
  } | null
  completedAt?: Date
  completedBy?: mongoose.Types.ObjectId
  notes?: string
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Donor ====================
export interface IMongoDonor extends Document {
  _id: mongoose.Types.ObjectId
  donorId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  donorCode: string
  donorType: string // 'SPERM' | 'OVUM' | 'EMBRYO'
  realName: string
  anonymousName?: string
  age?: number
  bloodGroup?: string
  rhFactor?: string
  ethnicity?: string
  height?: number
  weight?: number
  education?: string
  occupation?: string
  skinColor?: string
  hairColor?: string
  eyeColor?: string
  medicalHistory?: Record<string, any>
  screening?: Record<string, any>
  storage?: Record<string, any>
  usageHistory?: Record<string, any>[]
  status: string // 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'QUARANTINE' | 'RETIRED'
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// ==================== Donor Request ====================
export interface IMongoDonorRequest extends Document {
  _id: mongoose.Types.ObjectId
  donorRequestId: mongoose.Types.ObjectId
  orgId: mongoose.Types.ObjectId
  requestType: string // 'SPERM' | 'OVUM' | 'EMBRYO'
  requestedBy: mongoose.Types.ObjectId
  patientId: mongoose.Types.ObjectId
  cycleId: mongoose.Types.ObjectId
  cycleType: string // 'IUI' | 'IVF'
  preferences?: Record<string, any>
  assignedDonorId?: mongoose.Types.ObjectId
  assignedBy?: mongoose.Types.ObjectId
  assignedDate?: Date
  unitsRequested: number
  status: string // 'PENDING' | 'ASSIGNED' | 'APPROVED' | 'FULFILLED' | 'REJECTED' | 'CANCELLED'
  rejectionReason?: string
  metadata?: Record<string, any>
  isDelete: boolean
  createdBy?: mongoose.Types.ObjectId
  updatedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface MongoQueryOptions {
  session?: ClientSession
  select?: Record<string, 0 | 1>
  sort?: Record<string, 1 | -1>
  limit?: number
  skip?: number
}

