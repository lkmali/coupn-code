import { QueryFilter } from 'mongoose'
import { Payment, IMongoPayment } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoPaymentRepository {
  async findOne(query: QueryFilter<IMongoPayment>): Promise<IMongoPayment | null> {
    try {
      return jsonParse(jsonStringify(await Payment.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOnePayment_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoPayment>): Promise<IMongoPayment[]> {
    try {
      return jsonParse(jsonStringify(await Payment.find(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findPayment_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  /**
   * Idempotent upsert keyed on paymentIntentId. Safe to call repeatedly from
   * webhook retries — the unique index guarantees a single payment record.
   */
  async upsertByPaymentIntent(
    paymentIntentId: string,
    data: Partial<IMongoPayment>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoPayment | null> {
    try {
      // paymentIntentId is the immutable upsert key; it must be written by a
      // single update operator. Strip it from $set so $setOnInsert owns the
      // path — otherwise Mongo throws "would create a conflict at 'paymentIntentId'".
      const { paymentIntentId: _ignored, ...setData } = data
      const result = await Payment.findOneAndUpdate(
        { paymentIntentId },
        { $set: setData, $setOnInsert: { paymentIntentId } },
        { new: true, upsert: true, session: options.session },
      )
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('upsertPayment_Error', { error: error.message, stack: error.stack, paymentIntentId })
      throw error
    }
  }
}
