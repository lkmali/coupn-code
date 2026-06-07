import OpenAI from 'openai'
import { isNil } from 'lodash'
import { openAIConfig } from '../../config'
import { LoggerProvider } from '../../provider/logger.provider'

const loggerProvider = LoggerProvider.Instance

/**
 * Thin singleton wrapper around the OpenAI SDK so the rest of the copilot does
 * not touch the client directly. Lazily constructs the client on first use and
 * fails loudly if `OPENAI_API_KEY` is missing.
 */
export class OpenAIService {
  private static instance: OpenAIService
  /** Clients cached per API key so each org reuses its own connection. */
  private clients = new Map<string, OpenAI>()

  /** Default chat model; configured in `openAIConfig`. */
  readonly model = openAIConfig.model || 'gpt-4o-mini'

  /**
   * Resolve a client for the given key, falling back to the env-level key.
   * The per-org key (saved in organization configuration) takes precedence so
   * each organization can bring its own OpenAI account.
   */
  private getClient(apiKey?: string): OpenAI {
    const key = (apiKey || openAIConfig.apiKey || '').trim()
    if (!key) {
      throw new Error('OpenAI API key is not configured. Add it under Configuration → AI Keys.')
    }
    let client = this.clients.get(key)
    if (!client) {
      client = new OpenAI({ apiKey: key })
      this.clients.set(key, client)
    }
    return client
  }

  /** One round-trip to the chat completions API (with tools advertised). */
  async createChatCompletion(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
    apiKey?: string,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    try {
      return await this.getClient(apiKey).chat.completions.create(params)
    } catch (error: any) {
      loggerProvider.logger.error('openai_chat_completion_error', {
        error: error?.message,
        stack: error?.stack,
      })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
