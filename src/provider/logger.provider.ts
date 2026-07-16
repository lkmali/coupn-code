import fs from 'fs'
import path from 'path'
import winston, { Logger, createLogger, format } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { isNil } from 'lodash'
import { constantConfig } from '../config'
import { getRequestContext } from './request.context.provider'

const LEVEL_COLORS: Record<string, string> = {
  error: '\x1b[31m', // red
  warn: '\x1b[33m', // yellow
  info: '\x1b[36m', // cyan
  debug: '\x1b[90m', // grey
}
const RESET = '\x1b[0m'

export class LoggerProvider {
  private static instance: LoggerProvider
  private log: Logger

  public logger!: {
    error: Function
    debug: Function
    info: Function
    warn: Function
    success: Function
    debugTable: Function
    errorWithJson: Function
    infoWithJson: Function
    warnWithJson: Function
    successWithJson: Function
    table: Function
    access: Function
  }

  private constructor() {
    const fileFormat = format.printf((info: any) => this.jsonStringify(this.toLogObject(info)))

    const skipQuiet = format((info: any) => (info._quiet ? false : info))

    const consoleFormat = format.combine(
      skipQuiet(),
      format.printf((info: any) => {
        const obj = this.toLogObject(info)
        const color = LEVEL_COLORS[obj.level] ?? ''
        const head = `${color}${obj.level.toUpperCase()}${RESET} ${obj.timestamp} ${obj.message}`
        const body = this.jsonStringify(obj, true)
        return `${head}\n${body}`
      }),
    )

    this.log = createLogger({
      transports: [
        new winston.transports.Console({
          ...constantConfig.consoleTransportOptions,
          handleExceptions: true,
          format: consoleFormat,
        }),
        ...this.buildFileTransports(fileFormat),
      ],
      exitOnError: false,
    })

    this.setLoggerMethods()
  }

  /**
   * Rotating-file transports, for hosts with a writable disk that outlives the
   * process. Serverless platforms have neither: the filesystem is read-only
   * apart from /tmp, so creating the log directory throws EROFS at import time —
   * before any request — and /tmp itself is discarded when the instance is
   * recycled, making the files unreadable anyway. There, console output is the
   * transport: the platform captures stdout/stderr into its own log drain.
   */
  private buildFileTransports(fileFormat: winston.Logform.Format): winston.transport[] {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
    if (isServerless) return []

    const logDir = path.join(__dirname, '../../../logs')
    try {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    } catch (error) {
      console.warn(`[WARN] File logging disabled — cannot write to ${logDir}:`, error)
      return []
    }

    return [
      new DailyRotateFile({
        filename: 'debug-%DATE%.log',
        dirname: logDir,
        level: 'debug',
        datePattern: constantConfig.logOption.datePattern,
        maxFiles: '200d',
        maxSize: '10m',
        options: { flags: 'a', mode: 0o777 },
        format: fileFormat,
      }),
      new DailyRotateFile({
        filename: 'errors-%DATE%.log',
        dirname: logDir,
        level: 'error',
        datePattern: constantConfig.logOption.datePattern,
        maxFiles: '200d',
        maxSize: '10m',
        options: { flags: 'a', mode: 0o755 },
        format: fileFormat,
      }),
    ]
  }

  private jsonStringify(object: any, pretty = false): string {
    try {
      return JSON.stringify(object, null, pretty ? 2 : 0)
    } catch {
      return String(object)
    }
  }

  /**
   * Deeply serialize objects — handles nested, circular, and Error instances
   */
  private safeSerialize(obj: any): any {
    const seen = new WeakSet()

    const serialize = (value: any): any => {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          stack: value.stack,
          ...(value.cause ? { cause: serialize(value.cause) } : {}),
          ...Object.getOwnPropertyNames(value).reduce((acc, key) => {
            if (!['name', 'message', 'stack', 'cause'].includes(key)) {
              acc[key] = serialize((value as any)[key])
            }
            return acc
          }, {} as any),
        }
      }

      if (value === null || value === undefined) return value
      if (typeof value !== 'object') return value
      if (seen.has(value)) return '[Circular]'
      seen.add(value)

      if (Array.isArray(value)) return value.map(v => serialize(v))

      const result: any = {}
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = serialize(value[key])
        }
      }
      return result
    }

    return serialize(obj)
  }

  private context(): { [k: string]: any } {
    return getRequestContext() as { [k: string]: any }
  }

  private metaToData(meta: any[]): any {
    if (!meta || meta.length === 0) return undefined
    const serialized = meta.map(m => this.safeSerialize(m))
    return serialized.length === 1 ? serialized[0] : serialized
  }

  private toLogObject(info: any): any {
    const out: any = {
      timestamp: new Date().toISOString(),
      level: info.level,
      message: info.message,
    }
    if (info.method) out.method = info.method
    const ctx = info.context && Object.keys(info.context).length ? info.context : null
    if (ctx) out.context = ctx
    if (info.data !== undefined) out.data = info.data
    if (info.error !== undefined) out.error = info.error
    return out
  }

  private setLoggerMethods() {
    this.logger = {
      error: (message: string, error?: any) =>
        this.log.error({
          message,
          context: this.context(),
          error: this.safeSerialize(error),
        }),

      debug: (message: string, ...meta: any[]) =>
        this.log.debug({ message, context: this.context(), data: this.metaToData(meta) }),

      info: (message: string, ...meta: any[]) =>
        this.log.info({ message, context: this.context(), data: this.metaToData(meta) }),

      warn: (message: string, ...meta: any[]) =>
        this.log.warn({ message, context: this.context(), data: this.metaToData(meta) }),

      success: (message: string, ...meta: any[]) =>
        this.log.info({
          message: `✅ SUCCESS: ${message}`,
          context: this.context(),
          data: this.metaToData(meta),
        }),

      debugTable: (message: string, data: any) =>
        this.log.debug({ message, context: this.context(), data: this.safeSerialize(data) }),

      table: (message: string, data: any) =>
        this.log.info({ message, context: this.context(), data: this.safeSerialize(data) }),

      errorWithJson: (message: string, method: string, data: any) =>
        this.log.error({ message, method, context: this.context(), data: this.safeSerialize(data) }),

      infoWithJson: (message: string, method: string, data: any) =>
        this.log.info({ message, method, context: this.context(), data: this.safeSerialize(data) }),

      warnWithJson: (message: string, method: string, data: any) =>
        this.log.warn({ message, method, context: this.context(), data: this.safeSerialize(data) }),

      successWithJson: (message: string, method: string, data: any) =>
        this.log.info({
          message: `✅ ${message}`,
          method,
          context: this.context(),
          data: this.safeSerialize(data),
        }),

      access: (message: string, data: any, options?: { quiet?: boolean }) =>
        this.log.info({
          message,
          context: this.context(),
          data: this.safeSerialize(data),
          _quiet: options?.quiet === true,
        }),
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new LoggerProvider()
    return this.instance
  }
}
