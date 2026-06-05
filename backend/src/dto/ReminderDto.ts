import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, Min, ValidateNested, IsArray, ArrayMinSize } from 'class-validator'
import { CleanOptional } from '../decorators'
import { PaginationQuery } from './query/PaginationQuery'
import { Type } from 'class-transformer'

export enum ReminderTypeEnum {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  CALL = 'CALL',
}

export enum ReminderDirectionEnum {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  PRE = 'PRE',
  POST = 'POST',
}

export enum ReminderStatusEnum {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * A single reminder configuration item.
 *
 * @example
 * { "type": "CALL", "minutes": 30, "direction": "BEFORE" }
 * { "type": "WHATSAPP", "minutes": 60, "direction": "BEFORE" }
 * { "type": "EMAIL", "minutes": 15, "direction": "AFTER" }
 */
export class ReminderItemDto {
  @IsEnum(ReminderTypeEnum, { message: 'type must be one of: WHATSAPP, EMAIL, CALL' })
  @IsNotEmpty()
  type!: ReminderTypeEnum

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'minutes must be at least 1' })
  minutes!: number

  @IsEnum(ReminderDirectionEnum, { message: 'direction must be one of: BEFORE, AFTER, PRE, POST' })
  @IsNotEmpty()
  direction!: ReminderDirectionEnum

  @IsOptional()
  @CleanOptional()
  @IsString()
  message?: string
}

/**
 * Create one or more reminders for an appointment.
 * leadId and reminderDate are derived from the appointment record.
 *
 * @example
 * {
 *   "appointmentId": "6697...",
 *   "reminders": [
 *     { "type": "CALL",     "minutes": 30,  "direction": "BEFORE" },
 *     { "type": "WHATSAPP", "minutes": 30,  "direction": "BEFORE" },
 *     { "type": "EMAIL",    "minutes": 60,  "direction": "BEFORE", "message": "Don't forget your appointment!" },
 *     { "type": "WHATSAPP", "minutes": 15,  "direction": "AFTER",  "message": "Thank you for visiting!" }
 *   ]
 * }
 */
export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  appointmentId!: string

  @IsArray({ message: 'reminders must be an array' })
  @ArrayMinSize(1, { message: 'At least one reminder item is required' })
  @ValidateNested({ each: true })
  @Type(() => ReminderItemDto)
  reminders!: ReminderItemDto[]
}

export class UpdateReminderDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  reminderDate?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(ReminderTypeEnum)
  reminderType?: ReminderTypeEnum

  @IsOptional()
  @CleanOptional()
  @IsEnum(ReminderDirectionEnum)
  reminderDirection?: ReminderDirectionEnum

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  offsetMinutes?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  message?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(ReminderStatusEnum)
  status?: ReminderStatusEnum
}

/**
 * Set multiple reminders for an appointment (replaces existing pending reminders).
 * leadId and reminderDate are derived from the appointment record.
 *
 * @example
 * {
 *   "appointmentId": "6697...",
 *   "reminders": [
 *     { "type": "CALL",     "minutes": 30,  "direction": "BEFORE" },
 *     { "type": "WHATSAPP", "minutes": 30,  "direction": "BEFORE" },
 *     { "type": "EMAIL",    "minutes": 60,  "direction": "BEFORE", "message": "Don't forget your appointment!" },
 *     { "type": "WHATSAPP", "minutes": 15,  "direction": "AFTER",  "message": "Thank you for visiting!" }
 *   ]
 * }
 */
export class SetRemindersDto {
  @IsString()
  @IsNotEmpty()
  appointmentId!: string

  @IsArray({ message: 'reminders must be an array' })
  @ArrayMinSize(1, { message: 'At least one reminder item is required' })
  @ValidateNested({ each: true })
  @Type(() => ReminderItemDto)
  reminders!: ReminderItemDto[]
}

export class GetRemindersQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  appointmentId?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(ReminderStatusEnum)
  status?: ReminderStatusEnum

  @IsOptional()
  @CleanOptional()
  @IsEnum(ReminderTypeEnum)
  reminderType?: ReminderTypeEnum

  @IsOptional()
  @CleanOptional()
  @IsEnum(ReminderDirectionEnum)
  reminderDirection?: ReminderDirectionEnum
}
