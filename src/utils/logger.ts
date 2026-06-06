/**
 * Cross-environment logger interface.
 *
 * - Express: Override with Winston logger via `setLogger()`
 * - Lambda: Uses console-based logging by default
 */

export interface ILogger {
  error(message: string, ...meta: any[]): void
  info(message: string, ...meta: any[]): void
  warn(message: string, ...meta: any[]): void
  debug(message: string, ...meta: any[]): void
}

const consoleLogger: ILogger = {
  error: (message: string, ...meta: any[]) => console.error(`[ERROR] ${message}`, ...meta),
  info: (message: string, ...meta: any[]) => console.info(`[INFO] ${message}`, ...meta),
  warn: (message: string, ...meta: any[]) => console.warn(`[WARN] ${message}`, ...meta),
  debug: (message: string, ...meta: any[]) => console.debug(`[DEBUG] ${message}`, ...meta),
}

let currentLogger: ILogger = consoleLogger

/**
 * Get the current logger instance.
 */
export function getLogger(): ILogger {
  return currentLogger
}

/**
 * Override the default console logger (e.g. with Winston in Express).
 */
export function setLogger(logger: ILogger): void {
  currentLogger = logger
}
