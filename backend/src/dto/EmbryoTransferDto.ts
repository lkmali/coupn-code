import { IsNotEmpty, IsOptional, IsDateString, IsNumber, IsString, IsIn, IsArray, IsBoolean } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class EmbryoTransferDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  transferDay!: number

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  embryosTransferred!: number

  @IsNotEmpty()
  @IsArray()
  embryoIds!: string[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  catheterType?: string

  @IsOptional()
  @CleanOptional()
  @IsIn(['EASY', 'MODERATE', 'DIFFICULT'])
  difficulty?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  endometriumThickness?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  endometriumPattern?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  performedBy?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  ultrasoundGuided?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
