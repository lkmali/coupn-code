import {UUIDTypes} from "uuid"

export interface IUsers {
  userId: UUIDTypes
  mobileNumber: string
  email?: string
  orgId: string
  countryCode: string
  userName: string
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
