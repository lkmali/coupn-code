import { IsDateString, IsEmpty, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../../decorators'

// Drives GET /api/task/calendar-dates — returns the distinct local-day
// (Asia/Kolkata) date keys that have at least one matching task (by dueDate)
// inside the [startDate, endDate] window. Used by the Task Management date
// picker to render month dots without paying the full-document fetch cost.
//
// Status / priority / category accept the canonical enum values; the service
// normalizes them through the same equivalence map the list endpoint uses so
// dots stay in sync with what the user would see on click-through.
export class TaskCalendarDatesDto {
  @IsDateString()
  @IsNotEmpty()
  startDate!: string

  @IsDateString()
  @IsNotEmpty()
  endDate!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsIn(['CLINICAL', 'ADMINISTRATIVE', 'FOLLOW_UP', 'LAB_TEST', 'CONSULTATION', 'BILLING', 'OTHER'])
  category?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

  // Overdue tasks span every past day, so dots within a single visible month
  // wouldn't be meaningful. The FE skips this fetch entirely when the Overdue
  // stat card is active; reject explicitly so a misuse surfaces as a 400
  // instead of returning misleading dots.
  @IsEmpty({ message: 'isOverdue is not supported on /calendar-dates' })
  isOverdue?: never
}
