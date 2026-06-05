import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Express } from 'express'
import { MedicalTools, LeadTools, AppointmentTools, PatientTools, DoctorTools, SOPTools, TaskTools } from '../tools/medicalTools'
import { buildZodSchema } from '../tools/joiSchema'
import { handleToolCall } from '../tools/handlers'
import { prepareErrorMessageForAgents } from '../../utils'
import {  envConfig } from '../../config'
import { addMcpApi } from './router'
import fs from 'fs'
import path from 'path'
import { Request, Response } from 'express'
import { AgentDefinition, AgentServer, UserProfile } from '../../typings'
import { JWTService } from '../../service/jwt.service'
import {extractCredentialsFromHeaders} from '../../utils'
import { addMcpDocs } from '../docs/mcpDocs'

const toolsList = {
  patient: PatientTools,
  doctor: DoctorTools,
  appointment: AppointmentTools,
  lead: LeadTools,
  sop: SOPTools,
  task: TaskTools,
  single: MedicalTools,
}



const authenticate = async (headers:any): Promise<UserProfile> => {
  const token = extractCredentialsFromHeaders(headers)
  console.log("token",token)
  const userProfile: UserProfile = JWTService.Instance.verifyToken(token, envConfig.BOT_TOKEN_NETWORK) as UserProfile
  return Promise.resolve(userProfile)
}
function registerServer(serverType: 'patient' | 'doctor' | 'appointment' | 'lead' | 'sop' | 'task' | 'single') {
  const server = new McpServer({
    name: 'anantai mcp',
    version: '1.0.0',
    capabilities: {
      resources: {},
      tools: {},
    },
  } as any)

  const tools = toolsList[serverType]
  for (const tool of tools) {
    const properties = tool.function.parameters.properties
    const required = tool.function.parameters.required ?? []

    server.tool(
      tool.function.name,
      tool.function.description,
      buildZodSchema(properties, required),
      // ✅ must accept (args, extra)
      async (args:any, extra:any) => {
        try {
          const result = await handleToolCall(tool.function.name, args, await authenticate(extra?.requestInfo?.headers as any))
          // ✅ Must return CallToolResult-compatible object

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    data: result,
                  },
                  null,
                  2,
                ),
              },
            ],
          }
        } catch (error: any) {
          const errorMessage = prepareErrorMessageForAgents(error)
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ error: errorMessage }),
              },
            ],
            isError: true,
          }
        }
      },
    )
  }

  // Register weather tools

  return server
}



export async function loadAllServer(app: Express) {
  // Attach multiple MCP servers under different routes
  return new Promise((resolve, reject) => {
    try {
      addMcpApi(app, registerServer('single'), '/mcp/all')
      registerAgentRoutes(app)
      addMcpDocs(app)
      resolve('suess')
    } catch (error: any) {
      reject(error)
    }
  })
}

export function registerAgentRoutes(app: Express) {
  const agentsDir = path.join(__dirname, '..', 'agents')

  // GET /mcp/agents → List all agent files
  app.get('/mcp/agents', (_req: Request, res: Response): void => {
    try {
      const files = fs
        .readdirSync(agentsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))

      res.json({ agents: files })
    } catch (error) {
      console.error('Error listing agents:', error)
      res.status(500).json({ error: 'Failed to list agents' })
    }
  })

  // GET /mcp/agents/:agentId → Return agent definition with env-based URL replacement
  app.get('/mcp/agents/:agentId', (req: Request, res: Response): void => {
    try {
      const agentId = req.params.agentId
      const agentFile = path.join(agentsDir, `${agentId}.json`)

      if (!fs.existsSync(agentFile)) {
        res.status(404).json({ error: 'Agent not found' })
        return
      }

      const raw = fs.readFileSync(agentFile, 'utf8')
      const agent: AgentDefinition = JSON.parse(raw)

      // Environment URL (ensure it exists)
      const BASE = envConfig.BACKEND_URL || 'http://localhost:4000'

      if (Array.isArray(agent.servers)) {
        agent.servers = agent.servers.map((server: AgentServer) => ({
          ...server,
          url: server.url.replace('{{MCP_BASE_URL}}', BASE),
        }))
      }

      res.json(agent)
    } catch (error) {
      console.error('Agent load error:', error)
      res.status(500).json({ error: 'Failed to load agent' })
    }
  })
}
