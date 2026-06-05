import { IsNotEmpty, IsString } from 'class-validator'

export class ResetPasswordRequestDto {
  @IsString()
  @IsNotEmpty()
  email!: string

  @IsString()
  @IsNotEmpty()
  password!: string

  @IsString()
  @IsNotEmpty()
  otp!: string
}
