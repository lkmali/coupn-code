import { PipelineStage, QueryFilter } from 'mongoose'
import { UserPermission, IUserPermission } from '../models'
import { getLogger } from '../../../utils'
import { convertQueryIds, jsonParse, jsonStringify } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoUserPermissionRepository {
  constructor() {}

  async saveUserPermission(
    data: Partial<IUserPermission>,
    options: MongoQueryOptions = {}
  ): Promise<IUserPermission> {
    try {
      const userPermission = new UserPermission(data)
      return await userPermission.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveUserPermission_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getUserPermission(
    query: QueryFilter<IUserPermission>,
    options: MongoQueryOptions = {}
  ): Promise<IUserPermission | null> {
    try {
      let queryBuilder = UserPermission.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getUserPermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getUserPermissions(
    query: QueryFilter<IUserPermission>,
    options: MongoQueryOptions = {}
  ): Promise<IUserPermission[]> {
    try {
      let queryBuilder = UserPermission.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getUserPermissions_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getUserPermissionsWithDetails(
    query: QueryFilter<IUserPermission>,
    options: MongoQueryOptions = {}
  ): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'permissions',
            localField: 'permissionId',
            foreignField: '_id',
            as: 'permission',
          },
        },
        { $unwind: { path: '$permission', preserveNullAndEmptyArrays: true } },
      ]

      if (options.sort) {
        pipeline.push({ $sort: options.sort })
      }
      if (options.skip) {
        pipeline.push({ $skip: options.skip })
      }
      if (options.limit) {
        pipeline.push({ $limit: options.limit })
      }
      if (options.select) {
        pipeline.push({ $project: options.select })
      }

      return jsonParse(jsonStringify(await UserPermission.aggregate(pipeline)))
    } catch (error: any) {
      getLogger().error('getUserPermissionsWithDetails_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateUserPermission(
    query: QueryFilter<IUserPermission>,
    update: Partial<IUserPermission>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await UserPermission.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateUserPermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeUserPermission(
    query: QueryFilter<IUserPermission>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await UserPermission.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeUserPermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<IUserPermission>): Promise<number> {
    try {
      return await UserPermission.countDocuments(convertQueryIds(query))
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
  ): Promise<IUserPermission | null> {
    try {
      let queryBuilder = UserPermission.findById(id)

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
