import { IsNotEmpty, IsString, IsNumberString, IsObject } from 'class-validator'
import { IsValidMobileNumber } from './validators/IsValidMobileNumber.validator'

export class SendWhatsappTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'Mobile number should not be empty' })
  @IsNumberString({}, { message: 'Mobile number must contain only digits' })
  @IsValidMobileNumber({ message: 'Invalid mobile number format. Must include country code (91, 44, 1, or 971) without + prefix' })
  public mobileNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Template name is required' })
  public templateName!: string

  @IsObject()
  public bodyParameters:any = {}
}
