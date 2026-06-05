import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'
import { PaginationQuery } from './PaginationQuery'

export class GetLeadActivityQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  apiSource?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  parentMethod?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string
}
