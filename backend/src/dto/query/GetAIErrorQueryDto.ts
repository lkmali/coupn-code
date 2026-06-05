import { IsOptional, IsString, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../../decorators'
import { PaginationQuery } from './PaginationQuery'

export class GetAIErrorQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  trackingId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  agentUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  socialId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isResolved?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  errorMessage?: string
}
