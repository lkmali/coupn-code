import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class TreatmentTypeStageDto {
  @IsNumber() @IsNotEmpty() stageNumber!: number
  @IsString() @IsNotEmpty() name!: string
  @IsOptional() @CleanOptional() @IsString() description?: string
}

export class CreateTreatmentTypeDto {
  @IsString() @IsNotEmpty() name!: string
  @IsString() @IsNotEmpty() code!: string
  @IsOptional() @CleanOptional() @IsString() description?: string
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TreatmentTypeStageDto) stages?: TreatmentTypeStageDto[]
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() maxCycles?: number
}

export class TreatmentTypeQueryDto {
  @IsOptional() @CleanOptional() @IsString() search?: string
  @IsOptional() @CleanOptional() @Type(() => Boolean) @IsBoolean() isActive?: boolean
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() offset?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() limit?: number
}
