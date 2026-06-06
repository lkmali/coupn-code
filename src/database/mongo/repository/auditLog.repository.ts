import { AuditLog, IMongoAuditLog } from '../models'
import { getLogger, jsonParse, jsonStringify } from '../../../utils'

export class MongoAuditLogRepository {
  async save(data: Partial<IMongoAuditLog>): Promise<IMongoAuditLog> {
    try {
      const doc = new AuditLog(data)
      return jsonParse(jsonStringify(await doc.save()))
    } catch (error: any) {
      getLogger().error('saveAuditLog_Error', { error: error.message, stack: error.stack })
      throw error
    }
  }
}
