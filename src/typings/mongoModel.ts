
// ==================== User ===================

import mongoose, {ClientSession, Document} from "mongoose"

export interface IMongoUser extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId // Same as _id, for SQL naming compatibility
  roles: string[]
  mobileNumber: string
  countryCode?: string
  userName?: string
  email?: string
  isVerified: boolean
  isMainAdmin: boolean
  isBlocked: boolean
  isActive: boolean
  isDelete: boolean
  lastLoginAt?: Date
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

export type IUser = IMongoUser
