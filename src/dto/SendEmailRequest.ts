import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { TemplateName } from '../typings'

export class SendEmailRequest {
  @IsEnum(TemplateName)
  @IsNotEmpty()
  public emailTemplate!: TemplateName

  @IsString()
  @IsNotEmpty()
  public subject!: string

  @IsString()
  @IsNotEmpty()
  public body!: string
}
