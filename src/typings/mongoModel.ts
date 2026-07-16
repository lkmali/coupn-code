// ==================== User ===================

import mongoose, { ClientSession, Document } from 'mongoose'

export interface IMongoUser extends Document {
  _id: mongoose.Types.ObjectId
  userName: string
  mobileNumber: string
  upiId: string
  /**
   * Every browser/device this person has been seen on. A cleared localStorage
   * mints a fresh id, so one human legitimately accumulates several.
   */
  machineIds: string[]
  /**
   * Fingerprint hashes seen for this user — the fallback lookup when
   * localStorage has been wiped and no machineId is sent.
   */
  fingerprints: string[]
  isDelete: boolean
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
