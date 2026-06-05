import { IsNotEmpty, IsString, IsNumberString, MaxLength } from 'class-validator'

export class SendOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @MaxLength(23, { message: 'Mobile number must be at most 23 digits' })
  public mobileNumber!: string
}
