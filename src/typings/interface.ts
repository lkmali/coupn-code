import { UUIDTypes } from 'uuid'
import { ISocialContract, ISocialMessage, IUsers, IMetaAttributes, IWelcomeMessage, IMessage, IWhatsAppTemplate } from './model'

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
  PATIENT_OTP_AUTH = 'patientOtpAuth',
  STRIPE_WEBHOOK = 'stripeWebhook',
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

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum WebhookEventType {
  WHATSAPP_MESSAGE = 'messages',
  FACEBOOK_LEADGEN = 'leadgen',
  INSTAGRAM_MESSAGE = 'instagram_messages',
}


export enum TemplateName {
  SET_PASSWORD = 'SET_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',
  SHARED_RESOURCE = 'SHARED_RESOURCE',
  WELCOME_EMAIL = 'WELCOME_EMAIL',
  CUSTOM_EMAIL = 'CUSTOM_EMAIL',
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



export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface UserProfile {
  userId: any
  roles: Role[]
  role?: Role
  sessionId: any
  email?: string
  orgId: any
  isActive: boolean
  isNewUser?: boolean
}


export interface Password {
  userId: UUIDTypes
  password: string
}


export interface UserCredentials {
  email: string
  password: string
}


export enum SortingOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface PaginateDataType<T> {
  count: number
  data: T[]
}


export interface GetUserArg {
  userId: UUIDTypes
  userName: string
  mobileNumber?: string
}

export interface UserCredentials {
  email: string
  password: string
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
  }
>


export interface AppointmentConfirmMessageData {
  name: string
  appointmentType: string
  date: string
  status:string
  time: string
}
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


export interface IDownloadWhatsappMediaParams extends IWhatsAppBaseParams {
  mediaId: string
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


export interface ExotelConfig {
  isEnabled?: boolean
  recordingStoreInS3?: boolean
  accountSid?: string
  apiKey?: string
  apiToken?: string
  customerId?: string
  customerSecret?: string
  // Exotel REST API subdomain — e.g. "api.exotel.com" (Singapore) or
  // "api.in.exotel.com" (Mumbai). Stored with or without leading "@".
  subdomain?: string
  [k: string]: any
}

export interface IExotelConfiguration {
  customerId?: string
  customerSecret?: string
  appId?: string
  appSecret?: string
  accountSid?: string
  apiKey?: string
  apiToken?: string
  virtualNumber?: string
  domain?: string
  integrationsBaseUrl?: string
  subdomain?: string
  webhookToken?: string
  isEnabled: boolean
  recordingStoreInS3?: boolean
}

