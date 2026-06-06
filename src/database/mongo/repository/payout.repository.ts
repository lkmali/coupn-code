import { QueryFilter } from 'mongoose'
import { Payout, IMongoPayout } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoPayoutRepository {
  async findOne(query: QueryFilter<IMongoPayout>): Promise<IMongoPayout | null> {
    try {
      return jsonParse(jsonStringify(await Payout.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOnePayout_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoPayout>): Promise<IMongoPayout[]> {
    try {
      return jsonParse(jsonStringify(await Payout.find(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findPayout_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  /**
   * Idempotent upsert keyed on stripePayoutId. Safe to call repeatedly from
   * webhook retries — the unique index guarantees a single record.
   */
  async upsertByPayoutId(
    stripePayoutId: string,
    data: Partial<IMongoPayout>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoPayout | null> {
    try {
      // stripePayoutId is the immutable upsert key; keep it out of $set so
      // $setOnInsert owns the path (avoids the "conflict at ..." Mongo error).
      const { stripePayoutId: _ignored, ...setData } = data
      const result = await Payout.findOneAndUpdate(
        { stripePayoutId },
        { $set: setData, $setOnInsert: { stripePayoutId } },
        { new: true, upsert: true, session: options.session },
      )
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('upsertPayout_Error', { error: error.message, stack: error.stack, stripePayoutId })
      throw error
    }
  }
}
