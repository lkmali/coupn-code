import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
  IsArray,
  IsDefined,
  ValidateNested,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class FolliclesDto {
  @IsNotEmpty()
  @IsString()
  left!: string

  @IsNotEmpty()
  @IsString()
  right!: string
}

export class DailyStimulationDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  day!: number

  @IsOptional()
  @CleanOptional()
  @IsArray()
  medications?: any[]

  @IsDefined()
  @ValidateNested()
  @Type(() => FolliclesDto)
  follicles!: FolliclesDto

  @IsDefined()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(30)
  endometriumThickness!: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20000)
  estradiol?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(200)
  lh?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  progesterone?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
