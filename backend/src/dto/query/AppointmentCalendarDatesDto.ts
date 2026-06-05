import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'

// Drives GET /api/appointment/calendar-dates — returns the distinct local-day
// (Asia/Kolkata) date keys that have at least one matching appointment inside
// the [startDate, endDate] window. Used by the FE calendar to render month dots
// without paying the full-document fetch cost.
export class AppointmentCalendarDatesDto {
  @IsDateString()
  @IsNotEmpty()
  startDate!: string

  @IsDateString()
  @IsNotEmpty()
  endDate!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  doctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string
}
