import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class DeactivateLeadRequest {
  @IsString()
  @IsNotEmpty()
  public reason!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  public others!: string
}
