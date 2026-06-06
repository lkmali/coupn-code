import { PipelineStage, QueryFilter } from 'mongoose'
import { Organization, IOrganization } from '../models'
import { getLogger } from '../../../utils'
import { convertQueryIds, jsonParse, jsonStringify } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoOrganizationRepository {
  constructor() {}

  async saveOrganization(
    data: Partial<IOrganization>,
    options: MongoQueryOptions = {}
  ): Promise<IOrganization> {
    try {
      const org = new Organization(data)
      return await org.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveOrganization_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getOrganizationInformation(
    query: QueryFilter<IOrganization>,
    options: MongoQueryOptions = {}
  ): Promise<IOrganization | null> {
    try {
      let queryBuilder = Organization.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getOrganizationInformation_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getOrganizationsList(
    query: QueryFilter<IOrganization>,
    options: MongoQueryOptions = {}
  ): Promise<IOrganization[]> {
    try {
      let queryBuilder = Organization.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getOrganizationsList_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getAllOrganizationsWithUsers(
    _options: MongoQueryOptions = {}
  ): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { isDelete: false } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'orgId',
            as: 'users',
          },
        },
        {
          $addFields: {
            users: {
              $filter: {
                input: '$users',
                as: 'user',
                cond: { $eq: ['$$user.isDelete', false] },
              },
            },
          },
        },
        {
          $addFields: {
            users: {
              $map: {
                input: '$users',
                as: 'user',
                in: {
                  _id: '$$user._id',
                  userId: '$$user._id',
                  userName: '$$user.userName',
                  email: '$$user.email',
                  mobileNumber: '$$user.mobileNumber',
                  roles: '$$user.roles',
                  isActive: '$$user.isActive',
                  isBlocked: '$$user.isBlocked',
                  isMainAdmin: '$$user.isMainAdmin',
                  createdAt: '$$user.createdAt',
                  lastLoginAt: '$$user.lastLoginAt',
                },
              },
            },
          },
        },
      ]

      return jsonParse(jsonStringify(await Organization.aggregate(pipeline)))
    } catch (error: any) {
      getLogger().error('getAllOrganizationsWithUsers_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async updateOrganization(
    query: QueryFilter<IOrganization>,
    update: Partial<IOrganization>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await Organization.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateOrganization_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(
    query: QueryFilter<IOrganization>,
    _options: MongoQueryOptions = {}
  ): Promise<number> {
    try {
      return await Organization.countDocuments(convertQueryIds(query))
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
  ): Promise<IOrganization | null> {
    try {
      let queryBuilder = Organization.findById(id)

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

  async deleteOrganization(
    query: QueryFilter<IOrganization>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await Organization.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('deleteOrganization_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }
}
