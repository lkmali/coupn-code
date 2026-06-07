import { UUIDTypes } from 'uuid'
import {
  MediaTypeEnum,
  MessageDirection,
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


export interface ITokens {
  id: string
  verificationKey: string
  verifyCode: string
  metaData?: object | null
  otpExpires: Date
  updatedAt: Date
  createdAt: Date
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




export interface IOrganizationConfiguration {
  configId: string
  orgId: string
  phoneNumbersId: string[]
  phoneNumberInformation: { phoneNumber: string; location: string }[]
  logoUrl?: string
  defaultLanguage:string
  metaAttributes: IMetaAttributes
  whatsappTemplate?: Record<string, IWhatsAppTemplate>
  stripeConfiguration?: import('./payment').IStripeConfiguration
  openaiApiKey?: string
  openaiModel?: string
  isDeleteAllowed: boolean
  isActive?: boolean
  isDelete?: boolean
  createdBy?: UUIDTypes
  updatedBy: UUIDTypes
  createdAt: Date
  updatedAt: Date
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
  roleKey: string
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

