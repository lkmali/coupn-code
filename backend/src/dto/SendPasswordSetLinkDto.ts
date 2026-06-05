import { IsNotEmpty, IsString } from 'class-validator'

export class SendPasswordSetLinkDto {
  @IsString()
  @IsNotEmpty()
  email!: string
}
