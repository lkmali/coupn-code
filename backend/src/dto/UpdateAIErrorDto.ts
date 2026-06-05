import { IsOptional, IsBoolean, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class UpdateAIErrorDto {
  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isResolved?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  errorMessage?: string
}
