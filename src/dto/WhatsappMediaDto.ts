import { IsNotEmpty, IsString } from 'class-validator'

export class WhatsappMediaDto {
  @IsString()
  @IsNotEmpty()
  public keyId!: string
}
