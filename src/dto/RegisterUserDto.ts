import {
  IsArray,
  IsNotEmpty,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  MinLength,
} from 'class-validator'
import {  Role } from '../typings'

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  userName!: string

  @IsString()
  @IsNotEmpty()
  email!: string

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string

  @IsArray()
  @ArrayMinSize(1, { message: 'Roles must contain at least one role' })
  @ArrayMaxSize(1, { message: 'Only one role is allowed when creating user' })
  public roles: Role[] = [Role.USER]

}
