import { QueryFilter } from 'mongoose'
import { User, IUser } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoUserRepository {
  async saveUser(data: Partial<IUser>, options: MongoQueryOptions = {}): Promise<IUser> {
    try {
      const user = new User(data)
      return await user.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveUser_Error', {
        error: error.message,
        stack: error.stack,
        mobileNumber: data.mobileNumber,
      })
      throw error
    }
  }

  async getUserInformation(query: QueryFilter<IUser>): Promise<IUser | null> {
    try {
      const result = await User.findOne({ ...convertQueryIds(query), isDelete: false })
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('getUserInformation_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  /**
   * Update one user and hand back the post-update document, so callers can
   * return the saved record without a second round-trip.
   */
  async updateUserInformation(
    query: QueryFilter<IUser>,
    update: Record<string, any>,
    options: MongoQueryOptions = {},
  ): Promise<IUser | null> {
    try {
      const result = await User.findOneAndUpdate(convertQueryIds(query), update, {
        session: options.session,
        new: true,
      })
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('updateUserInformation_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }
}
