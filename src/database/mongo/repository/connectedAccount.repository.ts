import { QueryFilter } from 'mongoose'
import { ConnectedAccount, IMongoConnectedAccount } from '../models'
import { getLogger, convertQueryIds, jsonParse, jsonStringify } from '../../../utils'
import { MongoQueryOptions } from '../../../typings'

export class MongoConnectedAccountRepository {
  async findOne(query: QueryFilter<IMongoConnectedAccount>): Promise<IMongoConnectedAccount | null> {
    try {
      return jsonParse(jsonStringify(await ConnectedAccount.findOne(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findOneConnectedAccount_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  async find(query: QueryFilter<IMongoConnectedAccount>): Promise<IMongoConnectedAccount[]> {
    try {
      return jsonParse(jsonStringify(await ConnectedAccount.find(convertQueryIds(query)).lean().exec()))
    } catch (error: any) {
      getLogger().error('findConnectedAccount_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }

  /**
   * Atomically update a connected account, scoped by org + stripeAccountId.
   * Returns the updated document (null if no matching account exists — the
   * `account.updated` webhook can arrive before onboarding created a local row).
   */
  async updateOne(
    query: QueryFilter<IMongoConnectedAccount>,
    update: Partial<IMongoConnectedAccount>,
    options: MongoQueryOptions = {},
  ): Promise<IMongoConnectedAccount | null> {
    try {
      const result = await ConnectedAccount.findOneAndUpdate(convertQueryIds(query), update, {
        new: true,
        session: options.session,
      })
        .lean()
        .exec()
      return jsonParse(jsonStringify(result))
    } catch (error: any) {
      getLogger().error('updateConnectedAccount_Error', { error: error.message, stack: error.stack, query })
      throw error
    }
  }
}
