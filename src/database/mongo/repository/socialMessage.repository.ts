import { PipelineStage, QueryFilter, Types } from 'mongoose'
import { SocialMessage, ISocialMessage } from '../models'
import { getLogger } from '../../../utils'
import { convertQueryIds, jsonParse, jsonStringify } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoSocialMessageRepository {
  constructor() {}

  async saveSocialMessage(
    data: Partial<ISocialMessage>,
    options: MongoQueryOptions = {}
  ): Promise<ISocialMessage> {
    try {
      const socialMessage = new SocialMessage(data)
      return await socialMessage.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveSocialMessage_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getSocialMessage(
    query: QueryFilter<ISocialMessage>,
    options: MongoQueryOptions = {}
  ): Promise<ISocialMessage | null> {
    try {
      let queryBuilder = SocialMessage.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getSocialMessage_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getSocialMessages(
    query: QueryFilter<ISocialMessage>,
    options: MongoQueryOptions = {}
  ): Promise<ISocialMessage[]> {
    try {
      let queryBuilder = SocialMessage.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getSocialMessages_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getMessagesByContact(
    contactId: string,
    options: MongoQueryOptions = {}
  ): Promise<ISocialMessage[]> {
    try {
      let queryBuilder = SocialMessage.find({ contactId: new Types.ObjectId(contactId) })
        .sort({ timestamp: -1 })

      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getMessagesByContact_Error', {
        error: error.message,
        stack: error.stack,
        contactId,
      })
      throw error
    }
  }

  async getMessagesWithContact(
    query: QueryFilter<ISocialMessage>,
    options: MongoQueryOptions = {}
  ): Promise<any[]> {
    try {
      const pipeline: PipelineStage[] = [
        { $match: convertQueryIds(query) },
        {
          $lookup: {
            from: 'social_contacts',
            localField: 'contactId',
            foreignField: '_id',
            as: 'contact',
          },
        },
        {
          $unwind: {
            path: '$contact',
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

      return jsonParse(jsonStringify(await SocialMessage.aggregate(pipeline)))
    } catch (error: any) {
      getLogger().error('getMessagesWithContact_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateSocialMessage(
    query: QueryFilter<ISocialMessage>,
    update: Partial<ISocialMessage>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await SocialMessage.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateSocialMessage_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeSocialMessage(
    query: QueryFilter<ISocialMessage>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await SocialMessage.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeSocialMessage_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<ISocialMessage>): Promise<number> {
    try {
      return await SocialMessage.countDocuments(convertQueryIds(query))
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
  ): Promise<ISocialMessage | null> {
    try {
      let queryBuilder = SocialMessage.findById(id)

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
