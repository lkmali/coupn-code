import { PipelineStage, QueryFilter } from 'mongoose'
import { RolePermission, IRolePermission } from '../models'
import { getLogger } from '../../../utils'
import { convertQueryIds, jsonParse, jsonStringify } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoRolePermissionRepository {
  constructor() {}

  async saveRolePermission(
    data: Partial<IRolePermission>,
    options: MongoQueryOptions = {}
  ): Promise<IRolePermission> {
    try {
      const rolePermission = new RolePermission(data)
      return await rolePermission.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveRolePermission_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getRolePermission(
    query: QueryFilter<IRolePermission>,
    options: MongoQueryOptions = {}
  ): Promise<IRolePermission | null> {
    try {
      let queryBuilder = RolePermission.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getRolePermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getRolePermissions(
    query: QueryFilter<IRolePermission>,
    options: MongoQueryOptions = {}
  ): Promise<IRolePermission[]> {
    try {
      let queryBuilder = RolePermission.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getRolePermissions_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getRolePermissionsWithDetails(
    query: QueryFilter<IRolePermission>,
    options: MongoQueryOptions = {}
  ): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'roles',
            localField: 'roleId',
            foreignField: '_id',
            as: 'role',
          },
        },
        {
          $unwind: {
            path: '$role',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'permissions',
            localField: 'permissionIds',
            foreignField: '_id',
            as: 'permissions',
          },
        },
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

      return jsonParse(jsonStringify(await RolePermission.aggregate(pipeline)))
    } catch (error: any) {
      getLogger().error('getRolePermissionsWithDetails_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateRolePermission(
    query: QueryFilter<IRolePermission>,
    update: Partial<IRolePermission>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await RolePermission.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateRolePermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeRolePermission(
    query: QueryFilter<IRolePermission>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await RolePermission.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeRolePermission_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<IRolePermission>): Promise<number> {
    try {
      return await RolePermission.countDocuments(convertQueryIds(query))
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
  ): Promise<IRolePermission | null> {
    try {
      let queryBuilder = RolePermission.findById(id)

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
