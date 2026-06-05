import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { ActivityType } from '../typings'
import { CleanOptional } from '../decorators'

export class AddActivityDto {
  
  @IsString()  
  @IsNotEmpty()
  activityType!: ActivityType

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  activityTime?: Date

  @IsString()
  @IsNotEmpty()
  title!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  duration?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  result?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  nextAction?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  source?: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  noteTags?: string[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  reportIds?: string[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  doctorId?: string
  appointmentId?: string
  taskId?: string
}
