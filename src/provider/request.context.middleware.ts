import { Request, Response, NextFunction } from 'express'
import { setRequestContext } from './request.context.provider'
import { getClientIp } from '../utils'

/**
 * Establish the per-request AsyncLocalStorage context that the logger reads.
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = `SRV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  ;(req as any).requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  setRequestContext(
    {
      requestId,
      ipAddress: getClientIp(req),
      endpoint: req.originalUrl || req.url,
      method: req.method,
    },
    () => next(),
  )
}
