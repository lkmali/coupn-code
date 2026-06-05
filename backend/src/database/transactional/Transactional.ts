import mongoose from 'mongoose'
import { getLogger } from '../../utils'
// logger accessed via getLogger()

const MAX_TRANSACTION_RETRIES = 5
const RETRY_BASE_DELAY_MS = 300

// MongoDB error codes that are safe to retry
const RETRYABLE_ERROR_CODES = new Set([
  112, // WriteConflict
  251, // TransactionAborted (NoSuchTransaction)
])

function isRetryableError(error: any): boolean {
  // Check error labels
  if (error?.errorLabelSet?.has?.('TransientTransactionError') || error?.hasErrorLabel?.('TransientTransactionError')) {
    return true
  }
  // Check error code (WriteConflict = 112)
  if (RETRYABLE_ERROR_CODES.has(error?.code)) {
    return true
  }
  // Check nested codeName
  if (error?.codeName === 'WriteConflict') {
    return true
  }
  return false
}

function getRetryDelay(attempt: number): number {
  const baseDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1)
  // Add random jitter (0-50% of base delay) to prevent thundering herd
  const jitter = Math.random() * baseDelay * 0.5
  return baseDelay + jitter
}

export function Transactional(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  descriptor.value = async function (...args: any[]) {
    let lastError: any

    for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt++) {
      const session = await mongoose.startSession()
      session.startTransaction()
      let committed = false
      try {
        const argsWithSession = [...args, { session }]
        getLogger().info(
          `Starting transaction for ${target.constructor.name}.${propertyKey}` +
            (attempt > 1 ? ` (retry ${attempt}/${MAX_TRANSACTION_RETRIES})` : ''),
        )
        const result = await originalMethod.apply(this, argsWithSession)
        await session.commitTransaction()
        committed = true
        return result
      } catch (error: any) {
        lastError = error

        if (isRetryableError(error) && attempt < MAX_TRANSACTION_RETRIES) {
          getLogger().warn(
            `Retryable transaction error in ${target.constructor.name}.${propertyKey}, retrying (${attempt}/${MAX_TRANSACTION_RETRIES})`,
            { error: error.message, code: error.code },
          )
          const delay = getRetryDelay(attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        getLogger().error(`Transaction failed ${target.constructor.name}: {${propertyKey}}`, error)
        throw error
      } finally {
        if (!committed) {
          try {
            await session.abortTransaction()
          } catch (abortErr) {
            getLogger().error(`Transaction abort failed ${target.constructor.name}: {${propertyKey}}`, abortErr)
          }
        }
        session.endSession()
      }
    }

    throw lastError
  }
}
