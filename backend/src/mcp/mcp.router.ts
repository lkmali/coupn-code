import { Request, Response, Express } from 'express'
import { randomUUID } from 'crypto'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { addTransports, deleteTransports, getTransports } from './transports'
import { JWTService } from '../service/jwt.service'
import { extractCredentials } from '../utils'
import { UserProfile } from '../typings'
import { envConfig } from '../config'
const jwtService = JWTService.Instance
const addMcpApi = (app: Express, server: any, basePath: string = '/mcp') => {
  // MCP POST Endpoint
  const MCP_REQUEST_TIMEOUT = 300000 // 5 minutes

  app.post(basePath, validateRequest(), async (req, res) => {
    const requestId = randomUUID()
    const startTime = Date.now()
    const toolName = req.body?.params?.name || req.body?.method || 'unknown'

    console.log(`[MCP-ROUTER] 📥 Incoming request: ${toolName} [requestId:${requestId}]`)

    // Set longer timeout for MCP requests to handle long-running operations
    req.setTimeout(MCP_REQUEST_TIMEOUT)
    res.setTimeout(MCP_REQUEST_TIMEOUT)

    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      console.log(`[MCP-ROUTER] 🔑 Session ID: ${sessionId || 'none'}`)
      let transport: StreamableHTTPServerTransport

      if (sessionId && getTransports(sessionId)) {
        console.log(`[MCP-ROUTER] ♻️  Using existing transport for session: ${sessionId}`)
        transport = getTransports(sessionId)
      } else if (!sessionId && isInitializeRequest(req.body)) {
        console.log(`[MCP-ROUTER] 🆕 Creating new transport - initialize request`)
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: id => {
            console.log(`[MCP-ROUTER] ✅ Session initialized: ${id}`)
            addTransports(id, transport, (req as any).user)
          },
        })
        transport.onclose = () => transport.sessionId && deleteTransports(transport.sessionId)
        await server.connect(transport)
      } else {
        console.log(`[MCP-ROUTER] ❌ No valid session ID`)
        return res
          .status(400)
          .json({ jsonrpc: '2.0', error: { code: -32000, message: 'No valid session ID' }, id: req?.body?.id })
      }

      console.log(`[MCP-ROUTER] 🚀 Calling transport.handleRequest for: ${toolName}`)
      await transport.handleRequest(req, res, req.body)
      const duration = Date.now() - startTime
      console.log(`[MCP-ROUTER] ✅ Request completed: ${toolName} in ${duration}ms`)
      return
    } catch (error: any) {
      const duration = Date.now() - startTime
      console.error(`[MCP-POST][${requestId}] Error after ${duration}ms:`, error)
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: req?.body?.id })
      }
      return
    }
  })

  // MCP GET Endpoint (SSE)
  app.get(basePath, validateRequest(), async (req: Request, res: Response) => {
    // Set longer timeout for SSE connections
    req.setTimeout(MCP_REQUEST_TIMEOUT)
    res.setTimeout(MCP_REQUEST_TIMEOUT)

    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !getTransports(sessionId)) {
      return res
        .status(400)
        .json({ jsonrpc: '2.0', error: { code: -32000, message: 'No valid session ID' }, id: req?.body?.id })
    }
    await getTransports(sessionId).handleRequest(req, res)
    return
  })

  // DELETE MCP session
  app.delete(basePath, validateRequest(), async (req: Request, res: Response) => {
    // Set timeout for delete operations
    req.setTimeout(MCP_REQUEST_TIMEOUT)
    res.setTimeout(MCP_REQUEST_TIMEOUT)

    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !getTransports(sessionId)) {
      return res
        .status(400)
        .json({ jsonrpc: '2.0', error: { code: -32000, message: 'No valid session ID' }, id: req?.body?.id })
    }
    try {
      await getTransports(sessionId).handleRequest(req, res)
      return
    } catch (error: any) {
      console.error(`[MCP-DELETE] Error terminating session ${sessionId}:`, error)
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ jsonrpc: '2.0', error: { code: -32603, message: 'Error terminating session' }, id: req?.body?.id })
      }
      return
    }
  })
}

const authenticate = async (request: Request): Promise<UserProfile> => {
  const token: string = extractCredentials(request)
  const userProfile: UserProfile = jwtService.verifyToken(token, envConfig.BOT_TOKEN_NETWORK) as UserProfile
  return Promise.resolve(userProfile)
}

const validateRequest = () => {
  return async (request: Request, response: Response, next: Function) => {
    const invalidCredentialsError = 'authentication unsuccessful.'
    try {
      const result = await authenticate(request)
      request['user'] = result
      return next()
    } catch (error: any) {
      console.error('[MCP-AUTH] Authentication error:', error)
      return response.status(401).json({ jsonrpc: '2.0', error: { message: invalidCredentialsError } })
    }
  }
}

export { addMcpApi }
