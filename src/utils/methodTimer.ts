import { LoggerProvider } from '../provider/logger.provider'

const loggerProvider = LoggerProvider.Instance

/**
 * Performance timing data for method execution
 */
interface MethodTimingData {
  methodName: string
  whatsappId?: string
  messageId?: string
  startTime: number
  endTime: number
  duration: number
  status: 'success' | 'error'
  error?: string
}

/**
 * Overall statistics for a method
 */
interface MethodStats {
  methodName: string
  totalCalls: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  successCount: number
  errorCount: number
}

/**
 * Class to track method execution times with WhatsApp context
 */
export class MethodTimer {
  private static timings: Map<string, MethodTimingData> = new Map()
  private static overallStats: Map<string, MethodStats> = new Map()
  private static readonly MAX_STATS_ENTRIES = 500

  /**
   * Start timing a method execution
   * @param methodName - Name of the method being timed
   * @param whatsappId - WhatsApp ID of the user
   * @param messageId - Message ID from WhatsApp
   * @returns Unique timing ID
   */
  static start(methodName: string, whatsappId?: string, messageId?: string): string {
    const timingId = `${methodName}_${whatsappId || 'unknown'}_${messageId || Date.now()}`
    const startTime = Date.now()

    this.timings.set(timingId, {
      methodName,
      whatsappId,
      messageId,
      startTime,
      endTime: 0,
      duration: 0,
      status: 'success',
    })

    loggerProvider.logger.info(
      `[TIMER START] Method: ${methodName} | WhatsAppID: ${whatsappId || 'N/A'} | MessageID: ${messageId || 'N/A'}`,
    )

    return timingId
  }

  /**
   * End timing and log the results
   * @param timingId - The timing ID returned from start()
   * @param error - Optional error if method failed
   */
  static end(timingId: string, error?: Error): void {
    const timing = this.timings.get(timingId)
    if (!timing) {
      loggerProvider.logger.error(`[TIMER ERROR] Timing ID not found: ${timingId}`)
      return
    }

    timing.endTime = Date.now()
    timing.duration = timing.endTime - timing.startTime
    timing.status = error ? 'error' : 'success'
    if (error) {
      timing.error = error.message
    }

    // Update overall statistics
    this.updateOverallStats(timing)

    // Get current stats for this method
    const stats = this.overallStats.get(timing.methodName)

    // Log the timing result with overall stats
    loggerProvider.logger.info(
      `[TIMER END] Method: ${timing.methodName} | WhatsAppID: ${timing.whatsappId || 'N/A'} | MessageID: ${
        timing.messageId || 'N/A'
      } | Duration: ${timing.duration}ms | Status: ${timing.status}${
        timing.error ? ` | Error: ${timing.error}` : ''
      } | Overall: Calls=${stats?.totalCalls || 0}, Total=${stats?.totalTime || 0}ms, Avg=${Math.round(
        stats?.averageTime || 0,
      )}ms, Min=${stats?.minTime || 0}ms, Max=${stats?.maxTime || 0}ms`,
    )

    // Clean up to prevent memory leaks
    this.timings.delete(timingId)
  }

  /**
   * Update overall statistics for a method
   * @param timing - The timing data to add to statistics
   */
  private static updateOverallStats(timing: MethodTimingData): void {
    const existing = this.overallStats.get(timing.methodName)

    if (existing) {
      existing.totalCalls++
      existing.totalTime += timing.duration
      existing.averageTime = existing.totalTime / existing.totalCalls
      existing.minTime = Math.min(existing.minTime, timing.duration)
      existing.maxTime = Math.max(existing.maxTime, timing.duration)
      if (timing.status === 'success') {
        existing.successCount++
      } else {
        existing.errorCount++
      }
    } else {
      // Prevent unbounded growth - evict oldest entries when limit reached
      if (this.overallStats.size >= this.MAX_STATS_ENTRIES) {
        const firstKey = this.overallStats.keys().next().value
        if (firstKey) this.overallStats.delete(firstKey)
      }
      this.overallStats.set(timing.methodName, {
        methodName: timing.methodName,
        totalCalls: 1,
        totalTime: timing.duration,
        averageTime: timing.duration,
        minTime: timing.duration,
        maxTime: timing.duration,
        successCount: timing.status === 'success' ? 1 : 0,
        errorCount: timing.status === 'error' ? 1 : 0,
      })
    }
  }

