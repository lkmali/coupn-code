import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { HistoryDto } from './HistoryDto'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class PatientsHistoryDto {
  @IsString()
  public patientId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public doctorId!: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Each reportId must be an integer' })
  @Min(1, { each: true, message: 'Each reportId must be greater than 0' })
  public reportIds!: string[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  public appointmentId!: string

  @IsOptional()
  @CleanOptional()
  @IsArray()
  @ValidateNested({ each: true }) // validates each medicine object
  @Type(() => HistoryDto) // transforms plain object -> MedicineDto
  public history!: HistoryDto[]

  @IsOptional()
  @CleanOptional()
  @IsString()
  public condition!: string
}
