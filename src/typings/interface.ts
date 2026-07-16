import { UUIDTypes } from 'uuid'
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

export interface UserProfile {
  userId: any
  sessionId: any
  email?: string
  orgId: any
  isActive: boolean
  isNewUser?: boolean
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







export interface Profile {
  name: string
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