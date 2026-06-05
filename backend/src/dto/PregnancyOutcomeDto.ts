import { IsNotEmpty, IsOptional, IsString, IsIn, IsDateString, IsNumber, IsArray } from 'class-validator'
import { CleanOptional } from '../decorators'

export class PregnancyOutcomeDto {
  @IsNotEmpty()
  @IsDateString()
  deliveryDate!: string

  @IsNotEmpty()
  @IsIn(['NORMAL', 'CESAREAN', 'ASSISTED'])
  deliveryType!: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  birthWeight?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  apgarScore?: number

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsString({ each: true })
  complications?: string[]
}
