import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

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

export class PatientRegisterSimplifiedDto {
  @IsString()
  @IsNotEmpty({ message: 'Patient name is required' })
  public name!: string

  @IsNumber()
  @IsNotEmpty({ message: 'Age is required' })
  public age!: number

  @IsString()
  @IsNotEmpty({ message: 'Gender is required' })
  public gender!: string

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  public mobileNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public dob?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public email?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public address?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public city?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public pinCode?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public emergencyContactName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public emergencyContactPhone?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public aadharNumber?: string

  @IsOptional()
  @IsString()
  public countryCode?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => ReferredByDto)
  public referredBy?: ReferredByDto

  @IsOptional()
  @IsArray()
  public selectedTasks?: any[]
}
