import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, IsIn } from 'class-validator'
import { CleanOptional } from '../decorators'

export class IUIOutcomeDto {
  @IsNotEmpty()
  @IsDateString()
  betaHcgDate!: string

  @IsNotEmpty()
  @IsNumber()
  betaHcgValue!: number

  @IsNotEmpty()
  @IsIn(['POSITIVE', 'NEGATIVE', 'CHEMICAL_PREGNANCY'])
  result!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
