import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class LabTestQueryDto {
  @IsOptional() @CleanOptional() @IsString() status?: string
  @IsOptional() @CleanOptional() @IsString() category?: string
  @IsOptional() @CleanOptional() @IsString() patientId?: string
  @IsOptional() @CleanOptional() @IsString() search?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() skip?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() limit?: number
}
