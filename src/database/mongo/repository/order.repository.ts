import { QueryFilter } from 'mongoose'
import { Order, IMongoOrder } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoOrderRepository {
  async save(data: Partial<IMongoOrder>, options: MongoQueryOptions = {}): Promise<IMongoOrder> {
    try {
      const doc = new Order(data)
      return jsonParse(jsonStringify(await doc.save({ session: options.session })))
    } catch (error: any) {
      getLogger().error('saveOrder_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  async findOne(query: QueryFilter<IMongoOrder>): Promise<IMongoOrder | null> {
    try {
      return jsonParse(jsonStringify(await Order.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOneOrder_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoOrder>, options: MongoQueryOptions = {}): Promise<IMongoOrder[]> {
    try {
      let qb = Order.find(convertQueryIds(query))
      if (options.sort) qb = qb.sort(options.sort)
      if (options.skip) qb = qb.skip(options.skip)
      if (options.limit) qb = qb.limit(options.limit)
      return jsonParse(jsonStringify(await qb.lean().exec()))
    } catch (error: any) {
      getLogger().error('findOrder_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async count(query: QueryFilter<IMongoOrder>): Promise<number> {
    try {
      return await Order.countDocuments(convertQueryIds(query)).exec()
    } catch (error: any) {
      getLogger().error('countOrder_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  /**
   * Atomically update an order. Returns the updated document. Pass `query` with
   * a status guard (e.g. status: { $ne: PAID }) to make state transitions safe
   * against concurrent webhook deliveries.
   */
  async updateOne(
    query: QueryFilter<IMongoOrder>,
    update: Partial<IMongoOrder>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoOrder | null> {
    try {
      const result = await Order.findOneAndUpdate(convertQueryIds(query), update, {
        new: true,
        session: options.session,
      })
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('updateOrder_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }
}
