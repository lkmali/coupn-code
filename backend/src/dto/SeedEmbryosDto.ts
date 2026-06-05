import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class SeedEmbryosDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  count!: number

  @IsOptional()
  @CleanOptional()
  @IsIn(['IVF', 'ICSI', 'SPLIT'])
  fertilizationMethod?: 'IVF' | 'ICSI' | 'SPLIT'

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  fertilizationDate?: string
}
