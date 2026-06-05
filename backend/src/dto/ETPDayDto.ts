import { IsNotEmpty, IsOptional, IsString, IsDateString, IsBoolean, IsObject } from 'class-validator'
import { CleanOptional } from '../decorators'

/** Add or update a single day entry in an ETP cycle timeline. */
export class ETPDayDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsNotEmpty()
  @IsString()
  day!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  thickness?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  pattern?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  estradiol?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  progesterone?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  medication?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  colorFlow?: string

  // Follicle counts/sizes captured per day — right + left ovary.
  @IsOptional()
  @CleanOptional()
  @IsObject()
  follicle?: { right?: string; left?: string }

  @IsOptional()
  @CleanOptional()
  @IsString()
  follicleBloodFlow?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  lh?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  serumLh?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  trigger?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  remarks?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isDay0?: boolean
}
