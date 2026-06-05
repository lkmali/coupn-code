import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { AppointmentStatus } from '../typings'

/**
 * Create Appointment DTO
 *
 * **Timezone Handling:**
 * - All dates are stored in UTC in the database
 * - You can specify timezone via:
 *   1. X-Timezone header (e.g., "Asia/Kolkata", "America/New_York")
 *   2. Optional timezone field in request body
 *   3. ISO string with timezone offset (e.g., "2025-01-15T14:30:00+05:30")
 * - If no timezone specified, defaults to Asia/Kolkata (IST)
 *
 * **Date Format Examples:**
 * - With timezone in string: "2025-01-15T14:30:00+05:30" or "2025-01-15T09:00:00Z"
 * - Without timezone: "2025-01-15 14:30:00" (will use X-Timezone header or default IST)
 */
export class CreateAppointmentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public leadId!: string

  @IsString()
  @IsNotEmpty()
  appointmentDate!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsNotEmpty()
  endDate!: string

  @IsString()
  @IsNotEmpty()
  public appointmentType!: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  public duration: number = 0

  @IsOptional()
  @CleanOptional()
  @IsString()
  public description!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public timezone?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public appointmentMode?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(AppointmentStatus, { message: 'status must be PENDING, IN_PROGRESS, COMPLETED or CANCELLED' })
  public status?: AppointmentStatus
}
