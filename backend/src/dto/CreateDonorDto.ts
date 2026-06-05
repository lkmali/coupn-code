import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsObject } from 'class-validator'
import { CleanOptional } from '../decorators'

export enum DonorType {
  SPERM = 'SPERM',
  OVUM = 'OVUM',
  EMBRYO = 'EMBRYO',
}

export class CreateDonorDto {
  @IsNotEmpty()
  @IsEnum(DonorType)
  donorType!: DonorType

  @IsNotEmpty()
  @IsString()
  realName!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  anonymousName?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  age?: number

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
  ethnicity?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  height?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  weight?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  education?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  occupation?: string

  @IsOptional()
  @CleanOptional()
  @IsObject()
  medicalHistory?: Record<string, any>
}
