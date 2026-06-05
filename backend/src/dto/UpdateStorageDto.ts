import { IsOptional, IsNumber, IsObject } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdateStorageDto {
  @IsOptional()
  @CleanOptional()
  @IsNumber()
  totalUnits?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  availableUnits?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  usedUnits?: number

  @IsOptional()
  @CleanOptional()
  @IsObject()
  tankLocation?: {
    tank: string
    rack: string
    box: string
    position: string
  }
}
