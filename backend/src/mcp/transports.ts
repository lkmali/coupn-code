import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp'

interface SessionData {
  transport: StreamableHTTPServerTransport
  authInfo?: any // put your validated user/client info here
  createdAt: number
}

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes
const transports: Record<string, SessionData> = {}

const addTransports = (key: string, transport: StreamableHTTPServerTransport, authInfo?: any) => {
  transports[key] = { transport, authInfo, createdAt: Date.now() }
}

const getTransports = (key: string): any => {
  return transports[key]?.transport
}

const getSessionData = (key: string): any => {
  return transports[key]?.authInfo
}

const getAllTransports = (): Record<string, SessionData> => {
  return transports
}

const deleteTransports = (key: string): void => {
  delete transports[key]
}

// Periodically clean up stale sessions to prevent memory leaks
const cleanupStaleSessions = () => {
  const now = Date.now()
  for (const key in transports) {
    if (now - transports[key].createdAt > SESSION_TTL_MS) {
      try {
        transports[key].transport.close?.()
      } catch (_) {}
      delete transports[key]
    }
  }
}

const cleanupInterval = setInterval(cleanupStaleSessions, 5 * 60 * 1000) // Every 5 minutes
// Allow process to exit even if interval is active
if (cleanupInterval.unref) cleanupInterval.unref()

export { getSessionData, addTransports, getTransports, deleteTransports, getAllTransports }
