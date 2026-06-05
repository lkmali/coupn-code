import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray, IsDateString, IsNumberString, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { Gender, MaritalStatus } from '../typings'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'

class PartnerDto {
  @IsOptional() @CleanOptional() @IsString() name?: string
  @IsOptional() @CleanOptional() @IsString() age?: string
  @IsOptional() @CleanOptional() @IsString() bloodGroup?: string
  @IsOptional() @CleanOptional() @IsString() profession?: string
  @IsOptional() @CleanOptional() @IsString() phoneNumber?: string
  @IsOptional() @CleanOptional() @IsString() email?: string
  @IsOptional() @CleanOptional() @IsString() aadharNumber?: string
}

// Referring source — discriminated nested object. `type` flags the referrer
// kind; `hospitalName` is only meaningful when type === 'DOCTOR' and is
// stripped server-side for other types (see normalizeReferredBy in
// patient.service.ts). All fields optional; an all-empty object is dropped.
class ReferredByDto {
  @IsOptional() @CleanOptional() @IsIn(['DOCTOR', 'ASHA_WORKER', 'OTHER'])
  type?: 'DOCTOR' | 'ASHA_WORKER' | 'OTHER'
  @IsOptional() @CleanOptional() @IsString() name?: string
  @IsOptional() @CleanOptional() @IsString() phone?: string
  @IsOptional() @CleanOptional() @IsString() area?: string
  @IsOptional() @CleanOptional() @IsString() hospitalName?: string
}

export class PatientRegisterStep1Dto {
  // Basic details - wife
  @IsString() @IsNotEmpty() patientName!: string
  @IsString() @IsNotEmpty() @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format' })
  mobileNumber!: string
  @IsOptional() @CleanOptional() @IsString() countryCode?: string
  @IsOptional() @CleanOptional() @IsString() email?: string
  @IsOptional() @CleanOptional() @IsString() age?: string
  @IsOptional() @CleanOptional() @IsEnum(Gender) gender?: Gender
  @IsOptional() @CleanOptional() @IsEnum(MaritalStatus) maritalStatus?: MaritalStatus
  @IsOptional() @CleanOptional() @IsString() bloodGroup?: string
  @IsOptional() @CleanOptional() @IsString() profession?: string
  @IsOptional() @CleanOptional() @IsString() aadharNumber?: string
  @IsOptional() @CleanOptional() @IsString() address?: string
  @IsOptional() @CleanOptional() @IsString() city?: string
  @IsOptional() @CleanOptional() @IsString() source?: string

  // Registration
  @IsOptional() @CleanOptional() @IsString() registrationNumber?: string
  @IsOptional() @CleanOptional() @Type(() => ReferredByDto) referredBy?: ReferredByDto
  @IsOptional() @CleanOptional() @IsString() treatmentType?: string
  @IsOptional() @CleanOptional() @IsString() treatmentCategory?: string

  // SOP Patient Type
  @IsOptional() @CleanOptional() @IsString() patientType?: string

  // Identity of the patient's opposite-sex partner (UI labels Wife/Husband based on patient.gender).
  @IsOptional() @CleanOptional() @Type(() => PartnerDto) partner?: PartnerDto

  // Marriage & Infertility
  @IsOptional() @CleanOptional() @IsDateString() marriageDate?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() yearsMarried?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() yearsTryingToConceive?: number
  @IsOptional() @CleanOptional() @IsString() infertilityType?: string

  // Assign doctor
  @IsOptional() @CleanOptional() @IsString() assignDoctorId?: string

  // Medical history
  @IsOptional() @IsArray() @IsString({ each: true }) medicalHistory?: string[]
}
