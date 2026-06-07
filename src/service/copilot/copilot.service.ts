import OpenAI from 'openai'
import { isNil } from 'lodash'
import { UserProfile } from '../../typings'
import { ChatMessageDto } from '../../dto'
import { LoggerProvider } from '../../provider/logger.provider'
import { OpenAIService } from './openai.service'
import { runTool, toolDefinitions } from './tools'
import { OrganizationConfigurationService } from '../organizationConfiguration.service'

const loggerProvider = LoggerProvider.Instance

/** Hard cap on tool-calling rounds so a misbehaving model can't loop forever. */
const MAX_TOOL_ROUNDS = 5

const SYSTEM_PROMPT = `You are the in-dashboard copilot for an operations team.
You answer questions about the organization's orders, product catalog and Stripe billing.
Always use the provided tools to fetch real data — never invent ids, amounts or statuses.
Monetary amounts from the tools are in the smallest currency unit (e.g. cents); convert to a
human-readable value when you present them. If a tool returns an error, explain it plainly.
Be concise and format lists/tables in Markdown.`

export interface ChatResult {
  reply: string
  toolsUsed: string[]
}

/**
 * Orchestrates a single copilot turn: seeds the system prompt, runs the OpenAI
 * tool-calling loop against {@link runTool}, and returns the assistant's final
 * text. All tool calls run as the authenticated `user`, so data access stays
 * scoped to their org exactly like the REST API.
 */
export class CopilotService {
  private static instance: CopilotService
  private readonly openAIService = OpenAIService.Instance
  private readonly organizationConfigurationService = OrganizationConfigurationService.Instance

  async chat(user: UserProfile, history: ChatMessageDto[]): Promise<ChatResult> {
    // Use the org-specific OpenAI key saved under Configuration → AI Keys.
    let orgConfig = await this.organizationConfigurationService
      .getOrganizationConfigurationFromDb(user.orgId)
      .catch(() => null)
    let apiKey = orgConfig?.openaiApiKey

    // If the in-memory cache returned a config without the key (stale/partial
    // entry), fall back to a fresh DB read before giving up.
    if (!apiKey) {
      orgConfig = await this.organizationConfigurationService
        .getOrganizationConfigurationFromDb(user.orgId, { skipCache: true })
        .catch(() => null)
      apiKey = orgConfig?.openaiApiKey
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]

    const toolsUsed: string[] = []

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await this.openAIService.createChatCompletion(
        {
          // Per-org model (Configuration → AI Keys) takes precedence so each
          // org can pick a model its OpenAI project is entitled to; falls back
          // to the global default when unset.
          model: orgConfig?.openaiModel || this.openAIService.model,
          messages,
          tools: toolDefinitions,
          tool_choice: 'auto',
        },
        apiKey,
      )

      const choice = completion.choices[0]?.message
      if (!choice) break

      // No tool calls → the model produced its final answer.
      if (!choice.tool_calls?.length) {
        return { reply: choice.content ?? '', toolsUsed }
      }

      // Echo the assistant's tool-call message, then resolve each call.
      messages.push(choice)
      for (const call of choice.tool_calls) {
        if (call.type !== 'function') continue
        toolsUsed.push(call.function.name)

        let args: unknown = {}
        try {
          args = call.function.arguments ? JSON.parse(call.function.arguments) : {}
        } catch {
          // Leave args as {} — runTool will surface a meaningful error if needed.
        }

        const output = await runTool(call.function.name, args, { user })
        messages.push({ role: 'tool', tool_call_id: call.id, content: output })
      }
    }

    loggerProvider.logger.warn('copilot_max_tool_rounds_reached', {
      orgId: String(user.orgId),
      toolsUsed,
    })
    return {
      reply:
        "I wasn't able to finish that request — it required too many steps. Please try rephrasing or narrowing it down.",
      toolsUsed,
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
