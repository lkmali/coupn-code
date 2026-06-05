import { IsNotEmpty, IsOptional, IsDateString, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'

export class FreezeEmbryoDto {
  @IsNotEmpty()
  @IsString()
  embryoId!: string

  @IsNotEmpty()
  @IsDateString()
  freezeDate!: string

  @IsOptional()
  @CleanOptional()
  tankLocation?: { tank?: string; canister?: string; cane?: string; position?: string }

  @IsOptional()
  @CleanOptional()
  @IsString()
  grade?: string
}
