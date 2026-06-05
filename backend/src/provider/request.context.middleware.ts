import { Request, Response, NextFunction } from 'express'
import { setRequestContext } from './request.context.provider'
import { getClientIp, URC_HEADER, parseIncomingUrc, generateUrc } from '../utils'

/**
 * Establish the per-request AsyncLocalStorage context that the logger reads.
 *
 * Request-ID strategy:
 *   - Caller supplies `X-URC` (Unit Request Correlation) — we adopt it verbatim
 *     if well-formed, so browser logs, server logs, and agent logs can all be
 *     grepped by the same string.
 *   - If the header is missing or malformed, we mint `SRV-<ts>-<rand>` so every
 *     request still has a traceable ID.
 *   - The URC is echoed back on the response (`X-URC`) so the caller can
 *     confirm what the server logged under — useful when debugging via DevTools.
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incoming = parseIncomingUrc(req.headers[URC_HEADER])
  // Fallback prefix is informed by the transport: MCP endpoints are always agents,
  // everything else defaults to SRV (an API caller that didn't bother to send a URC).
  const path = req.originalUrl || req.url || ''
  const fallbackSource = path.startsWith('/mcp') ? 'AGENT' : 'SRV'
  const requestId = incoming ?? generateUrc(fallbackSource)

  // Surface on res so downstream middleware/controllers can read it via req,
  // and expose to the client so the browser can correlate what it sent.
  ;(req as any).urc = requestId
  res.setHeader(URC_HEADER, requestId)

  const userId = req['user']?.userId || ''
  const sessionId = req['user']?.sessionId || ''
  const ipAddress = getClientIp(req)
  const endpoint = req.originalUrl || req.url
  const method = req.method
  setRequestContext({ requestId, userId, sessionId, ipAddress, endpoint, method }, () => next())
}
