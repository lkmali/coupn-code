import { IsNotEmpty, IsString } from 'class-validator'
import { IsSafeMessage } from './validators/IsSafeMessage.validator'
export class SocialMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsSafeMessage({ message: 'Message contains unsafe content. Only plain text, emails, and standard characters are allowed.' })
  public message!: string
}
