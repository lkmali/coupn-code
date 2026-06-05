import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../../decorators'

export class BookAppointmentAgentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientId?: string

  @IsString()
  @IsNotEmpty()
  public referenceId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public source?: string

  @IsOptional()
  @CleanOptional()
  @IsEnum(['CONSULTATION', 'FOLLOW_UP', 'EXTRA'], {
    message: 'Appointment type must be CONSULTATION, FOLLOW_UP, or EXTRA',
  })
  public appointmentType?: 'CONSULTATION' | 'FOLLOW_UP' | 'EXTRA'

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public patientName?: string

  @IsDateString()
  @IsNotEmpty()
  public appointmentDate!: string

  @IsString()
  @IsNotEmpty()
  public description!: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  public duration?: number
}
