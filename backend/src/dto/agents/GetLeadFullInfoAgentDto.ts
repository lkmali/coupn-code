import { IsNotEmpty, IsString } from 'class-validator'

export class GetLeadFullInfoAgentDto {
  @IsString()
  @IsNotEmpty()
  public referenceId!: string
}
