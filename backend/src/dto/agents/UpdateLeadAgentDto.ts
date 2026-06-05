import { IsDateString, IsEnum, IsNotEmpty, Matches, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'
import { Gender, Language } from '../../typings'
import { CleanOptional } from '../../decorators'
import { IsValidMobileNumber } from '../validators/IsValidMobileNumber.validator'

export class UpdateLeadAgentDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public name?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  email?: string

  // Lead sources are org-configurable master data; accept any string.
  @IsOptional()
  @IsString()
  public source?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public notes?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public referenceId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public description?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  public followUpDate?: Date

  @IsOptional()
  @CleanOptional()
  @IsEnum(Gender, {
    message: 'Invalid gender status',
  })
  public gender?: Gender

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public age?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  @Matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: 'DOB must be in DD/MM/YYYY format',
  })
  public dob?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public userSentimentSummary?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public others?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public aiSummary?: string

  @IsOptional()
  @CleanOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(Language, { message: 'Invalid language type' })
  language?: Language

  @IsOptional()
  @CleanOptional()
  @IsString()
  public instagramId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public messengerId?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public requiredFollowup?: boolean

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public followupCounts?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  public reminderCount?: number

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public isValidName?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public needToUpdateName?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public isNeedSendTestimonial?: boolean
}
