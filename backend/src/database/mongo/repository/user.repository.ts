import { ClientSession, PipelineStage, QueryFilter } from 'mongoose'
import { User, IUser } from '../models'
import { getLogger } from '../../../utils'
import {convertQueryIds, jsonParse, jsonStringify} from '../../../utils'
import {MongoQueryOptions} from '../../../typings'

// logger accessed via getLogger()



export class MongoUserRepository {
  constructor() {}

  async saveUser(data: Partial<IUser>, options: MongoQueryOptions = {}): Promise<IUser> {
    try {
      const user = new User(data)
      return await user.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveUser_Error', {
        error: error.message,
        stack: error.stack,
        email: data.email,
        mobileNumber: data.mobileNumber,
      })
      throw error
    }
  }

  async countDocument(query: QueryFilter<IUser>): Promise<number> {
    try {
      return await User.countDocuments(convertQueryIds(query))
    } catch (error: any) {
      getLogger().error('countDocument_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async getUserInformation(query: QueryFilter<IUser>, options: MongoQueryOptions = {}): Promise<IUser | null> {
    try {
      let queryBuilder = User.findOne({ ...convertQueryIds(query), isDelete: false })

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getUserInformation_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getUserList(query: QueryFilter<IUser>, options: MongoQueryOptions = {}): Promise<IUser[]> {
    try {
      let queryBuilder = User.find({ ...convertQueryIds(query), isDelete: false })

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getUserList_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getUserListWithOthersInfo(query: QueryFilter<IUser>, options: MongoQueryOptions = {}): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { ...convertQueryIds(query), isDelete: false } as any },
        {
          $lookup: {
            from: 'doctors',
            localField: '_id',
            foreignField: 'userId',
            as: 'doctor',
          },
        },
        {
          $unwind: {
            path: '$doctor',
            preserveNullAndEmptyArrays: true,
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
      if (options.select) {
        pipeline.push({ $project: options.select })
      }

      return jsonParse(jsonStringify(await User.aggregate(pipeline)))
    } catch (error: any) {
      getLogger().error('getUserListWithOthersInfo_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateUserInformation(
    query: QueryFilter<IUser>,
    update: Partial<IUser>,
    options: MongoQueryOptions = {},
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await User.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateUserInformation_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeUser(query: QueryFilter<IUser>, options: MongoQueryOptions = {}): Promise<void> {
    try {
      await User.updateMany(convertQueryIds(query), { isDelete: true,updatedAt:new Date() }, { session: options.session })
    } catch (error: any) {
      getLogger().error('removeUser_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getUserPassword(query: QueryFilter<IUser>): Promise<any> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'passwords',
            localField: '_id',
            foreignField: 'userId',
            as: 'Password',
          },
        },
        {
          $unwind: {
            path: '$Password',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'organizations',
            let: { orgId: '$orgId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$_id', '$$orgId'] }, { $eq: ['$isActive', true] }, { $eq: ['$isDelete', false] }],
                  },
                },
              },
              {
                $project: { _id: 1, orgName: 1 },
              },
            ],
            as: 'Organization',
          },
        },
        {
          $unwind: {
            path: '$Organization',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: 1,
            mobileNumber: 1,
            orgId: 1,
            email: 1,
            roles: 1,
            isVerified: 1,
            isActive: 1,
            isBlocked: 1,
            'Password._id': 1,
            'Password.password': 1,
            'Organization._id': 1,
            'Organization.orgName': 1,
          },
        },
        { $limit: 1 },
      ]
      const result = jsonParse(jsonStringify(await User.aggregate(pipeline)))

      return result[0] || null
    } catch (error: any) {
      getLogger().error('getUserPassword_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getUserWithPermissions(query: QueryFilter<IUser>, _options: MongoQueryOptions = {}): Promise<any> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'user_permissions',
            localField: '_id',
            foreignField: 'userId',
            as: 'permissions',
          },
        },
        {
          $unwind: {
            path: '$permissions',
            preserveNullAndEmptyArrays: false,
          },
        },
        { $limit: 1 },
      ]

      const result = jsonParse(jsonStringify(await User.aggregate(pipeline)))
      return result[0] || null
    } catch (error: any) {
      getLogger().error('getUserWithPermissions_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async getAllUsersWithOrganization(_options: MongoQueryOptions = {}): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { isDelete: false } },
        {
          $lookup: {
            from: 'organizations',
            localField: 'orgId',
            foreignField: '_id',
            as: 'Organization',
          },
        },
        {
          $unwind: {
            path: '$Organization',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            userName: 1,
            email: 1,
            mobileNumber: 1,
            roles: 1,
            isActive: 1,
            isBlocked: 1,
            orgId: 1,
            createdAt: 1,
            lastLoginAt: 1,
            'Organization._id': 1,
            'Organization.orgName': 1,
            'Organization.orgShortName': 1,
          },
        },
      ]

      return jsonParse(jsonStringify(await User.aggregate(pipeline)))
    } catch (error: any) {
      getLogger().error('getAllUsersWithOrganization_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async getDashboardStats(queryFilter: QueryFilter<IUser>): Promise<{
    totalUsers: number
    activeUsers: number
    inactiveUsers: number
    roleWiseCount: Record<string, number>
  }> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: { ...convertQueryIds(queryFilter), isDelete: false } },
        {
          $facet: {
            totalCount: [{ $count: 'count' }],
            activeCount: [{ $match: { isActive: true } }, { $count: 'count' }],
            inactiveCount: [{ $match: { isActive: false } }, { $count: 'count' }],
            roleStats: [{ $unwind: '$roles' }, { $group: { _id: '$roles', count: { $sum: 1 } } }],
          },
        },
      ]

      const result = jsonParse(jsonStringify(await User.aggregate(pipeline)))
      const data = result[0]

      const roleWiseCount: Record<string, number> = {}
      data.roleStats.forEach((r: any) => {
        roleWiseCount[r._id] = r.count
      })

      return {
        totalUsers: data.totalCount[0]?.count || 0,
        activeUsers: data.activeCount[0]?.count || 0,
        inactiveUsers: data.inactiveCount[0]?.count || 0,
        roleWiseCount,
      }
    } catch (error: any) {
      getLogger().error('getDashboardStats_Error', {
        error: error.message,
        stack: error.stack,
      })
      throw error
    }
  }

  async findById(id: string, options: MongoQueryOptions = {}): Promise<IUser | null> {
    try {
      let queryBuilder = User.findById(id)

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
