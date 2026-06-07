/**
 * Shared application types mirroring the backend API contracts.
 */

export type Role = "ADMIN" | "USER";

export type UserStatus = "ACTIVE" | "INACTIVE";

/** Response of POST /auth/login */
export interface LoginResponse {
  userId: string;
  isNewUser: boolean;
  roles: Role[];
  token: string;
}

/** Logged in user profile (GET /user/profile -> data) */
export interface UserProfile {
  userId: string;
  orgId?: string;
  userName: string;
  email: string;
  mobileNumber?: string;
  role?: Role;
  roles?: Role[];
  specialization?: string[];
  languagesSpoken?: string[];
  experienceYears?: number;
  qualifications?: string[];
  isActive?: boolean;
}

/** A row in the admin user list (GET /user) */
export interface UserListItem {
  userId: string;
  userName: string;
  email: string;
  mobileNumber?: string;
  roles?: Role[];
  isActive: boolean;
  createdAt?: string;
}

export interface PaginatedUsers {
  rows: UserListItem[];
  count: number;
}

export interface CreateUserPayload {
  userName: string;
  email: string;
  mobileNumber: string;
  password: string;
  roles: Role[];
}

export interface UserListQuery {
  pageNumber?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  role?: Role;
}

/** Phone number entry inside organization configuration */
export interface PhoneNumberInfo {
  phoneNumber: string;
  location?: string;
  isEnabled?: boolean;
}

export interface WhatsappConfig {
  token?: string;
  phoneNumberId?: string;
}

export interface MetaAttributes {
  baseUrl?: string;
  version?: string;
  whatsappAgentsUrl?: string;
  appSecret?: string;
  userAccessToken?: string;
  whatsapp?: WhatsappConfig;
}

export interface GeminiAIConfiguration {
  apiKey?: string;
  baseUrl?: string;
}

/** Per-organization Exotel softphone configuration */
export interface ExotelConfiguration {
  customerId?: string;
  customerSecret?: string;
  appId?: string;
  appSecret?: string;
  accountSid?: string;
  virtualNumber?: string;
  domain?: string;
  integrationsBaseUrl?: string;
  apiKey?: string;
  apiToken?: string;
  subdomain?: string;
  webhookToken?: string;
  isEnabled?: boolean;
}

export type Language = "HINDI" | "GUJARATI" | "ENGLISH";

/** Organization configuration (subset used by the admin UI) */
export interface OrganizationConfiguration {
  metaAttributes?: MetaAttributes;
  phoneNumberInformation?: PhoneNumberInfo[];
  openaiApiKey?: string;
  geminiAIConfiguration?: GeminiAIConfiguration;
  exotelConfiguration?: ExotelConfiguration;
  defaultLanguage?: Language;
  isDeleteAllowed?: boolean;
}

/** Generic API envelope used by several endpoints */
export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}
