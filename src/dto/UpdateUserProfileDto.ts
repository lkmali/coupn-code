import {
  IsArray,
  IsString,
  IsOptional,
  IsNumberString,
  IsNotEmpty,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator'
import { CleanOptional } from '../decorators'
import { Role } from '../typings'

export class UpdateUserProfileDto {
     @IsOptional()
     @CleanOptional()
     @IsOptional()
     @CleanOptional()
     @IsNotEmpty({ message: 'Mobile number should not be empty' })
     @IsNumberString({}, { message: 'Mobile number must contain only digits' })
     //@IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
     public mobileNumber?: string

     @IsOptional()
     @CleanOptional()
     @IsString()
     @IsNotEmpty({ message: 'Full name is required' })
     userName?: string

     @IsOptional()
     @CleanOptional()
     @IsArray()
     @ArrayNotEmpty({ message: 'Roles array should not be empty' })
     @IsEnum(Role, { each: true, message: 'Invalid role provided' })
     roles?: Role[]
}
