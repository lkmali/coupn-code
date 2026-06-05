import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsObject } from 'class-validator'
import { CleanOptional } from '../decorators'

export enum DonorRequestType {
  SPERM = 'SPERM',
  OVUM = 'OVUM',
  EMBRYO = 'EMBRYO',
}

export enum DonorRequestCycleType {
  IUI = 'IUI',
  IVF = 'IVF',
}

export class CreateDonorRequestDto {
  @IsNotEmpty()
  @IsEnum(DonorRequestType)
  requestType!: DonorRequestType

  @IsNotEmpty()
  @IsString()
  patientId!: string

  @IsNotEmpty()
  @IsString()
  cycleId!: string

  @IsNotEmpty()
  @IsEnum(DonorRequestCycleType)
  cycleType!: DonorRequestCycleType

  @IsOptional()
  @CleanOptional()
  @IsObject()
  preferences?: {
    bloodGroup?: string
    ageRange?: { min: number; max: number }
    ethnicity?: string
    education?: string
  }

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  unitsRequested?: number = 1
}
