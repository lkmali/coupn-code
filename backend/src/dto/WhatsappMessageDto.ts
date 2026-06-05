import { IsNotEmpty, IsString, IsNumberString } from 'class-validator'
import { UUIDTypes } from 'uuid'
import {IsValidMobileNumber} from './validators/IsValidMobileNumber.validator'
import { IsSafeMessage } from './validators/IsSafeMessage.validator'

export class WhatsappMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
 @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsSafeMessage({ message: 'Message contains unsafe content. Only plain text, emails, and standard characters are allowed.' })
  public message!: string

  public orgId!: string
  public userType?: string
  public createdBy?: UUIDTypes
}
