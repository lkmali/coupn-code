import { PipelineStage, QueryFilter } from 'mongoose'
import { SocialContact, ISocialContact } from '../models'
import { getLogger } from '../../../utils'
import { convertQueryIds, jsonParse, jsonStringify } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoSocialContactRepository {
  constructor() {}

  async saveSocialContact(
    data: Partial<ISocialContact>,
    options: MongoQueryOptions = {}
  ): Promise<ISocialContact> {
    try {
      const socialContact = new SocialContact(data)
      const saved = await socialContact.save({ session: options.session })
      return saved.toObject()
    } catch (error: any) {
      getLogger().error('saveSocialContact_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getSocialContact(
    query: QueryFilter<ISocialContact>,
    options: MongoQueryOptions = {}
  ): Promise<ISocialContact | null> {
    try {
      let queryBuilder = SocialContact.findOne(convertQueryIds(query))

      if (options.session) queryBuilder = queryBuilder.session(options.session) as typeof queryBuilder
      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getSocialContact_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getSocialContacts(
    query: QueryFilter<ISocialContact>,
    options: MongoQueryOptions = {}
  ): Promise<ISocialContact[]> {
    try {
      let queryBuilder = SocialContact.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getSocialContacts_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getSocialContactWithMessages(
    query: QueryFilter<ISocialContact>,
    _options: MongoQueryOptions = {}
  ): Promise<any> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'social_messages',
            localField: '_id',
            foreignField: 'contactId',
            as: 'messages',
          },
        },
        { $limit: 1 },
      ]

      const result = jsonParse(jsonStringify(await SocialContact.aggregate(pipeline)))
      return result[0] || null
    } catch (error: any) {
      getLogger().error('getSocialContactWithMessages_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateSocialContact(
    query: QueryFilter<ISocialContact>,
    update: Partial<ISocialContact>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await SocialContact.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateSocialContact_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeSocialContact(
    query: QueryFilter<ISocialContact>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await SocialContact.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeSocialContact_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<ISocialContact>): Promise<number> {
    try {
      return await SocialContact.countDocuments(convertQueryIds(query))
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
  ): Promise<ISocialContact | null> {
    try {
      let queryBuilder = SocialContact.findById(id)

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
