import { IsNotEmpty, IsOptional, IsDateString, IsNumber, IsString, IsIn, IsArray } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class EmbryologyDto {
  @IsNotEmpty()
  @IsIn(['IVF', 'ICSI', 'SPLIT'])
  fertilizationMethod!: string

  @IsNotEmpty()
  @IsDateString()
  fertilizationDate!: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  totalFertilized?: number

  @IsOptional()
  @CleanOptional()
  @IsArray()
  embryos?: any[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
