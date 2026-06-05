import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'
import { IsSafeMessage } from './validators/IsSafeMessage.validator'

export class SendMediaReplyDto {
  @IsString()
  @IsNotEmpty()
  public keyId!: string

  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsOptional()
  @IsString()
  @IsSafeMessage({ message: 'Caption contains unsafe content. Only plain text, emails, and standard characters are allowed.' })
  public caption?: string
}
