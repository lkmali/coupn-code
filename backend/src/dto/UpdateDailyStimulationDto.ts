import {
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'
import { FolliclesDto } from './DailyStimulationDto'

/** Partial update for a single daily stimulation record targeted by _id. */
export class UpdateDailyStimulationDto {
  @IsOptional()
  @CleanOptional()
  @IsDateString()
  date?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  day?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  type?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => String)
  @IsString()
  rightOvary?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => String)
  @IsString()
  leftOvary?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(30)
  endometriumThickness?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => String)
  @IsString()
  hmg?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => String)
  @IsString()
  fsh?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => String)
  @IsString()
  antagonist?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => String)
  @IsString()
  hcg?: string

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
  @IsArray()
  medications?: any[]

  @IsOptional()
  @CleanOptional()
  @ValidateNested()
  @Type(() => FolliclesDto)
  follicles?: FolliclesDto

  @IsOptional()
  @CleanOptional()
  @IsString()
  videoKeyId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  videoFileName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  remarks?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
