import { IsOptional, IsNumber, IsString, Min } from 'class-validator'
import { CleanOptional } from '../decorators'

export class DeleteAIErrorDto {
  @IsOptional()
  @CleanOptional()
  @IsNumber()
  @Min(1)
  daysOld?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  @Min(1)
  hoursOld?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string
}
