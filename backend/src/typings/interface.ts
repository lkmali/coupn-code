import { Request, Response } from 'express'
import { UUIDTypes } from 'uuid'
import Joi from 'joi'
import { ISocialContract, ISocialMessage, IUsers, IMetaAttributes, IWelcomeMessage, IMessage, IRole, IWhatsAppTemplate, IWhatsAppReferral } from './model'
import { ConsoleTransportOptions } from 'winston/lib/winston/transports'

export enum AuthenticationStrategyType {
  JWT_AUTH = 'jwtAuth',
  JWT_AGENT_AUTH = 'jwtAgentsAuth',
  NO_AUTH = 'noAuth',
  BASIC_NAME = 'basicAuth',
  OTP_AUTH = 'otpAuth',
  BASIC_AUTH = 'basicAuth',
  EMAIL_AUTH = 'emailAuth',
  FACEBOOK_AUTH = 'facebookAuth',
  KEY_VALID = 'keyValid',
  PATIENT_JWT_AUTH = 'patientJwtAuth',
  PATIENT_OTP_AUTH = 'patientOtpAuth',
}

export enum Action {
  VIEW = 1,
  EDIT = 2,
  DELETE = 3,
  ALL = 4,
  ADMIN = 5,
}

export enum SocialMediaType {
  INSTAGRAM = 'INSTAGRAM',
  WHATSAPP = 'WHATSAPP',
  MESSENGER = 'MESSENGER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}
export enum PatientStage {
  ACTIVE_TREATMENT = 'ACTIVE_TREATMENT',
  CONSULTATION = 'CONSULTATION',
  INITIAL_CONSULTATION = 'INITIAL_CONSULTATION',
  PRE_TREATMENT = 'PRE_TREATMENT',
  SUCCESSFUL_PREGNANCY = 'SUCCESSFUL_PREGNANCY',
  TREATMENT_PLANNING = 'TREATMENT_PLANNING',
  FOLLOW_UP = 'FOLLOW_UP',
  EGG_RETRIEVAL = 'EGG_RETRIEVAL',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum WebhookEventType {
  WHATSAPP_MESSAGE = 'messages',
  FACEBOOK_LEADGEN = 'leadgen',
  INSTAGRAM_MESSAGE = 'instagram_messages',
}

export enum ActionString {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  ALL = 'ALL',
  ADMIN = 'ADMIN',
}

export enum TemplateName {
  SET_PASSWORD = 'SET_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
  SHARED_RESOURCE = 'SHARED_RESOURCE',
  WELCOME_EMAIL = 'WELCOME_EMAIL',
  FOLLOW_UP_EMAIL = 'FOLLOW_UP_EMAIL',
  CONSULTATION_INFO = 'CONSULTATION_INFO',
  CUSTOM_EMAIL = 'CUSTOM_EMAIL',
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  PATIENT_MEETING_LINK = 'PATIENT_MEETING_LINK',
}

export interface IAppointmentUserInfo {mobileNumber:string,referenceId:string,username:string,status:LeadStatus,leadId?:string,language:string,email?:string,others?:string}



export enum LeadStatus {
  NEW = 'NEW',
  NOT_PICKUP = 'NOT_PICKUP',
  NOT_INTERESTED = 'NOT_INTERESTED',
  FOLLOW_UP = 'FOLLOW_UP',
  CONVERTED = 'CONVERTED',
  ALL = 'ALL',
  DROPPED = 'DROPPED',
  DEACTIVATED = 'DEACTIVATED',
  MISS_CALLED = 'MISS_CALLED',
}

export enum LeadStatusS {
  NEW = 'NEW',
  NOT_PICKUP = 'NOT_PICKUP',
  NOT_INTERESTED = 'NOT_INTERESTED',
  FOLLOW_UP = 'FOLLOW_UP',
  CONVERTED = 'CONVERTED',
  DROPPED = 'DROPPED',
  DEACTIVATED = 'DEACTIVATED',
  MISS_CALLED = 'MISS_CALLED',
}

export enum LeadSource {
  ALL = 'ALL',
  WALK_IN = 'WALK_IN',
  WALK_IN_OPD = 'WALK_IN_OPD',
  WALK_IN_CAMP = 'WALK_IN_CAMP',
  WALK_IN_HOSPITAL = 'WALK_IN_HOSPITAL',
  CALL = 'CALL',
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  OTHER = 'OTHER',
  INSTAGRAM = 'INSTAGRAM',
  WHATSAPP = 'WHATSAPP',
  MESSENGER = 'MESSENGER',
  FACEBOOK = 'FACEBOOK',
  EMAIL = 'EMAIL',
}


export enum MediaTypeEnum {
  text = 'text',
  image = 'image',
  audio = 'audio',
  video = 'video',
  document = 'document',
  button = 'button',
  unknown = 'unknown',
  interactive = 'interactive',
  button_reply = 'button_reply',
  list_reply = 'list_reply',
}

export enum TestimonialType {
  text = MediaTypeEnum.text,
  image = MediaTypeEnum.image,
  audio = MediaTypeEnum.audio,
  video = MediaTypeEnum.video,
  document = MediaTypeEnum.document,
}

export enum ActivityType {
  PHONE_CALL = 'PHONE_CALL',
  EMAIL = 'EMAIL',
  APPOINTMENT = 'APPOINTMENT',
  NOTE = 'NOTE',
  TASK = 'TASK',
  DOCUMENT = 'DOCUMENT',
  TREATMENT = 'TREATMENT',
  FOLLOW_UP = 'FOLLOW_UP',
  OTHER = 'OTHER',
  LEAD_GENERATED = 'LEAD_GENERATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  LEAD_DEACTIVATE = 'LEAD_DEACTIVATE',
  LEAD_CONVERTED = 'LEAD_CONVERTED',
  LEAD_CREATED = 'LEAD_CREATED',
  ADDED_NOTE = 'ADDED_NOTE',
  SCHEDULE_CALL = 'SCHEDULE_CALL',
  LEAD_ACTIVATE = 'LEAD_ACTIVATE',
  PATIENT_CREATED = 'PATIENT_CREATED',
  APPOINTMENT_DELETED = 'APPOINTMENT_DELETED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}


export enum Language {
  HINDI = 'HINDI',
  GUJARATI = 'GUJARATI',
  ENGLISH = 'ENGLISH',
}

export enum MaritalStatus {
  MARRIED = 'MARRIED',
  UNMARRIED = 'UNMARRIED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHERS = 'OTHERS',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum AppointmentMode {
  VIDEO_CALL = 'VIDEO_CALL',
  VOICE_CALL = 'VOICE_CALL',
  WALK_IN = 'WALK_IN',
}

export enum WhatsAppMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  INVALID = 'invalid',
}

export enum AppointmentTemplateType {
  CANCEL_APPOINTMENT = 'CANCEL_APPOINTMENT',
  BOOK_APPOINTMENT = 'BOOK_APPOINTMENT',
  SEND_ADDRESS = 'SEND_ADDRESS',
  FOLLOW_UP_REMINDER = 'FOLLOW_UP_REMINDER',
  APPOINTMENT_REMINDER='APPOINTMENT_REMINDER',
  MISSED_APPOINTMENT = 'MISSED_APPOINTMENT',
  SEND_USER_NOTIFICATION_BY_ADMIN = 'SEND_USER_NOTIFICATION_BY_ADMIN',
}

export enum WhatsAppTemplateType {
  WELCOME_MESSAGE = 'WELCOME_MESSAGE',
  DR_APPOINTMENT_CONFIRMATION_MESSAGE = 'DR_APPOINTMENT_CONFIRMATION_MESSAGE',
  CALL_ALERT = 'CALL_ALERT',
  SEND_EMAIL_WELCOME_TEMPLATE = 'SEND_EMAIL_WELCOME_TEMPLATE',
  FEEDBACK_WHATSAPP = 'FEEDBACK_WHATSAPP',
  // Task-notification templates (staff-facing). Each must be created + approved in Meta Business
  // Manager and configured per-org under OrganizationConfiguration.whatsappTemplate. The action
  // templates carry 3 quick-reply buttons whose payloads encode the task id (task_complete:<id>, etc).
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_DAILY_DIGEST = 'TASK_DAILY_DIGEST',
  TASK_DUE_TODAY = 'TASK_DUE_TODAY',
  TASK_REMINDER_30 = 'TASK_REMINDER_30',
  TASK_OVERDUE = 'TASK_OVERDUE',
}

// Quick-reply button payload prefixes carried by the task-action WhatsApp templates. The inbound
// webhook matches these on `interactive.button_reply.id` to act deterministically (no AI). Format:
// `${prefix}<taskId>`, e.g. `task_complete:6650f0...`.
export enum TaskActionPayload {
  COMPLETE = 'task_complete:',
  RESCHEDULE = 'task_reschedule:',
  NOTE = 'task_note:',
}

// Fully-populated task-notification config (every field present) produced by
// TaskNotificationService.resolveConfig() by merging the per-org config over TASK_NOTIFICATION_DEFAULTS.
// Unlike ITaskNotificationConfig, nothing here is optional so the dispatchers read values directly.
export interface TaskNotificationResolvedConfig {
  enabled: boolean
  assignmentAlert: { enabled: boolean; maxCount: number }
  dailyDigest: { enabled: boolean; time: string }
  dueToday: { enabled: boolean; time: string; maxCount: number }
  preTaskReminder: { enabled: boolean; leadMinutes: number; maxCount: number }
  overdueEscalation: { enabled: boolean; thresholdMinutes: number; maxCount: number }
  timezone: string
}

// Summary returned by every task-notification dispatcher (cron-target endpoints).
export interface TaskDispatchResult {
  processed: number
  sent: number
  failed: number
  skipped: number
  dryRun: boolean
}

// Short-lived state (Redis) capturing that we are waiting for a user's free-text reply after they
// tapped the Reschedule or Add-Note quick-reply button.
export interface TaskAwaitingReplyState {
  action: 'reschedule' | 'note'
  taskId: string
}

export enum Role {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CEO = 'CEO',
  TECHNICIAN = 'TECHNICIAN',
  RECEPTIONIST = 'RECEPTIONIST',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
  BOT = 'BOT',
  NURSE = 'NURSE',
  LAB_ASSISTANT = 'LAB_ASSISTANT',
    TELECALLER = 'TELECALLER',
}

export enum HospitalRole {
  NURSE = Role.NURSE,
  RECEPTIONIST = Role.RECEPTIONIST,
  ADMIN = Role.ADMIN,
  CEO = Role.CEO,
  DOCTOR = Role.DOCTOR,
  TECHNICIAN = Role.TECHNICIAN,
  LAB_ASSISTANT = Role.LAB_ASSISTANT,
  TELECALLER=Role.TELECALLER,
}

export interface UserProfile {
  userId: any
  roles: Role[]
  role?: Role
  doctorId?: any
  sessionId: any
  email?: string
  orgId: any
  isActive: boolean
  isNewUser?: boolean
}

export interface PatientProfile {
  patientId: string
  orgId: string
  mobileNumber: string
  role: Role.PATIENT
  roles: Role[]
  sessionId: string
  isActive: boolean
  userId: string
}

export interface SignUpNewUser {
  email: string
  companyName: string
  mobileNumber: string
  password: string
}

export interface Password {
  userId: UUIDTypes
  password: string
}

export interface ResponseData {
  auth?: AuthenticationStrategyType
  code?: number
  async?: boolean
  topic?: string
  alreadySendResponse?: boolean
  validateSchema?: Joi.ObjectSchema
}

export type UserPassword = IUsers & { password: string }

export interface UserCredentials {
  email: string
  password: string
}

export interface ControllersRequest {
  request: Request
  response: Response
  userProfile: UserProfile
}

export interface AxiosRequest {
  accessToken?: string
  baseUrl: string
  path: string
  headers: object
}

export interface RequestHeadersOptions {
  devicename: string
  deviceid: string
  os: string
  location: string
  version: string
}

export interface ConstantConfig {
  OTP_LENGTH: number
  consoleTransportOptions: ConsoleTransportOptions
  logOption: {
    level: 'debug'
    maxFiles: number
    datePattern: string
  }
}

export type AuthType = 'JWT' | 'OAuth2'

export enum SortingOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PaginateDataType<T> {
  count: number
  data: T[]
}

export interface UserRequest {
  roles: Role[]
  mobileNumber: string
  countryCode?: string
  userName: string
}

// Patient tools
export interface AddNewPatientArgs {
  mobileNumber: string
  email?: string
  age: number
  source?: string
  countryCode?: string
  patientName: string
  gender: Gender
  maritalStatus?: MaritalStatus
  medicalHistory?: string[]
  history?: string
  aiSummary?: string
  // SOP Fields
  patientType?: string
  bloodGroup?: string
  profession?: string
  aadharNumber?: string
  address?: string
  city?: string
  referredBy?: string | {
    type?: 'DOCTOR' | 'ASHA_WORKER' | 'OTHER'
    name?: string
    phone?: string
    area?: string
    hospitalName?: string
  } | null
  assignDoctorId?: string
  partner?: Record<string, any>
  femalePartner?: Record<string, any>
  malePartner?: Record<string, any>
  marriageDate?: Date
  yearsMarried?: number
  previousLSCS?: boolean
  numberOfPreviousLSCS?: number
  conceptionMethod?: string
}

export interface ListPatientArgs {
  name?: string
  patientId?: string
}

export interface UploadReportForPatientArgs {
  patientId?: string
  doctorId?: string
  patientName: string
  doctorName: string
  fileUrl: string
  description?: string
}

export interface GetPatientReportsArgs {
  patientName: string
  patientId?: string
}

export interface AddPatientHistoryArgs {
  patientId?: string
  doctorId?: string
  patientName: string
  doctorName: string
  history: string
  medications?: string[]
  condition?: string
}

export interface GetPatientHistoryArgs {
  patientName: string
  patientId?: string
}

// Doctor tools
export interface AddNewDoctorArgs {
  name: string
  specialization: string[]
  qualifications: string[]
  experienceYears: number
  mobileNumber: string
  countryCode?: string
  email: string
  languagesSpoken?: string[]
}

export interface ListDoctorsArgs {
  specialization?: string
  name?: string
  doctorId?: string
}

// User tools
export interface SaveUserArgs {
  roles: ('NURSE' | 'RECEPTIONIST')[]
  mobileNumber: string
  countryCode?: string
  userName: string
  specialization?: string
  age?: number
  condition?: string
}

// Appointments
export interface BookAppointmentArgs {
  patientId?: string
  doctorId?: string
  patientName: string
  doctorName: string
  duration?: string
  date: string // ISO format
  description: string
}

export interface GetAppointmentsArgs {
  patientId?: string
  doctorId?: string
  patientName?: string
  doctorName?: string
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'
}

export interface CancelAppointmentArgs {
  appointmentId: string
  reason?: string
}

// Tasks
export interface AddNewTaskArgs {
  userId?: string
  userName: string
  title: string
  description?: string
  priority?: string
  dueDate: string
  category?: string
  patientId?: string
  patientName?: string
}

export interface GetTasksArgs {
  userId?: string
  userName?: string
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'
}

export interface GetTasksArgs {
  userId?: string
  userName?: string
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'
}

export interface GetDoctorArg {
  doctorId?: string
  doctorName?: string
}

export interface GetPatientArg {
  patientId?: string
  patientName?: string
  mobileNumber?: string
}

export interface GetUserArg {
  userId: UUIDTypes
  userName: string
  mobileNumber?: string
}

export interface SendOtpRequest {
  mobileNumber: string
  username: string
  expiry?: number
}
export interface UserCredentials {
  email: string
  password: string
}

export interface NodeMailerEmailRequest {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  attachments?: any[]
  html?: string
  subject: string
  text?: string
}

export interface EmailRequest {
  from?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  attachments?: any[]
  html?: string
  subject: string
  message?: string
}

export interface EmailTemplateRequest {
  email: string
  html: string
  subject: string
}

export interface CreateEmailTemplateRequest {
  email: string
  username: string
  otp: string
  adminEmail?: string
}

export interface SharedResourceEmailTemplateRequest {
  email: string
  otp: string
  resource: string
  adminEmail: string
}

export interface DynamicEmailTemplateRequest {
  email: string
  subject: string
  body: string // Can be HTML or plain text
}

export interface DoctorAppointmentEmailRequest {
  doctorName: string
  doctorEmail: string
  patientName: string
  appointmentType: string
  date: string
  time: string
  endTime: string
  duration: number
  description?: string
  startDateUTC: Date
  endDateUTC: Date
  appointmentId: string
  orgId: string
  leadId?: string
  patientId?: string
  meetingLink?: string
  appointmentMode?: string
}

export interface PatientMeetingLinkEmailRequest {
  patientName: string
  patientEmail: string
  appointmentType: string
  date: string
  time: string
  endTime: string
  meetingLink: string
  appointmentMode: string
  doctorName?: string
}

export interface EmailWithAttachmentRequest {
  email: string
  html: string
  subject: string
  attachments: Array<{
    filename: string
    content: string | Buffer
    contentType: string
  }>
}

export interface PasswordMailRequest {
  email: string
  username: string
  expiry?: number
  type: TemplateName
  adminEmail?: string
}

export interface NodeMailerConfigRequest {
  service: string
  host: string
  port: number
  auth: {
    user: string
    password: string
  }
  secure?: boolean
}

export interface WhatsAppBusinessAccount {
  object: string
  entry: Entry[]
}

export interface Entry {
  id: string
  changes: Change[]
}

export interface Change {
  value: Value
  field: string
}

export interface Value {
  messaging_product: string
  metadata: Metadata
  contacts: Contact[]
  messages: Message[]
}

export interface Metadata {
  display_phone_number: string
  phone_number_id: string
}

export interface Contact {
  profile: Profile
  wa_id: string
}

export interface Profile {
  name: string
}

export interface Message {
  from: string
  id: string
  timestamp: string
  text?: Text
  type: MediaTypeEnum
  audio?: Audio
  document?: Document
  image?: Image
  video?: Video
  button?: Button
  interactive?: Interactive
  context?: MessageContext
  referral?: IWhatsAppReferral
}

export interface Button {
  payload: string
  text: string
}

export interface Interactive {
  type: string
  button_reply?: ButtonReply
  list_reply?: ListReply
}

export interface ButtonReply {
  id: string
  title: string
}

export interface ListReply {
  id: string
  title: string
  description?: string
}

export interface MessageContext {
  from: string
  id: string
}

export interface Text {
  body: string
}

export interface Audio {
  id: string
  mime_type: string
  sha256: string
  voice: boolean
}

export interface Document {
  id: string
  mime_type: string
  sha256: string
  filename: string
}

export interface Image {
  id: string
  caption?: string
  mime_type: string
  sha256: string
}

export interface Video {
  id: string
  mime_type: string
  sha256: string
}

export interface InstagramWebhook {
  object: 'instagram'
  entry: InstagramEntry[]
}

export interface InstagramEntry {
  id: string
  time: number
  messaging: InstagramMessaging[]
}

export interface InstagramMessaging {
  sender: { id: string }
  recipient: { id: string }
  timestamp: string
  message: InstagramMessage
}

export interface InstagramMessage {
  mid: string
  text?: string
  attachments?: InstagramAttachment[]
}

export interface InstagramAttachment {
  type: MediaTypeEnum
  payload: {
    url: string
  }
}

export interface ReplyInterface {
  message: string
  socialId: string
  mediaId: string
  messageId?: string | null | undefined
  messageType: MediaTypeEnum
  updateDate: Date
  mobileNumber?: string
  orgId: string
  isBlocked: boolean
  timestamp: Date
  welcomeMessage: IWelcomeMessage | null
  mediaUploadKey: string
  trackingId: string // Optional tracking ID for debugging and timing
  source: SocialMediaType // Optional source (WHATSAPP, INSTAGRAM, etc.)
  metaConfig: IMetaAttributes // Meta configuration from database,
  isFirstMessage: boolean
  phoneNumberId: string
}

export interface SendToAgent {
  orgId: string
  socialId: string
  userId: string
  messageType: string
  mediaUrl: string
  message: string
  mobileNumber?: string
  metadata: string
  timestamp: Date
  isMediaMessage: boolean
  isTextMessage: boolean
  welcomeMessage: IWelcomeMessage | null
  source: SocialMediaType
  input: string
  user_id: string
  uploadMediaKey?: string
  publicBucketName?: string
  publicBucketAccessId?: string
  publicBucketSecretAccessKey?: string
  bucketRegion?: string
  responseId?: string
  messageId?: string | null | undefined
  trackingId: string // Optional tracking ID for timing AI responses
}

export type ParseSocialType = Record<
  string,
  {
    contact: Omit<ISocialContract, 'contactId' | 'createdAt' | 'orgId' | 'updatedAt' | 'isBlocked'>
    message: Omit<ISocialMessage, 'id' | 'messageId' | 'contactId' | 'orgId' | 'createdAt' | 'updatedAt'>[]
    referral?: IWhatsAppReferral
  }
>

export interface AddCallActivityDto {
  callId: string
  callStatus: string
  sid: string
  callSuccessful: boolean
  disconnectionReason?: string
  callDuration: number
  description: string
  action: string
  referenceId: string
  userSentiment: string
  circle: string
  aiSummery: string
  recordingUrl: string
  direction: MessageDirection
}

export interface AppointmentConfirmMessageData {
  name: string
  appointmentType: string
  date: string
  status:string
  time: string
}
export type MessageTemplateType = 'WELCOME_MESSAGE' | 'TESTIMONIAL_MESSAGE' | 'APPOINTMENT_MESSAGE' | "SEND_ADDRESS_TEMPLATE"
export interface SocialMessageRequest {
  message: string
  socialId: string
  orgId: string
  userId?: UUIDTypes
  buttons?: string[]
  isTemplated:boolean
  needToAskForLead: boolean
  messageId?: string | null | undefined
  mediaObject?: null | {
    bucketKey: string | null
    publicUrl: string
    type: MediaTypeEnum
    caption?: string
    fileName?: string
    mimeType?: string
  }
  testimonialMediaObject?: null | IMessage
  template:IWhatsAppTemplate| null,
  trackingId?: string
  source?: SocialMediaType
  name?: string
  bodyObject?:string[]
  headerImageUrl?: string
  templateVariables?: Record<string, string | number>
}

export interface CreateLeadFromSocialMessageRequest {
  notes: string
  mobileNumber: string
  email?: string
  name: string
  language?: string
  leadResourceID?: string
  isValidName: boolean
  source: string
  referral?: IWhatsAppReferral
}

export interface JsonSchema {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
  pattern?: string
  require: boolean
  enum?: string[]
  minimum?: string
  maximum?: string
  items?: {
    type: string
    pattern: string
  }
  format?: 'date-time'
}

/**
 * Agent server declaration inside your agent JSON
 */
export interface AgentServer {
  url: string
  type: string
}

/**
 * Agent JSON file structure
 */
export interface AgentDefinition {
  id?: string
  version?: string
  name?: string
  description?: string
  servers?: AgentServer[]
  ui?: any
}

export interface Permission {
  code: string
  name: string
  category: string
  description: string
  permissionId: string
  isActive: boolean
}

export interface RolePermissionsInterface {
  role: string
  name: string
  description: string
  permissions: Permission[]
}

export interface UserWithPermissionId extends IUsers {
  permissions: {
    permissionIds: string[]
  }
}

export interface RoleWithPermissionId extends IRole {
  permissions: {
    permissionIds: string[]
  }
}

export interface UserPermissionsInterface extends IUsers {
  permissions: Permission[]
}

// WhatsApp Chat Service Interfaces
export interface IWhatsAppBaseParams {
  metaConfig: IMetaAttributes
  trackingId: string
  orgId: string
  phoneNumberId:string
  socialMessageId: string
}

export interface ISendTextMessageParams extends IWhatsAppBaseParams {
  mobileNumber: string
  messages: string
  replyToMessageId?: string | null
}

export interface ISendMessageToReplyParams extends IWhatsAppBaseParams {
  mobileNumber: string
  messages: string
}

export interface ISendVideoParams extends IWhatsAppBaseParams {
  mobileNumber: string
  videoLinkUrl: string
  captionText: string
}

export interface ISendTypingIndicatorParams extends IWhatsAppBaseParams {
  whatsappMessageId: string
}

export interface ISendButtonMessageParams extends IWhatsAppBaseParams {
  mobileNumber: string
  messages: string
  buttons: string[]
  replyToMessageId?: string | null
}

export interface IUploadAudioMessageParams extends IWhatsAppBaseParams {
  mobileNumber: string
  link: string
}

export interface ISendLanguageWelcomeMessageParams extends IWhatsAppBaseParams {
  mobileNumber: string
  replyToMessageId?: string | null
}

export interface ISendWhatsAppOtpParams {
  mobileNumber: string
  otp: string
  trackingId: string
}

export interface IDownloadWhatsappMediaParams extends IWhatsAppBaseParams {
  mediaId: string
}

export interface IUploadWhatsAppMediaParams extends IWhatsAppBaseParams {
  fileUrl: string
}

export interface ISendAudioMessageParams extends IWhatsAppBaseParams {
  mobileNumber: string
  whatsappDocumentId: string
  replyToMessageId?: string | null
}

export interface ISendAppointmentStatusTemplateParams extends IWhatsAppBaseParams {
  mobileNumber: string
  template: IWhatsAppTemplate
  params: AppointmentConfirmMessageData
}

export interface ISendAddressTemplateParams extends IWhatsAppBaseParams {
  mobileNumber: string
  template: IWhatsAppTemplate
}


export interface ICustomsTemplateParams extends IWhatsAppBaseParams {
  mobileNumber: string
  template: IWhatsAppTemplate
}

export interface ISendAudioMessageWithUrlParams extends IWhatsAppBaseParams {
  mobileNumber: string
  publicUrl: string
  replyToMessageId?: string | null
}

export interface ISendImageParams extends IWhatsAppBaseParams {
  mobileNumber: string
  imageUrl: string
  caption?: string
}

export interface ISendDocumentParams extends IWhatsAppBaseParams {
  mobileNumber: string
  documentUrl: string
  fileName?: string
  caption?: string
}

export interface ISendWhatsAppTemplateMessageParams extends IWhatsAppBaseParams {
  mobileNumber:string
  template: IWhatsAppTemplate
  bodyParameters: string[]
  buttons:string[]
}

export interface ISendDynamicTemplateParams extends IWhatsAppBaseParams {
  mobileNumber: string
  template: IWhatsAppTemplate
  variables: Record<string, string | number>
  /**
   * Optional override. When the template has no stored `components` yet,
   * the caller can build them on the fly (e.g. via `buildLegacyComponents`)
   * and pass them in here without mutating the org-config template object.
   */
  components?: import('./model').StoredTemplateComponent[]
}

export interface ISaveWhatsappApiSuccessParams {
  messageId: string
  orgId: string
  trackingId: string
  eventName: string
  body: any
  response: any
  mobileNumber: string
}

export interface ISaveWhatsappApiErrorParams {
  orgId: string
  messageId:string
  trackingId: string
  eventName: string
  body: any
  error: any
  mobileNumber: string
}

export interface IGetPaginatedWhatsappApiResponsesParams {
  page: number
  limit: number
  mobileNumber?: string
  eventName?: string
  status?: string
  orgId?: string
}

// ==================== Treatment Workflow Enums ====================

// Treatment
export enum TreatmentType { OBSTETRIC = 'OBSTETRIC', GYNAECOLOGY = 'GYNAECOLOGY', GENERAL_PREGNANCY = 'GENERAL_PREGNANCY', IUI = 'IUI', IVF = 'IVF', ICSI = 'ICSI', EGG_FREEZING = 'EGG_FREEZING', DONOR_PROGRAM = 'DONOR_PROGRAM', OI_TI_IUI = 'OI_TI_IUI', IVF_ICSI = 'IVF_ICSI', NATURAL_CONCEPTION = 'NATURAL_CONCEPTION' }
export enum TreatmentStatus { ACTIVE = 'ACTIVE', PAUSED = 'PAUSED', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', ESCALATED = 'ESCALATED' }
export enum TreatmentSubType { TIMED_INTERCOURSE = 'TIMED_INTERCOURSE', IUI = 'IUI', IVF = 'IVF', ICSI = 'ICSI', EGG_FREEZING = 'EGG_FREEZING', DONOR_PROGRAM = 'DONOR_PROGRAM', OBSTETRIC = 'OBSTETRIC', GYNAECOLOGY = 'GYNAECOLOGY' }

// Cycle
export enum CycleStatus { WAITING_DAY2 = 'WAITING_DAY2', BASELINE = 'BASELINE', STIMULATION = 'STIMULATION', TRIGGER = 'TRIGGER', POST_TRIGGER = 'POST_TRIGGER', LUTEAL = 'LUTEAL', OUTCOME = 'OUTCOME', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
export enum CycleOutcome { PREGNANT = 'PREGNANT', FAILED_MENSES = 'FAILED_MENSES', FAILED_NEGATIVE = 'FAILED_NEGATIVE', CANCELLED_OHSS = 'CANCELLED_OHSS', CANCELLED_POOR_RESPONSE = 'CANCELLED_POOR_RESPONSE', CANCELLED_OTHER = 'CANCELLED_OTHER', ECTOPIC = 'ECTOPIC', BIOCHEMICAL_LOSS = 'BIOCHEMICAL_LOSS' }

// Workflow Task
export enum WorkflowPhase { INITIAL_ASSESSMENT = 'INITIAL_ASSESSMENT', TREATMENT_PLANNING = 'TREATMENT_PLANNING', ACTIVE_CYCLE = 'ACTIVE_CYCLE', OUTCOME = 'OUTCOME' }

// Timeline
export enum TimelineStatus { PENDING = 'PENDING', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED', SKIPPED = 'SKIPPED' }

// AssigneeRole
export enum AssigneeRole { DOCTOR = 'DOCTOR', COORDINATOR = 'COORDINATOR', NURSE = 'NURSE', LAB_TECH = 'LAB_TECH', PATIENT = 'PATIENT', COUNSELLOR = 'COUNSELLOR' }

// OHSS
export enum OHSSRisk { LOW = 'LOW', MODERATE = 'MODERATE', HIGH = 'HIGH' }

// Monitoring
export enum EndometrialPattern { TRILAMINAR = 'TRILAMINAR', ECHOGENIC = 'ECHOGENIC', HETEROGENEOUS = 'HETEROGENEOUS' }

// Medication
export enum MedicationRoute { ORAL = 'ORAL', INJECTABLE = 'INJECTABLE', VAGINAL = 'VAGINAL', SUBCUTANEOUS = 'SUBCUTANEOUS' }
export enum OIDrug { CLOMIPHENE_CITRATE = 'CLOMIPHENE_CITRATE', LETROZOLE = 'LETROZOLE', GONADOTROPINS = 'GONADOTROPINS', HMG = 'HMG' }

// Beta-hCG
export enum BetaHCGResult { POSITIVE = 'POSITIVE', NEGATIVE = 'NEGATIVE', INDETERMINATE = 'INDETERMINATE' }
export enum PregnancyViability { VIABLE = 'VIABLE', NON_VIABLE = 'NON_VIABLE', ECTOPIC_SUSPECTED = 'ECTOPIC_SUSPECTED', PENDING = 'PENDING' }

// ==================== Exotel Service Interfaces ====================

export interface TokenCache {
  token: string
  expiry: number
}

// ==================== Queue Service Interfaces ====================

export interface AgentJobData extends SendToAgent {
  retryCount?: number
}

export interface QueueConfig {
  concurrency?: number
  maxRetries?: number
  retryDelay?: number
  removeOnComplete?: boolean | number
  removeOnFail?: boolean | number
}

// ==================== SOP Queue Interfaces ====================

export interface SOPDocumentJobData {
  treatmentTypeId: string
  text: string
  treatmentTypeName: string
  orgId: string
  userId: string
}

// ==================== Country Service Interfaces ====================

export interface ICountryInfo {
  code: string
  dialCode: string
  name: string
  iso2: string
  iso3: string
  mobileValidation: {
    minLength: number
    maxLength: number
    totalMinLength: number
    totalMaxLength: number
    regex: string
    regexWithPlus: string
    description: string
    example: string
  }
}

// ==================== Organization Master Data Types ====================

export type MasterDataField = 'activityType' | 'leadSource' | 'leadStatus' | 'appointmentType' | 'appointmentMode' | 'documentType' | 'sopTreatmentTypes' | 'sopTaskCategories'


// ─── Resolved Exotel config ─────────────────────────────────────────────────
// Loaded per-call from OrganizationConfiguration.exotelConfiguration. All
// fields required by the Integrations Core API are non-optional here so
// downstream methods don't need to re-validate.
export interface IExotelResolvedConfig {
  customerId: string
  customerSecret: string
  appId: string
  appSecret: string
  accountSid: string
  virtualNumber: string
  domain: string
  integrationsBaseUrl: string
  subdomain?: string
  apiKey?: string
  apiToken?: string
}


// ─── Exotel Integrations API response shapes ─────────────────────────────────
// Shape of the `Data` object returned by GET/POST /v2/integrations/usermapping.
// All fields are server-controlled; we mark optional anything that may be empty.
export interface IExotelUserMapping {
  CustomerId: string
  AppID: string
  AppUserId: string
  ExotelAccountSid: string
  ExotelUserId: string
  AppUsername: string
  ExotelUserName: string
  AgentNumber?: string
  ActiveDeviceId?: string
  PhoneDeviceID?: string
  SipDeviceID?: string
  VirtualNumber: string
  Email: string
  OutboundActive: boolean
  Role: string
  SipId: string
  SipSecret: string
  IsActive: boolean
  CreatedAt: string
  UpdatedAt: string
}

export interface IExotelApiResponse<T> {
  RequestId: string
  Status: 'Success' | string
  Code: number
  Error: string
  Data: T | T[] | null
}

export interface RecordOutboundCallStartedInput {
  orgId: string
  userId?: string
  leadId?: string
  patientId?: string
  customerNumber: string
  callSid: string
  fromNumber?: string
}

export interface RecordInboundCallInput {
  orgId: string
  userId?: string
  leadId?: string
  customerNumber: string
  callSid: string
  fromNumber?: string
  toNumber?: string
}

export interface ExotelStatusCallbackPayload {
  CallSid?: string
  Status?: string
  CallStatus?: string
  ConversationDuration?: string | number
  DialCallDuration?: string | number
  RecordingUrl?: string
  From?: string
  To?: string
  Direction?: string
  // Exotel sometimes posts these too:
  RecordingAvailableBy?: string
}

