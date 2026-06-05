import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator'
import {  Role } from '../typings'
import { CleanOptional } from '../decorators'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'
import { IsValidFullName } from './validators/IsValidFullName.validator'

export class RegisterHospitalUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @IsValidFullName()
  userName!: string

  @IsString()
  @IsNotEmpty()
  email!: string

  @IsArray()
  @ArrayMinSize(1, { message: 'Roles must contain at least one role' })
  @ArrayMaxSize(1, { message: 'Only one role is allowed when creating user' })
  public roles: Role[] = [Role.RECEPTIONIST]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  specialization?: string[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  languagesSpoken?: string[]

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  @Min(1, { message: 'Invalid experienceYears' })
  experienceYears?: number

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[]
}
