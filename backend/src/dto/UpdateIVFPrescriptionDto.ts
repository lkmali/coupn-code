import { IsOptional, IsString, IsArray, IsDateString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { IVFPrescriptionMedicineDto, IVFPrescriptionContextRefDto } from './CreateIVFPrescriptionDto'

export class UpdateIVFPrescriptionDto {
  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => IVFPrescriptionContextRefDto)
  contextRef?: IVFPrescriptionContextRefDto

  @IsOptional()
  @CleanOptional()
  @IsString()
  prescribedBy?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  prescriptionDate?: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IVFPrescriptionMedicineDto)
  medicines?: IVFPrescriptionMedicineDto[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
