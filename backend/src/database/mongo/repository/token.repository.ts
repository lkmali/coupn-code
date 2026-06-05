import { QueryFilter } from 'mongoose'
import { Token, IToken } from '../models'
import { getLogger } from '../../../utils'
import { jsonParse, jsonStringify, convertQueryIds } from '../../../utils'

import { MongoQueryOptions } from '../../../typings'
// logger accessed via getLogger()


export class MongoTokenRepository {
  constructor() {}

  async saveToken(
    data: Partial<IToken>,
    options: MongoQueryOptions = {}
  ): Promise<IToken> {
    try {
      const token = new Token(data)
      return await token.save({ session: options.session })
    } catch (error: any) {
      getLogger().error('saveToken_Error', {
        error: error.message,
        stack: error.stack,
        query: data,
      })
      throw error
    }
  }

  async getToken(
    query: QueryFilter<IToken>,
    options: MongoQueryOptions = {}
  ): Promise<IToken | null> {
    try {
      let queryBuilder = Token.findOne(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getToken_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async getTokens(
    query: QueryFilter<IToken>,
    options: MongoQueryOptions = {}
  ): Promise<IToken[]> {
    try {
      let queryBuilder = Token.find(convertQueryIds(query))

      if (options.select) queryBuilder = queryBuilder.select(options.select) as typeof queryBuilder
      if (options.sort) queryBuilder = queryBuilder.sort(options.sort)
      if (options.skip) queryBuilder = queryBuilder.skip(options.skip)
      if (options.limit) queryBuilder = queryBuilder.limit(options.limit)

      return jsonParse(jsonStringify(await queryBuilder.lean().exec()))
    } catch (error: any) {
      getLogger().error('getTokens_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async updateToken(
    query: QueryFilter<IToken>,
    update: Partial<IToken>,
    options: MongoQueryOptions = {}
  ): Promise<{ modifiedCount: number }> {
    try {
      const result = await Token.updateMany(convertQueryIds(query), update, { session: options.session })
      return { modifiedCount: result.modifiedCount }
    } catch (error: any) {
      getLogger().error('updateToken_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async removeToken(
    query: QueryFilter<IToken>,
    options: MongoQueryOptions = {}
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await Token.deleteMany(convertQueryIds(query), { session: options.session })
      return { deletedCount: result.deletedCount }
    } catch (error: any) {
      getLogger().error('removeToken_Error', {
        error: error.message,
        stack: error.stack,
        query,
      })
      throw error
    }
  }

  async countDocuments(query: QueryFilter<IToken>): Promise<number> {
    try {
      return await Token.countDocuments(convertQueryIds(query))
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
  ): Promise<IToken | null> {
    try {
      let queryBuilder = Token.findById(id)

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

  async verifyOTP(
    verificationKey: string,
    verifyCode: string
  ): Promise<IToken | null> {
    try {
      return jsonParse(jsonStringify(await Token.findOne(convertQueryIds({
        verificationKey,
        verifyCode,
        otpExpires: { $gt: new Date() },
      })).lean().exec()))
    } catch (error: any) {
      getLogger().error('verifyOTP_Error', {
        error: error.message,
        stack: error.stack,
        verificationKey,
      })
      throw error
    }
  }
}
