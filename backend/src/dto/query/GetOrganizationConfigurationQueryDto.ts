import { IsOptional, IsString, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../../decorators'
import { PaginationQuery } from './PaginationQuery'

/**
 * Query DTO for fetching organization configurations
 *
 * Extends PaginationQuery to include sorting and pagination
 */
export class GetOrganizationConfigurationQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  configId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  organizationName?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @CleanOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isDelete?: boolean
}
