import { QueryFilter } from 'mongoose'
import { Invoice, IMongoInvoice } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoInvoiceRepository {
  async findOne(query: QueryFilter<IMongoInvoice>): Promise<IMongoInvoice | null> {
    try {
      return jsonParse(jsonStringify(await Invoice.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOneInvoice_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoInvoice>): Promise<IMongoInvoice[]> {
    try {
      return jsonParse(jsonStringify(await Invoice.find(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findInvoice_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  /**
   * Idempotent upsert keyed on stripeInvoiceId. Safe to call repeatedly from
   * webhook retries — the unique index guarantees a single record.
   */
  async upsertByInvoiceId(
    stripeInvoiceId: string,
    data: Partial<IMongoInvoice>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoInvoice | null> {
    try {
      // stripeInvoiceId is the immutable upsert key; keep it out of $set so
      // $setOnInsert owns the path (avoids the "conflict at ..." Mongo error).
      const { stripeInvoiceId: _ignored, ...setData } = data
      const result = await Invoice.findOneAndUpdate(
        { stripeInvoiceId },
        { $set: setData, $setOnInsert: { stripeInvoiceId } },
        { new: true, upsert: true, session: options.session },
      )
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('upsertInvoice_Error', { error: error.message, stack: error.stack, stripeInvoiceId })
      throw error
    }
  }
}
