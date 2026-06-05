import { IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator'
import { CleanOptional } from '../decorators'
import { PaginationQuery } from './query/PaginationQuery'

export class GetFollowUpQueryDto extends PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isOverdue?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  todayFollowUp?: boolean

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  todayOverDueFollowUp?: boolean

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  updatedStartDate?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  updatedEndDate?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string

  // When true, the response also includes a `counts` block with
  // { all, pending, completed, overdue } evaluated in a single $facet
  // round-trip. Drives the Scheduling > Follow-Ups stat cards.
  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  includeCounts?: boolean
}
