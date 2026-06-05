import { PipelineStage, QueryFilter } from 'mongoose'
import { OrganizationConfiguration, IOrganizationConfiguration } from '../models'
import { getLogger } from '../../../utils'
import { convertQueryIds, jsonParse, jsonStringify } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoOrganizationConfigurationRepository {
  constructor() {}

  async saveOrganizationConfiguration(
    data: Partial<IOrganizationConfiguration>,
    options: MongoQueryOptions = {}
  ): Promise<IOrganizationConfiguration> {
    try {
      const config = new OrganizationConfiguration(data)
      return await config.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getOrganizationConfiguration(
    query: QueryFilter<IOrganizationConfiguration>,
    options: MongoQueryOptions = {}
  ): Promise<IOrganizationConfiguration | null> {
    try {
      let queryBuilder = OrganizationConfiguration.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getOrganizationConfigurations(
    query: QueryFilter<IOrganizationConfiguration>,
    options: MongoQueryOptions = {}
  ): Promise<IOrganizationConfiguration[]> {
    try {
      let queryBuilder = OrganizationConfiguration.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getOrganizationConfigurations_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getOrganizationConfigurationWithOrg(
    query: QueryFilter<IOrganizationConfiguration>,
    options: MongoQueryOptions = {}
  ): Promise<any | null> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'organizations',
            localField: 'orgId',
            foreignField: '_id',
            as: 'organization',
          },
        },
        { $unwind: { path: '$organization', preserveNullAndEmptyArrays: true } },
        { $limit: 1 },
      ]

      if (options.select) {
        pipeline.push({ $project: options.select })
      }

      const result = jsonParse(jsonStringify(await OrganizationConfiguration.aggregate(pipeline)))
      return result[0] || null
    } catch (error: any) {
      getLogger().error('getOrganizationConfigurationWithOrg_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateOrganizationConfiguration(
    query: QueryFilter<IOrganizationConfiguration>,
    update: Partial<IOrganizationConfiguration>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await OrganizationConfiguration.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeOrganizationConfiguration(
    query: QueryFilter<IOrganizationConfiguration>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await OrganizationConfiguration.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeOrganizationConfiguration_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<IOrganizationConfiguration>): Promise<number> {
    try {
      return await OrganizationConfiguration.countDocuments(convertQueryIds(query))
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
  ): Promise<IOrganizationConfiguration | null> {
    try {
      let queryBuilder = OrganizationConfiguration.findById(id)

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
