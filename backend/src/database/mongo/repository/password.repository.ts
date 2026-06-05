import { QueryFilter } from 'mongoose'
import { Password, IPassword } from '../models'
import { getLogger } from '../../../utils'
import { jsonParse, jsonStringify, convertQueryIds } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoPasswordRepository {
  constructor() {}

  async savePassword(
    data: Partial<IPassword>,
    options: MongoQueryOptions = {}
  ): Promise<IPassword> {
    try {
      const password = new Password(data)
      return await password.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('savePassword_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async getPassword(
    query: QueryFilter<IPassword>,
    options: MongoQueryOptions = {}
  ): Promise<IPassword | null> {
    try {
      let queryBuilder = Password.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getPassword_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updatePassword(
    query: QueryFilter<IPassword>,
    update: Partial<IPassword>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await Password.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updatePassword_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removePassword(
    query: QueryFilter<IPassword>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await Password.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removePassword_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async findById(
    id: string,
    options: MongoQueryOptions = {}
  ): Promise<IPassword | null> {
    try {
      let queryBuilder = Password.findById(id)

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('findById_Error', {
        error: error.message,
        stack: error.stack,
        id,
      })
      throw error
    }
  }
}
