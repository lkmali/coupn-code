import { IsOptional, IsString, IsArray, IsDateString, IsObject } from 'class-validator'
import { CleanOptional } from '../decorators'

/** Full-replace payload for `stimulation`. All fields optional. */
export class UpdateStimulationDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  protocol?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  protocolType?: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  dailyRecords?: any[]

  @IsOptional()
  @CleanOptional()
  @IsObject()
  triggerDetails?: Record<string, any>
}
