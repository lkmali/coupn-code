import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class FulfillRequestDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
