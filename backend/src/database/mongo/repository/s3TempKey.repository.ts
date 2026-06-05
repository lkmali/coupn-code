import { QueryFilter } from 'mongoose'
import { S3TempKey, IS3TempKey } from '../models'
import { getLogger } from '../../../utils'
import { jsonParse, jsonStringify, convertQueryIds } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()

export class MongoS3TempKeyRepository {
  constructor() {}

  async saveS3TempKey(data: Partial<IS3TempKey>, options: MongoQueryOptions = {}): Promise<IS3TempKey> {
    try {
      const s3TempKey = new S3TempKey(data)
      const saved = await s3TempKey.save({ session: options.session })
      return jsonParse(jsonStringify(saved.toObject()))

      return await s3TempKey.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveS3TempKey_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getS3TempKey(query: QueryFilter<IS3TempKey>, options: MongoQueryOptions = {}): Promise<IS3TempKey | null> {
    try {
      let queryBuilder = S3TempKey.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getS3TempKey_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getS3TempKeys(query: QueryFilter<IS3TempKey>, options: MongoQueryOptions = {}): Promise<IS3TempKey[]> {
    try {
      let queryBuilder = S3TempKey.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getS3TempKeys_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateS3TempKey(
    query: QueryFilter<IS3TempKey>,
    update: Partial<IS3TempKey>,
    options: MongoQueryOptions = {},
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await S3TempKey.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateS3TempKey_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeS3TempKey(
    query: QueryFilter<IS3TempKey>,
    options: MongoQueryOptions = {},
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await S3TempKey.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeS3TempKey_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<IS3TempKey>): Promise<number> {
    try {
      return await S3TempKey.countDocuments(convertQueryIds(query))
    } catch (error: any) {
      getLogger().error('countDocuments_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async findById(id: string, options: MongoQueryOptions = {}): Promise<IS3TempKey | null> {
    try {
      let queryBuilder = S3TempKey.findById(id)

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
