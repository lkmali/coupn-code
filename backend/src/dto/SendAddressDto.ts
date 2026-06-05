import { IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class SendAddressDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  referenceId?: string
}