  /**
   * Decorator to automatically time async methods
   * Usage: @MethodTimer.timeMethod()
   */
  static timeMethod(whatsappIdKey?: string, messageIdKey?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const methodName = `${target.constructor.name}.${propertyKey}`

        // Try to extract WhatsApp ID and Message ID from arguments
        let whatsappId: string | undefined
        let messageId: string | undefined

        // If keys are provided, try to extract from first argument (assuming it's an object)
        if (args.length > 0 && typeof args[0] === 'object') {
          if (whatsappIdKey) {
            whatsappId = args[0][whatsappIdKey]
          }
          if (messageIdKey) {
            messageId = args[0][messageIdKey]
          }
        }

        const timingId = MethodTimer.start(methodName, whatsappId, messageId)

        try {
          const result = await originalMethod.apply(this, args)
          MethodTimer.end(timingId)
          return result
        } catch (error: any) {
          MethodTimer.end(timingId, error as Error)
          throw error
        }
      }

      return descriptor
    }
  }

  /**
   * Manual timing wrapper for non-decorator usage
   * @param methodName - Name of the method
   * @param whatsappId - WhatsApp ID
   * @param messageId - Message ID
   * @param fn - Function to execute and time
   */
  static async timeAsync<T>(
    methodName: string,
    whatsappId: string | undefined,
    messageId: string | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    const timingId = this.start(methodName, whatsappId, messageId)
    try {
      const result = await fn()
      this.end(timingId)
      return result
    } catch (error: any) {
      this.end(timingId, error as Error)
      throw error
    }
  }

  /**
   * Synchronous timing wrapper
   * @param methodName - Name of the method
   * @param whatsappId - WhatsApp ID
   * @param messageId - Message ID
   * @param fn - Function to execute and time
   */
  static timeSync<T>(
    methodName: string,
    whatsappId: string | undefined,
    messageId: string | undefined,
    fn: () => T,
  ): T {
    const timingId = this.start(methodName, whatsappId, messageId)
    try {
      const result = fn()
      this.end(timingId)
      return result
    } catch (error: any) {
      this.end(timingId, error as Error)
      throw error
    }
  }

  /**
   * Get overall statistics for a specific method
   * @param methodName - Name of the method
   * @returns Method statistics or undefined if not found
   */
  static getMethodStats(methodName: string): MethodStats | undefined {
    return this.overallStats.get(methodName)
  }

  /**
   * Get all overall statistics
   * @returns Map of all method statistics
   */
  static getAllStats(): Map<string, MethodStats> {
    return new Map(this.overallStats)
  }

  /**
   * Print overall timing summary for all methods
   */
  static printOverallSummary(): void {
    if (this.overallStats.size === 0) {
      loggerProvider.logger.info('[TIMER SUMMARY] No timing data available', 'printOverallSummary')
      return
    }

    // Sort by total time (descending)
    const sortedStats = Array.from(this.overallStats.values()).sort((a, b) => b.totalTime - a.totalTime)

    const summaryData = sortedStats.map(stats => ({
      methodName: stats.methodName,
      totalCalls: stats.totalCalls,
      totalTime: `${stats.totalTime}ms`,
      averageTime: `${Math.round(stats.averageTime)}ms`,
      minTime: `${stats.minTime}ms`,
      maxTime: `${stats.maxTime}ms`,
      successCount: stats.successCount,
      errorCount: stats.errorCount,
    }))

    loggerProvider.logger.table('OVERALL METHOD TIMING SUMMARY', summaryData)
  }

  /**
   * Reset all timing statistics
   */
  static resetStats(): void {
    this.overallStats.clear()
    loggerProvider.logger.info('[TIMER] All statistics have been reset')
  }
}
