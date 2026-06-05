import { IsNotEmpty, IsOptional, IsString, IsArray, IsIn, IsDateString, ArrayMinSize, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class IVFPrescriptionMedicineDto {
  @IsNotEmpty()
  @IsString()
  name!: string

  @IsNotEmpty()
  @IsString()
  dosage!: string

  @IsNotEmpty()
  @IsString()
  frequency!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  timing?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  duration?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  route?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  instructions?: string
}

export class IVFPrescriptionContextRefDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  stimulationDayId?: string

  @IsOptional()
  @CleanOptional()
  pickupNumber?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  embryoId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  etpPrepId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  etpDayId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  transferId?: string
}

export class CreateIVFPrescriptionDto {
  @IsNotEmpty()
  @IsIn(['stimulation', 'opu', 'embryology', 'etp', 'transfer', 'outcome'])
  stage!: string

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

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IVFPrescriptionMedicineDto)
  medicines!: IVFPrescriptionMedicineDto[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
