import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'

// Drives GET /api/followup/calendar-dates — returns the distinct local-day
// (Asia/Kolkata) date keys that have at least one matching follow-up inside
// the [startDate, endDate] window. Used by the FE calendar to render month dots
// without paying the full-document fetch cost.
export class FollowUpCalendarDatesDto {
  @IsDateString()
  @IsNotEmpty()
  startDate!: string

  @IsDateString()
  @IsNotEmpty()
  endDate!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string
}
