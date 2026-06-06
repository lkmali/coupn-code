import { isNil } from 'lodash'
import { MongoAuditLogRepository, toObjectId } from '../database'
import { LoggerProvider } from '../provider/logger.provider'
import { AuditAction } from '../typings'

const loggerProvider = LoggerProvider.Instance

export interface AuditLogInput {
  orgId?: string
  userId?: string
  action: AuditAction | string
  resourceType: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  payload?: Record<string, unknown>
}

// Fields that must never be persisted to the audit trail even if a caller
// accidentally includes them in `payload`.
const FORBIDDEN_KEYS = new Set([
  'cardNumber',
  'card',
  'cvv',
  'cvc',
  'number',
  'secretKey',
  'webhookSecret',
  'client_secret',
  'clientSecret',
])

function redact(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!payload) return undefined
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_KEYS.has(key)) continue
    clean[key] = value
  }
  return clean
}

/**
 * Append-only audit logging for payment-sensitive actions. Intentionally
 * swallows its own errors: an audit write failure must never break the primary
 * payment flow (it is logged instead).
 */
export class AuditLogService {
  private static instance: AuditLogService
  private readonly repo = new MongoAuditLogRepository()

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.repo.save({
        orgId: input.orgId ? toObjectId(input.orgId) : undefined,
        userId: input.userId ? toObjectId(input.userId) : undefined,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        payload: redact(input.payload),
      })
    } catch (error: any) {
      loggerProvider.logger.error('auditLog_Write_Error', {
        error: error.message,
        action: input.action,
        resourceType: input.resourceType,
      })
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
