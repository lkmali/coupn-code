import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreateIUICycleDto {
  @IsNotEmpty()
  @IsString()
  patientId!: string

  @IsNotEmpty()
  @IsDateString()
  startDate!: string

  @IsNotEmpty()
  @IsString()
  protocolType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignedDoctorId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sopTreatmentTypeId?: string
}
