import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'

export class GetLeadAgentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public referenceId?: string
}
