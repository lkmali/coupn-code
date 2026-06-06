import { QueryFilter } from 'mongoose'
import { Product, IMongoProduct } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoProductRepository {
  async save(data: Partial<IMongoProduct>, options: MongoQueryOptions = {}): Promise<IMongoProduct> {
    try {
      const doc = new Product(data)
      return jsonParse(jsonStringify(await doc.save({ session: options.session })))
    } catch (error: any) {
      getLogger().error('saveProduct_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }

  async findOne(query: QueryFilter<IMongoProduct>): Promise<IMongoProduct | null> {
    try {
      return jsonParse(jsonStringify(await Product.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOneProduct_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoProduct>, options: MongoQueryOptions = {}): Promise<IMongoProduct[]> {
    try {
      let qb = Product.find(convertQueryIds(query))
      if (options.sort) qb = qb.sort(options.sort)
      if (options.limit) qb = qb.limit(options.limit)
      return jsonParse(jsonStringify(await qb.lean().exec()))
    } catch (error: any) {
      getLogger().error('findProduct_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async updateOne(
    query: QueryFilter<IMongoProduct>,
    update: Partial<IMongoProduct>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoProduct | null> {
    try {
      const result = await Product.findOneAndUpdate(convertQueryIds(query), update, {
        new: true,
        session: options.session,
      })
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('updateProduct_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }
}
