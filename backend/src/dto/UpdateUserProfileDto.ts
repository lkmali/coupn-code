import {
  IsArray,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsNumberString,
  IsNotEmpty,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator'
import { CleanOptional } from '../decorators'
import { Role } from '../typings'
import {IsValidMobileNumber} from './validators/IsValidMobileNumber.validator'
import { IsValidFullName } from './validators/IsValidFullName.validator'

export class UpdateUserProfileDto {
     @IsOptional()
     @CleanOptional()
     @IsOptional()
     @CleanOptional()
     @IsNotEmpty({ message: 'Mobile number should not be empty' })
     @IsNumberString({}, { message: 'Mobile number must contain only digits' })
     @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
     public mobileNumber?: string

     @IsOptional()
     @CleanOptional()
     @IsString()
     @IsNotEmpty({ message: 'Full name is required' })
     @IsValidFullName()
     userName?: string

     @IsOptional()
     @CleanOptional()
     @IsArray()
     @ArrayNotEmpty({ message: 'Roles array should not be empty' })
     @IsEnum(Role, { each: true, message: 'Invalid role provided' })
     roles?: Role[]

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
