// src/servers/patient.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { MedicalTools } from './tools/medicalTools'
import { handleToolCall } from './tools/handlers'
import { transformToMCPContent, unauthorized } from '../utils'
import { deleteTransports, getAllTransports, getSessionData, getTransports } from './transports'
import { isEmpty, omit } from 'lodash'
import { getRequestContext, requestContext } from '../provider/request.context.provider'
import { LoggerProvider } from '../provider/logger.provider'

const ModuleMcpServer = (serverType: 'patient' | 'appointment' | 'task' | 'lead' | 'sop' | 'single') => {
  // NOTE: 'task' was already declared on the union for forward-compat;
  //  the active task tools are registered via src/mcp/sdk/server.ts.
  const logger = LoggerProvider.Instance.logger
  const filteredTools =
    serverType === 'single' ? MedicalTools : MedicalTools.filter((tool: any) => tool.title === serverType)
  const server = new Server(
    { name: `${serverType}-mcpServer`, version: '0.1.0' },
    { capabilities: { resources: {}, tools: {}, prompts: {} } },
  )
  /** ---------------- Handlers ---------------- */
  // List Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: filteredTools.map((tool: any) => {
      const inputSchema = tool.function.parameters
      inputSchema.properties = { ...inputSchema.properties }
      return {
        name: tool.function.name,
        description: tool.function.description,
        inputSchema,
      }
    }),
  }))

  //   // Handle cancellation notifications
  //   server.setNotificationHandler('notifications/cancelled' as any, async (notification: any) => {
  //     logger.warn(`[MCP-NOTIFICATION] ⚠️  Request cancelled by client`)
  //     logger.warn(`[MCP-NOTIFICATION] Cancelled request ID: ${notification.params?.requestId}`)
  //     logger.warn(`[MCP-NOTIFICATION] Reason: ${notification.params?.reason}`)
  //   })

  // Call Tool
  server.setRequestHandler(CallToolRequestSchema, async (request: any, session: any) => {
    const toolStartTime = Date.now()
    const toolName = request.params.name

    console.log(`[MCP-SERVER] 🔧 Tool request received: ${toolName} [sessionId:${session['sessionId']}]`)
    logger.info(`[MCP-SERVER] Tool request received: ${toolName}`, { sessionId: session['sessionId'] })

    const user = getSessionData(session['sessionId'])
    if (!user) {
      throw unauthorized('invalid session')
    }
    console.log(`[MCP-SERVER] ✅ User authenticated: userId=${user.userId}`)

    const context = getRequestContext()
    function markTokenValid() {
      const ctx = requestContext.getStore()
      if (ctx) {
        requestContext.enterWith({
          ...ctx,
          ...context,
          userId: String(user.userId),
          sessionId: String(user.sessionId),
        })
      }
    }
    markTokenValid()
    const body = omit(request.params.arguments, ['orgId', 'userId', 'roles'])
    if (body.email && !isEmpty(body.email)) {
      body.email = body.email.toLowerCase()
    }

    console.log(`[MCP-SERVER] 📦 Prepared tool arguments for: ${toolName}`)

    // Add timeout wrapper for tool execution (4 minutes - less than request timeout)
    const TOOL_TIMEOUT = 240000 // 4 minutes

    console.log(`[MCP-SERVER] ⏱️  Starting tool execution: ${toolName} (timeout: ${TOOL_TIMEOUT / 1000}s)`)
    const toolExecutionPromise = handleToolCall(toolName, body, {
      ...user
    })

    let timeoutHandle: NodeJS.Timeout
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        logger.error(`[MCP-TOOL] ⏱️ TIMEOUT! Tool '${request.params.name}' exceeded ${TOOL_TIMEOUT / 1000}s`)
        console.error(`[MCP-TOOL] ⏱️ TIMEOUT! Tool '${request.params.name}' exceeded ${TOOL_TIMEOUT / 1000}s`)
        reject(
          new Error(`Tool execution timeout after ${TOOL_TIMEOUT / 1000} seconds for tool: ${request.params.name}`),
        )
      }, TOOL_TIMEOUT)
    })

    try {
      const result = await Promise.race([toolExecutionPromise, timeoutPromise])
      clearTimeout(timeoutHandle!)
      const duration = Date.now() - toolStartTime
      console.log(`[MCP-SERVER] ✅ Tool execution completed: ${toolName} in ${duration}ms`)
      logger.info(`[MCP-SERVER] Tool execution completed: ${toolName} in ${duration}ms`)
      const response = { content: transformToMCPContent(result) }
      return response
    } catch (error: any) {
      clearTimeout(timeoutHandle!)
      const duration = Date.now() - toolStartTime
      const isTimeout = error instanceof Error && error.message.includes('timeout')

      if (isTimeout) {
        logger.error(`[MCP-TOOL] ⏱️ TIMEOUT after ${duration}ms for tool: ${toolName}`)
        console.error(`[MCP-TOOL] ⏱️ TIMEOUT after ${duration}ms for tool: ${toolName}`)
      } else {
        logger.error(`[MCP-TOOL] Tool '${toolName}' failed after ${duration}ms:`, error)
        console.error(`[MCP-TOOL] Tool '${toolName}' failed:`, error)
      }
      throw error
    }
  })

  return server
}

const CloseMcpServer = () => {
  const logger = LoggerProvider.Instance.logger
  /**
   * 🛑 Handles server shutdown and cleans up resources.
   */
  process.on('SIGINT', async () => {
    logger.info('🛑 Shutting down server...')
    // Closes all active transports
    const transports = getAllTransports()
    for (const sessionId in transports) {
      try {
        logger.info(`🔒 Closing transport for session ${sessionId}`)
        await getTransports(sessionId).close()
        deleteTransports(sessionId)
      } catch (error: any) {
        logger.error(`❌ Error closing transport for session ${sessionId}:`, error)
      }
    }
    logger.info('✅ Shutdown complete')
    process.exit(0)
  })
}

export { ModuleMcpServer, CloseMcpServer }
