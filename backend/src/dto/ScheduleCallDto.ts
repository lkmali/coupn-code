import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class ScheduleCallDto {
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

  @IsDateString()
  @IsNotEmpty()
  callDate!: string

  @IsString()
  @IsNotEmpty()
  public appointmentType!: string

  @IsString()
  @IsNotEmpty()
  public description!: string

  @IsString()
  @IsNotEmpty({ message: 'Assign to user ID should not be empty' })
  public assignToUserId!: string
}
