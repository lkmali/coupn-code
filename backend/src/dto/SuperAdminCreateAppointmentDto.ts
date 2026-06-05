import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { AppointmentStatus } from '../typings'

export class SuperAdminCreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  public orgId!: string

  @IsString()
  @IsNotEmpty()
  public mobileNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId!: string

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
  @IsEnum(AppointmentStatus, { message: 'status must be PENDING, COMPLETED or CANCELLED' })
  public status?: AppointmentStatus
}
