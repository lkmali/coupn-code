import { IsNotEmpty, IsString } from 'class-validator'

export class LookupContactByMobileAgentDto {
  @IsString()
  @IsNotEmpty()
  public mobileNumber!: string
}
