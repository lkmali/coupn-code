import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, IsNumberString, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { Gender, MaritalStatus } from '../typings'
import { CleanOptional } from '../decorators'
import {IsValidMobileNumber} from './validators/IsValidMobileNumber.validator'

// Referring source — discriminated nested object. `hospitalName` is only
// persisted when type === 'DOCTOR' (stripped server-side otherwise).
class ReferredByDto {
  @IsOptional() @CleanOptional() @IsIn(['DOCTOR', 'ASHA_WORKER', 'OTHER'])
  type?: 'DOCTOR' | 'ASHA_WORKER' | 'OTHER'
  @IsOptional() @CleanOptional() @IsString() name?: string
  @IsOptional() @CleanOptional() @IsString() phone?: string
  @IsOptional() @CleanOptional() @IsString() area?: string
  @IsOptional() @CleanOptional() @IsString() hospitalName?: string
}

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  email!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  source?: string

  @IsString()
  @IsNotEmpty()
  patientName!: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  @IsNotEmpty()
  age!: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  @Matches(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: 'DOB must be in DD/MM/YYYY format',
  })
  public dob?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(MaritalStatus, {
    message: 'Invalid appointment status',
  })
  maritalStatus!: MaritalStatus

  @IsOptional()
  @CleanOptional()
  @IsEnum(Gender, {
    message: 'Invalid gender status',
  })
  gender!: Gender

  @IsOptional()
  @CleanOptional()
  @IsString()
  aiSummary?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => ReferredByDto)
  referredBy?: ReferredByDto

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalHistory!: string[]
}
