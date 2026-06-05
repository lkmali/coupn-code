import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { ActivityType } from '../../typings'
import { CleanOptional } from '../../decorators'
import { IsAtLeastOneOf } from '../validators'

export class AddActivityAgentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsAtLeastOneOf(['leadId', 'referenceId'])
  public leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public referenceId?: string

  @IsEnum(ActivityType, { message: 'Invalid activity type' })
  @IsNotEmpty()
  public activityType!: ActivityType

  @IsString()
  @IsNotEmpty()
  public title!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public description?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public source?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public result?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public nextAction?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public duration?: number

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  public activityTime?: Date

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public noteTags?: string[]
}
