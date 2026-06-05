import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'
import { PaginationQuery } from './query/PaginationQuery'

export class GetActivityQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  activityType?: string

  // Case-insensitive substring search across title / description / result.
  // Empty string is treated as "no filter".
  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string
}
