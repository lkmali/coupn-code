import { Request, Response, Express } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { JWTService } from '../../service'
import { extractCredentials } from '../../utils'
import { UserProfile } from '../../typings'
import { envConfig } from '../../config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { Messages } from '../../constants'
const jwtService = JWTService.Instance

const authenticate = async (request: Request): Promise<UserProfile> => {
  const token: string = extractCredentials(request)
  const userProfile: UserProfile = jwtService.verifyToken(token, envConfig.BOT_TOKEN_NETWORK) as UserProfile
  return Promise.resolve(userProfile)
}

const validateRequest = () => {
  return async (request: Request, response: Response, next: Function) => {
    try {
      const result = await authenticate(request)
      request['user'] = result
      return next()
    } catch (error: any) {
      console.error('[MCP-AUTH] Authentication error:', error)
      return response.status(401).json({ jsonrpc: '2.0', error: { message: Messages.ERROR.AUTH_UNSUCCESSFUL } })
    }
  }
}

const addMcpApi = (app: Express, server: McpServer, basePath: string = '/mcp') => {
  app.post(basePath, validateRequest(), async (req, res) => {
    try {
      // Create a new transport for each request to prevent request ID collisions
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      })

      res.on('close', () => {
        transport.close()
      })

      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: Messages.MCP.INTERNAL_SERVER_ERROR,
        },
        id: null,
      })
    }
  })
}

export { addMcpApi, validateRequest }
