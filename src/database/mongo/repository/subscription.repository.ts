import { QueryFilter } from 'mongoose'
import { Subscription, IMongoSubscription } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoSubscriptionRepository {
  async findOne(query: QueryFilter<IMongoSubscription>): Promise<IMongoSubscription | null> {
    try {
      return jsonParse(jsonStringify(await Subscription.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOneSubscription_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoSubscription>): Promise<IMongoSubscription[]> {
    try {
      return jsonParse(jsonStringify(await Subscription.find(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findSubscription_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  /**
   * Idempotent upsert keyed on stripeSubscriptionId. Safe to call repeatedly
   * from webhook retries — the unique index guarantees a single record.
   */
  async upsertBySubscriptionId(
    stripeSubscriptionId: string,
    data: Partial<IMongoSubscription>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoSubscription | null> {
    try {
      // stripeSubscriptionId is the immutable upsert key; keep it out of $set so
      // $setOnInsert owns the path (avoids the "conflict at ..." Mongo error).
      const { stripeSubscriptionId: _ignored, ...setData } = data
      const result = await Subscription.findOneAndUpdate(
        { stripeSubscriptionId },
        { $set: setData, $setOnInsert: { stripeSubscriptionId } },
        { new: true, upsert: true, session: options.session },
      )
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('upsertSubscription_Error', { error: error.message, stack: error.stack, stripeSubscriptionId })
      throw error
    }
  }
}
