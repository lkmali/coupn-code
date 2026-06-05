import { Type } from 'class-transformer'
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator'
import { MedicineDto } from './MedicineDto'
import { CleanOptional } from '../decorators'

export class HistoryDto {
  @IsString({ message: 'Condition must be a string' })
  public condition!: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true }) // validates each medicine object
  @Type(() => MedicineDto) // transforms plain object -> MedicineDto
  public medicines!: MedicineDto[]

  @IsOptional()
  @CleanOptional()
  @IsString({ message: 'Notes must be a string' })
  public notes?: string
}
