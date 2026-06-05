import { IsDateString, IsEnum, IsNotEmpty, Matches, IsNumber, IsOptional, IsString, IsBoolean, ValidateNested } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { Gender, Language } from '../typings'
import { CleanOptional } from '../decorators'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'

export class PartnerDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsNumber()
  age?: number
}

export class AddLeadRequest {
  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty' })
  public name!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  email?: string

  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  // Lead sources are configured per-organization in master data (super-admin →
  // Master Config → Lead Sources), so we only validate that it's a non-empty
  // string here rather than against a fixed enum.
  @IsOptional()
  @IsString()
  public source?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public assignUserId?: string

  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '') : value)
  public notes!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public referenceId?: string

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
  @IsString()
  public description?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  @IsNotEmpty()
  public appointmentDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public appointmentDescription?: string

  @IsOptional()
  @CleanOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @IsEnum(Language, { message: 'Invalid language type' })
  language?: Language


  @IsOptional()
  @CleanOptional()
  @IsString()
  instagramId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  messengerId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadResourceId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public lastCallId?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public isValidName?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public requiredFollowup?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public isNeedSendTestimonial?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  public needToUpdateName?: boolean

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => PartnerDto)
  public malePartner?: PartnerDto

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => PartnerDto)
  public femalePartner?: PartnerDto

  @IsOptional()
  @CleanOptional()
  @IsString()
  public marriedSince?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public refersBy?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public campLocation?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public centerName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public routingPhoneNumber?: string

}
