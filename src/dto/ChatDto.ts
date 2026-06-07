import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export type ChatRole = 'user' | 'assistant' | 'system'

/** A single turn in the conversation history sent up from the dashboard. */
export class ChatMessageDto {
  @IsString()
  @IsIn(['user', 'assistant', 'system'])
  role!: ChatRole

  @IsString()
  @IsNotEmpty()
  content!: string
}

/**
 * Copilot chat request. The client sends the full running transcript; the server
 * appends a system prompt, runs the tool-calling loop and returns the reply.
 */
export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]

  @IsOptional()
  @IsString()
  conversationId?: string
}
