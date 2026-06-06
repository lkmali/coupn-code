import { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'
import { RedisService } from '../service/redis.service'
import { LoggerProvider } from '../provider/logger.provider'

const loggerProvider = LoggerProvider.Instance

export interface RateLimitOptions {
  /** Fixed window length in seconds. */
  windowSec: number
  /** Max requests allowed per identity within the window. */
  max: number
  /** Label used in the Redis key and error messages. */
  scope: string
}

/**
 * Lightweight fixed-window rate limiter backed by the existing RedisService.
 *
 * - Identity = client IP + a short fingerprint of the Authorization header, so
 *   distinct authenticated sessions behind one NAT get separate buckets.
 * - Fails OPEN: if Redis is unavailable the request is allowed (availability is
 *   prioritised over strict limiting for this non-critical control).
 */
export function rateLimit(options: RateLimitOptions) {
  const redis = RedisService.Instance

  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip || req.socket?.remoteAddress || 'unknown'
      const auth = (req.headers.authorization || '') as string
      const idFragment = auth ? createHash('sha256').update(auth).digest('hex').slice(0, 8) : 'anon'
      const key = `ratelimit:${options.scope}:${ip}:${idFragment}`

      const count = await redis.incr(key)
      // Redis disabled / unreachable -> incr returns 0 -> fail open.
      if (!count || count <= 0) return next()

      if (count === 1) {
        await redis.expire(key, options.windowSec)
      }

      res.setHeader('RateLimit-Limit', String(options.max))
      res.setHeader('RateLimit-Remaining', String(Math.max(0, options.max - count)))

      if (count > options.max) {
        const ttl = await redis.ttl(key)
        if (ttl > 0) res.setHeader('Retry-After', String(ttl))
        loggerProvider.logger.warn('rate_limit_exceeded', { scope: options.scope, ip, count })
        res.status(429).json({
          success: false,
          errorCode: 'RATE_LIMITED',
          message: 'Too many requests. Please slow down and try again shortly.',
        })
        return
      }

      next()
    } catch (error: any) {
      // Never block traffic on limiter failure.
      loggerProvider.logger.warn('rate_limit_error', { scope: options.scope, error: error.message })
      next()
    }
  }
}
