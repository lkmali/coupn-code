import { QueryFilter } from 'mongoose'
import { Permission, IPermission } from '../models'
import { getLogger } from '../../../utils'
import { jsonParse, jsonStringify, convertQueryIds } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoPermissionRepository {
  constructor() {}

  async savePermission(
    data: Partial<IPermission>,
    options: MongoQueryOptions = {}
  ): Promise<IPermission> {
    try {
      const permission = new Permission(data)
      return await permission.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('savePermission_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getPermission(
    query: QueryFilter<IPermission>,
    options: MongoQueryOptions = {}
  ): Promise<IPermission | null> {
    try {
      let queryBuilder = Permission.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getPermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getPermissions(
    query: QueryFilter<IPermission>,
    options: MongoQueryOptions = {}
  ): Promise<IPermission[]> {
    try {
      let queryBuilder = Permission.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getPermissions_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updatePermission(
    query: QueryFilter<IPermission>,
    update: Partial<IPermission>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await Permission.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updatePermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removePermission(
    query: QueryFilter<IPermission>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await Permission.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removePermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<IPermission>): Promise<number> {
    try {
      return await Permission.countDocuments(convertQueryIds(query))
    } catch (error: any) {
      getLogger().error('countDocuments_Error', {
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
  ): Promise<IPermission | null> {
    try {
      let queryBuilder = Permission.findById(id)

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
