import { UUIDTypes } from 'uuid'
import {
  ActivityType,
  AppointmentStatus,
  Gender,
  LeadStatus,
  MaritalStatus,
  MediaTypeEnum,
  MessageDirection,
  PatientStage,
  Role,
  SocialMediaType,
  TestimonialType,
} from '.'
export interface IUsers {
  userId: UUIDTypes
  mobileNumber: string
  email?: string
  orgId: string
  countryCode: string
  userName: string
  roles: Role[]
  isActive: boolean
  isBlocked: boolean
  isDelete: boolean
  isVerified?: boolean
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export interface IUsersSession {
  userId: UUIDTypes
  sessionId: UUIDTypes
  deviceName: string
  deviceType: string
  deviceId: string
  loginTime: Date
  isMainDevice: boolean
  isActive?: boolean
  isDelete: boolean
  isBlocked?: boolean
  isVerified?: boolean
  expiresAt: Date
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
  revokedBy?: string
  location: string
  version: string
  latitude?: number
  longitude?: number
}
export interface IPatients {
  patientId: string
  name: string
  mobileNumber: string
  referenceId?: string
  orgId: string
  countryCode: string
  email?: string
  age: string
  source?: string
  stage?: PatientStage
  maritalStatus: MaritalStatus
  gender: Gender
  medicalHistory?: string[]
  currentCondition?: string
  assignDoctorId?: string
  aiSummary?: string
  isDelete?: boolean
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface ITask {
  taskId: string
  title: string
  description: string
  orgId: string
  assignToUserId: UUIDTypes
  priority: number
  dueDate: Date
  category: string
  patientId?: string
  leadId?: string
  status: AppointmentStatus
  isDelete?: boolean
  informPatient?: boolean
  visibility?: 'public' | 'private'
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IPatientsHistory {
  id: string
  patientId: string
  doctorId: string
  reportIds: string[]
  orgId: string
  appointmentId?: string
  history: object[]
  condition: string
  isDelete?: boolean
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IDoctors {
  doctorId: string
  userId: UUIDTypes
  name: string
  specialization: string[]
  orgId: string
  qualifications: string[]
  registrationNumber?: string
  experienceYears: number
  mobileNumber: string
  countryCode: string
  email?: string
  consultationFee?: number
  languagesSpoken?: string[] // e.g., ["English", "Hindi"]
  isActive?: boolean
  isDelete?: boolean
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IReports {
  reportId: string
  doctorId?: string
  patientId: string
  fileUrl: string
  reportType: string
  fileType: string
  orgId: string
  description: string
  reports?: object[]
  reportResult?: string
  isDelete?: boolean
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface S3MetaData {
  socialId?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  mediaType?: MediaTypeEnum
}

export interface IS3TempKey {
  id: string
  s3Key: string
  s3PublicUrl?: string
  s3Bucket?: string
  metaData: S3MetaData
  expiresAt?: Date
  isDelete: boolean
  orgId: string
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  createdAt?: Date
  updatedAt?: Date
}

export interface IAppointments {
  appointmentId: string
  patientId?: string
  doctorId?: string
  referenceId?: string
  leadId?: string
  source?: string
  startDate: Date
  endDate: Date
  appointmentType: string
  duration: number
  orgId: string
  description: string
  comment?: string
  status: AppointmentStatus
  appointmentMode?: string
  meetingLink?: string
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface ITokens {
  id: string
  verificationKey: string
  verifyCode: string
  metaData?: object | null
  otpExpires: Date
  updatedAt: Date
  createdAt: Date
}
export interface IAddress {
  id: string
  address: string
  city: string
  area: string
  state: string
  orgId: string
  country: string
  pinCode: string
  location?: object
  longitude?: number
  createdAt?: string
  updatedAt?: string
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
}

export interface IPassword {
  userId: UUIDTypes
  id: string
  password: string
  createdBy: string
  updatedBy: string
}

export interface IChatHistory {
  id: string
  userId: UUIDTypes
  message: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface IOrganizations {
  orgId: string
  orgName: string
  orgShortName: string
  description: string
  adminEmail: string
  adminMobile: string
  countryCode: string
  createdAt: Date
  updatedAt: Date
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  isActive: boolean
  isDelete: boolean
}

export interface ITimeSlot {
  startTime: number
  endTime: number
}

export interface IWorkingHours {
  timezone: string
  days: Record<string, ITimeSlot[]>
}

export interface IFacebookLead {
  fields: string
}

export interface IWelcomeMessage {
  audioS3Url?: string
  whatsappDocumentId?: string
}

export interface IMessage {
  publicUrl?: string
  type: TestimonialType
  body?: string
}

export interface IWhatsAppConfig {
  token: string
  phoneNumberId: string
  welcomeMessageTemplate: {
    id: string
    languageCode: string
    imageUrl?: string
  }
  welcomeLanguageMessageTemplate: {
    id: string
    languageCode: string
    imageUrl?: string
  }
  followUpMessageTemplate: {
    id: string
    languageCode: string
  }
}

export interface IMessengerConfig {
  token: string
  pageId: string
}

export interface IInstagramConfig {
  token: string
  userId: string
}

export interface IMetaAttributes {
  baseUrl: string
  version: string
  appSecret: string
  userAccessToken: string
  facebookLead: IFacebookLead
  whatsapp: IWhatsAppConfig
  messenger: IMessengerConfig
  instagram: IInstagramConfig
  supportMediaType: string[]
  whatsappAgentsUrl: string
}

// ============== STORED template (DB / org-config) ==============
export type StoredValueType = 'static' | 'dynamic'

type StaticOrDynamic<TStatic> =
    | ({ valueType: 'static' } & TStatic)
    | { valueType: 'dynamic'; valueKey: string }

export type StoredHeaderParameter =
    | ({ type: 'text' } & StaticOrDynamic<{ text: string }>)
    | ({ type: 'image' } & StaticOrDynamic<{ link: string }>)
    | ({ type: 'video' } & StaticOrDynamic<{ link: string }>)
    | ({ type: 'document' } & StaticOrDynamic<{ link: string; filename?: string }>)

export type StoredBodyParameter =
    | ({ type: 'text' } & StaticOrDynamic<{ text: string }>)

export type StoredButtonParameter =
    | ({ type: 'text' } & StaticOrDynamic<{ text: string }>)
    | ({ type: 'payload' } & StaticOrDynamic<{ payload: string }>)

export type StoredTemplateComponent =
    | { type: 'header'; parameters: StoredHeaderParameter[] }
    | { type: 'body'; parameters: StoredBodyParameter[] }
    | {
          type: 'button'
          sub_type: 'url' | 'quick_reply' | 'copy_code'
          index: string
          parameters: StoredButtonParameter[]
      }

// ============== WIRE template (sent to WhatsApp Cloud API) ==============
export type WireHeaderParameter =
    | { type: 'text'; text: string }
    | { type: 'image'; image: { link: string } }
    | { type: 'video'; video: { link: string } }
    | { type: 'document'; document: { link: string; filename?: string } }

export type WireBodyParameter = { type: 'text'; text: string }

export type WireButtonParameter =
    | { type: 'text'; text: string }
    | { type: 'payload'; payload: string }

export type WireTemplateComponent =
    | { type: 'header'; parameters: WireHeaderParameter[] }
    | { type: 'body'; parameters: WireBodyParameter[] }
    | {
          type: 'button'
          sub_type: 'url' | 'quick_reply' | 'copy_code'
          index: string
          parameters: WireButtonParameter[]
      }

// Legacy alias kept for backwards compatibility with old callers
export interface IWhatsAppTemplateComponentConfig {
    type: 'body' | 'header' | 'button'
    sub_type?: 'url' | 'quick_reply'
    index?: string
    parameters?: Array<{
        type: 'text' | 'payload' | 'image' | 'document' | 'video'
        text?: string
        payload?: string
    }>
}

export type WhatsAppDocumentMediaType = 'image' | 'video' | 'audio' | 'document'

export interface IWhatsAppTemplateDocument {
    type: WhatsAppDocumentMediaType
    link: string
}

export interface IWhatsAppTemplateDocuments {
    headers?: IWhatsAppTemplateDocument[]
    body?: IWhatsAppTemplateDocument[]
}

export interface IWhatsAppTemplate {
    id: string
    type: string
    languageCode: string
    isEnabled?: boolean
    needToShowOnUI?: boolean
    templateTitle?: string
    messageBody?: string
    components?: StoredTemplateComponent[]
    templateParameters?: string[]
    // legacy fields, retained for backwards compat
    imageUrl?: string
    documents?: IWhatsAppTemplateDocuments
    buttons?: string[]
}



export interface IOrganizationAddress {
  address: string
  mapLink: string
}



export interface IOrganizationConfiguration {
  configId: string
  orgId: string
  phoneNumbersId: string[]
  phoneNumberInformation: { phoneNumber: string; location: string }[]
  logoUrl?: string
  defaultLanguage:string
  workingHours: IWorkingHours
  metaAttributes: IMetaAttributes
  welcomeMessage?: Record<string, IWelcomeMessage>
  testimonialMessage?: Record<string, IMessage>
  appointmentInformation?: Record<string, Record<string, IWhatsAppTemplate>>
  whatsappTemplate?: Record<string, IWhatsAppTemplate>
  organizationAddress?: IOrganizationAddress
  isDeleteAllowed: boolean
  isActive?: boolean
  isDelete?: boolean
  createdBy?: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IClientKey {
  id: string
  orgId: string
  botName: string
  clientKey: string
  clientSecret: string
  userId: UUIDTypes
  createdAt: Date
  updatedAt: Date
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
  isActive: boolean
  isDelete: boolean
}

export interface ILeadPartner {
  name?: string
  age?: number
  marriageSince?: string
}

export interface IWhatsAppReferral {
  body?: string
  headline?: string
  ctwa_clid?: string
  source_id?: string
  video_url?: string
  media_type?: string
  source_url?: string
  source_type?: string
  thumbnail_url?: string
}

export interface ILeads {
  leadId: string
  name: string
  email: string
  isValidName: boolean
  mobileNumber: string
  orgId: string
  age: number
  dob: string
  gender: Gender
  source: string
  status: LeadStatus
  patientId?: string
  assignUserId: UUIDTypes
  notes: string
  lastCallId: string | null
  followUpDate: Date
  followupCounts: number
  reminderCount: number
  requiredFollowup: boolean
  userSentimentSummary: string
  language?: string
  malePartner?: ILeadPartner
  femalePartner?: ILeadPartner
  marriedSince?: string
  createdAt: Date
  updatedAt: Date
  referenceId: string
  leadResourceId: string
  description: string
  isDelete: boolean
  isBlock: boolean
  aiSummary: string
  others: string
  referral?: IWhatsAppReferral
  sourceId?: string
  sourceTags: string[]
  refersBy?: string
  campLocation?: string
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
}

export interface ILeadSocial {
  id: string
  leadId: string
  patientId?: string
  orgId: string
  whatsappId: string
  instagramId?: string
  messengerId?: string
  createdAt: Date
  updatedAt: Date
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
}

export interface IActivities {
  activityId: string
  activityType: ActivityType
  activityTime?: Date
  title: string
  description?: string
  duration: number
  noteTags?: string[]
  result?: string
  leadId?: string
  taskId?: string
  source?: string
  doctorId?: string
  appointmentId?: string
  patientId?: string
  nextAction?: string
  createdAt: Date
  updatedAt: Date
  orgId: string
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
}

export interface ISocialContract {
  contactId: string
  socialId: string
  name: string
  mobileNumber?: string
  emailId?: string
  socialType: SocialMediaType
  lastSeen: Date
  phoneNumberId?: string
  language?: string
  isBlocked: boolean
  orgId: string
  createdAt: Date
  updatedAt: Date
}

export interface ISocialMessage {
  id: string
  contactId: string
  messageId: string
  direction: MessageDirection
  socialType: SocialMediaType
  type: MediaTypeEnum
  body?: string
  caption?: string
  bucketKey?: string
  voice?: boolean
  video?: boolean
  mimeType?: string
  fileId?: string
  orgId: string
  buttons?: string
  timestamp?: Date
  filename?: string
  createdAt?: Date
  createdBy?: UUIDTypes
  updatedAt?: Date
  userType: string
  publicUrl?: string
  trackingId?: string
  whatsappMessageId?: string
  messageStatus?: string
  errorMessage?: string
}

export interface IWhatsappApiResponse {
  id: string
  messageId?: string | null
  trackingId: string
  eventName?: string
  status?: string
  body?: string
  response?: object
  orgId: string
  mobileNumber: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ICallActivity {
  callActivityId: string
  leadId?: string
  patientId?: string
  referenceId?: string
  sid: string
  callId: string
  userSentiment: string
  circle: string
  aiSummery: string
  recordingUrl: string
  direction: MessageDirection
  callStatus: string
  callSuccessful: boolean
  disconnectionReason?: string
  callDuration?: number
  description?: string
  action?: string
  orgId: string
  createdAt: Date
  updatedAt: Date
  createdBy: UUIDTypes
  updatedBy: UUIDTypes
}

export interface IAIError {
  id: string
  trackingId: string
  agentUrl: string
  requestBody: object
  responseBody?: object
  errorMessage?: string
  orgId: string
  socialId?: string
  isResolved: boolean
  createdAt: Date
  updatedAt: Date
}

export enum PermissionCategory {
  GENERAL = 'GENERAL',
  ADMINISTRATION = 'ADMINISTRATION',
  REPORTS = 'REPORTS',
  INSURANCE = 'INSURANCE',
  CRM = 'CRM',
  CLINICAL = 'CLINICAL',
  OPERATIONS = 'OPERATIONS',
  FINANCE = 'FINANCE',
  PATIENT = 'PATIENT',
}

export enum PermissionKey {
  // General
  VIEW_ALL_DATA = 'VIEW_ALL_DATA',
  // Administration
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  // Reports
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  // Insurance
  MANAGE_INSURANCE = 'MANAGE_INSURANCE',
  VIEW_INSURANCE = 'VIEW_INSURANCE',
  // CRM
  MANAGE_LEADS = 'MANAGE_LEADS',
  // Clinical
  MANAGE_PATIENTS = 'MANAGE_PATIENTS',
  VIEW_PATIENTS = 'VIEW_PATIENTS',
  CREATE_PRESCRIPTIONS = 'CREATE_PRESCRIPTIONS',
  // Operations
  MANAGE_TASKS = 'MANAGE_TASKS',
  MANAGE_SCHEDULING = 'MANAGE_SCHEDULING',
  CREATE_APPOINTMENTS = 'CREATE_APPOINTMENTS',
  // Finance
  FINANCIAL_ACCESS = 'FINANCIAL_ACCESS',
  // Patient
  VIEW_OWN_DATA = 'VIEW_OWN_DATA',
  BOOK_APPOINTMENTS = 'BOOK_APPOINTMENTS',
  VIEW_PRESCRIPTIONS = 'VIEW_PRESCRIPTIONS',
  VIEW_REPORTS = 'VIEW_REPORTS',
}

export interface IRolePermission {
  rolePermissionId: string
  roleId: string
  permissionIds: string[]
  orgId: string
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IPermission {
  permissionId: string
  code: string // 'admin.manage_users'
  name: string
  category: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IRole {
  roleId: string
  roleKey: string // 'CEO', 'ADMIN', 'DOCTOR'
  name: string
  description?: string
  isActive: boolean
  isDelete: boolean
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IUserPermission {
  userPermissionId: string
  userId: UUIDTypes
  permissionIds: string[]
  orgId: string
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IMasterDataItem {
  id: string
  title: string
}

export interface IOrganizationMasterData {
  id: string
  orgId: string
  logoUrl?: string
  activityType?: IMasterDataItem[]
  leadSource?: IMasterDataItem[]
  leadStatus?: IMasterDataItem[]
  appointmentType?: IMasterDataItem[]
  appointmentMode?: IMasterDataItem[]
  documentType?: IMasterDataItem[]
  isDelete: boolean
  createdBy?: UUIDTypes
  updatedBy?: UUIDTypes
  createdAt: Date
  updatedAt: Date
}

export interface IMetaWebhookPayload {
  id: string
  orgId?: string
  webhookType?: string
  objectType?: string
  messageType?: string
  payload: object
  processedStatus?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface ILeadActivity {
  id: string
  leadId: string
  orgId: string
  apiSource: string
  parentMethod: string
  updatedFields: object
  oldValues?: object
  newValues?: object
  createdBy: UUIDTypes
  createdAt: Date
}
