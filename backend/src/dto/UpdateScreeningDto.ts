import { IsNotEmpty, IsOptional, IsString, IsEnum, IsObject } from 'class-validator'
import { CleanOptional } from '../decorators'

export enum ScreeningStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  CLEARED = 'CLEARED',
  REJECTED = 'REJECTED',
}

export class UpdateScreeningDto {
  @IsNotEmpty()
  @IsEnum(ScreeningStatus)
  status!: ScreeningStatus

  @IsOptional()
  @CleanOptional()
  @IsObject()
  hivTest?: { date: string; result: string }

  @IsOptional()
  @CleanOptional()
  @IsObject()
  hepatitisB?: { date: string; result: string }

  @IsOptional()
  @CleanOptional()
  @IsObject()
  hepatitisC?: { date: string; result: string }

  @IsOptional()
  @CleanOptional()
  @IsObject()
  syphilis?: { date: string; result: string }

  @IsOptional()
  @CleanOptional()
  @IsObject()
  karyotype?: { date: string; result: string }

  @IsOptional()
  @CleanOptional()
  @IsObject()
  cmv?: { date: string; result: string }

  @IsOptional()
  @CleanOptional()
  @IsObject()
  semenAnalysis?: Record<string, any>

  @IsOptional()
  @CleanOptional()
  @IsObject()
  amh?: Record<string, any>

  @IsOptional()
  @CleanOptional()
  @IsObject()
  antralFollicleCount?: Record<string, any>

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
