import { Response, NextFunction } from 'express'
import { LoggerProvider } from './logger.provider'

const NOISY_PATTERNS: RegExp[] = [
  /\/unread-count(?:\?|$)/,
  /\/unread-email-count(?:\?|$)/,
  /\/me\/summary(?:\?|$)/,
]

const isNoisyPath = (url: string | undefined): boolean => {
  if (!url) return false
  return NOISY_PATTERNS.some(p => p.test(url))
}

// Add request-scoped info
export const requestLoggerMiddleware = (req: any, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isWebhook = req.originalUrl?.includes('webhook') || req.originalUrl?.includes('agents')
    const statusCode = res.statusCode
    if (isDevelopment && isWebhook) {
      return
    }
    const url: string | undefined = req.originalUrl
    const quiet = isNoisyPath(url)

    // For 404 or unauthorized (401/403), only log the endpoint
    if (statusCode === 404 || statusCode === 401 || statusCode === 403) {
      LoggerProvider.Instance.logger.access('API Request', { url }, { quiet })
    } else {
      const responseTime = Date.now() - req['startTime']
      LoggerProvider.Instance.logger.access(
        'API Request',
        {
          method: req.method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
        },
        { quiet },
      )
    }
  })

  req['startTime'] = Date.now()
  next()
}
