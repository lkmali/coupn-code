import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class LutealSupportDto {
  @IsNotEmpty()
  @IsString()
  medication!: string

  @IsNotEmpty()
  @IsString()
  dosage!: string

  @IsNotEmpty()
  @IsDateString()
  startDate!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  route?: string

  @IsOptional()
  @CleanOptional()
  @IsDateString()
  endDate?: string
}
