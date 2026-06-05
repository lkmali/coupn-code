import { IsNotEmpty, IsOptional, IsString, IsDateString, IsNumber, IsObject, IsArray } from 'class-validator'
import { CleanOptional } from '../decorators'

export class AddMonitoringRecordDto {
  @IsNotEmpty()
  @IsDateString()
  date!: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  endometriumThickness?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  endometriumPattern?: string

  @IsOptional()
  @CleanOptional()
  @IsObject()
  follicles?: {
    left: number[]
    right: number[]
  }

  @IsOptional()
  @CleanOptional()
  @IsString()
  follicularFlow?: string

  // Figma splits flow/leading size per ovary; all optional so legacy
  // clients sending only `follicularFlow` keep working.
  @IsOptional()
  @CleanOptional()
  @IsString()
  rightFollicularFlow?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  leftFollicularFlow?: string

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  leadingFollicleSize?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  rightFollicularLeading?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  leftFollicularLeading?: number

  // `drug` may arrive as either a single string (legacy records) or an
  // array of strings (ChipInput in the new monitoring form). No strict
  // type validator — the service stores whatever shape comes in, and the
  // schema for `monitoringRecords` is Mixed.
  @IsOptional()
  @CleanOptional()
  drug?: string | string[]

  @IsOptional()
  @CleanOptional()
  @IsArray()
  medications?: any[]

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  estradiol?: number

  @IsOptional()
  @CleanOptional()
  @IsNumber()
  lh?: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  notes?: string
}
