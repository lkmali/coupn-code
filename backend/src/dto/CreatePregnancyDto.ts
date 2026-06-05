import { IsNotEmpty, IsOptional, IsString, IsIn, IsDateString, IsNumber } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreatePregnancyDto {
  @IsNotEmpty()
  @IsString()
  patientId!: string

  @IsNotEmpty()
  @IsIn(['NATURAL', 'IUI', 'IVF'])
  conceptionType!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sourceCycleId?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['IUI', 'IVF'])
  sourceCycleType?: string

  @IsNotEmpty()
  @IsDateString()
  lmpDate!: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['NORMAL', 'HIGH_RISK', 'TWIN', 'IVF'])
  pregnancyType?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  gravida?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  para?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  bloodGroup?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  rhFactor?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sopTreatmentTypeId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignedDoctorId?: string
}
