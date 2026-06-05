import { IsNotEmpty, IsString } from 'class-validator'

export class RegisterClientKeyDto {
  @IsString()
  @IsNotEmpty()
  botName!: string
}
