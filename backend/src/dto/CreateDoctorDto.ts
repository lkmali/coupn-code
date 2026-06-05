import { IsArray, IsNotEmpty, IsNumber, IsString, IsNumberString, Min } from 'class-validator'
import {IsValidMobileNumber} from './validators/IsValidMobileNumber.validator'

export class CreateDoctorDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty()
  email!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  specialization!: string[]

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  languagesSpoken!: string[]

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Invalid experienceYears' })
  experienceYears!: number

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  qualifications!: string[]
}
