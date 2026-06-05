import { IsNotEmpty, IsString, Length, IsNumberString, MaxLength, Matches } from 'class-validator'

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @MaxLength(23, { message: 'Mobile number must be at most 23 digits' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'OTP should not be empty' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP must contain only numbers' })
  public otp!: string
}
