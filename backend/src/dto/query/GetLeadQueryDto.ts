import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'

export class GetLeadQueryDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  referenceId?: string
}
