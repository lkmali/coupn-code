import mongoose, { ClientSession, Document } from 'mongoose'


// ==================== User ====================


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
  
  logoUrl?: string
  metaAttributes?: Record<string, any>
  welcomeMessage?: Record<string, any>

  phoneNumbersId?: string[]
  phoneNumberInformation?: IPhoneNumberInfo[]
 
  exotelConfiguration?: IExotelConfiguration
  geminiAIConfiguration?: IGeminiAIConfiguration
  stripeConfiguration?: import('./payment').IStripeConfiguration
  openaiApiKey?: string
  openaiModel?: string
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


// ==================== Gemini AI Configuration ====================
export interface IGeminiAIConfiguration {
  apiKey?: string
  baseUrl?: string
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

// ==================== Type Aliases for backward compatibility ====================
// These aliases map the new MongoDB interface names to the original names used in model files
export type IUser = IMongoUser
export type IOrganization = IMongoOrganization

export type ISocialContact = IMongoSocialContact
export type ISocialMessage = IMongoSocialMessage
export type IToken = IMongoToken
export type IPassword = IMongoPassword
export type IS3TempKey = IMongoS3TempKey
export type IOrganizationConfiguration = IMongoOrganizationConfiguration
export type IRole = IMongoRole
export type IPermission = IMongoPermission
export type IRolePermission = IMongoRolePermission
export type IUserPermission = IMongoUserPermission
export type IWhatsappApiResponse = IMongoWhatsappApiResponse

export interface IUserExotelCredentials {
  sipId: string
  sipSecret: string
  exotelUserId?: string
  registeredAt?: Date
  // Toggled by the agent's softphone widget. When false, pickAgentForIncomingCall
  // skips this user. Undefined / true → eligible.
  isAvailable?: boolean
  availabilityUpdatedAt?: Date
  // ── V2 user-mapping fields (populated by exotel.service.registerAgent) ──
  // Stored alongside sipId/sipSecret so the softphone has everything it
  // needs without re-hitting the Exotel API on every login. The published
  // mongoose schema in @common/common does not declare these paths yet,
  // so writes go through ExotelService via { strict: false }.
  deviceId?: string
  sipUsername?: string
  domain?: string
  status?: 'ACTIVE' | 'INACTIVE'
  lastValidatedAt?: Date
  // VirtualNumber currently bound to this agent on Exotel's side. On every
  // outbound call we compare this to the org's exotelConfiguration.virtualNumber
  // and, on mismatch, push the org value to Exotel so the recipient sees the
  // org-configured number (never a stale per-user one).
  lastSyncedVirtualNumber?: string
}

// ==================== User ===================

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

export interface MongoQueryOptions {
  session?: ClientSession
  select?: Record<string, 0 | 1>
  sort?: Record<string, 1 | -1>
  limit?: number
  skip?: number
}

