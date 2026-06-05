import { IsNotEmpty, IsString } from 'class-validator'

export class GetWhatsAppHistoryAgentDto {
  @IsString()
  @IsNotEmpty()
  public mobileNumber!: string
}
