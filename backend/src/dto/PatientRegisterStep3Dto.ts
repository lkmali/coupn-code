import { IsOptional, IsString, IsNumber, IsArray, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

class MaleLifestyleFactorsDto {
  @IsOptional() @CleanOptional() @IsString() alcoholConsumption?: string
  @IsOptional() @CleanOptional() @IsString() smoking?: string
  @IsOptional() @CleanOptional() @IsString() dietPattern?: string
  @IsOptional() @CleanOptional() @IsString() exerciseRoutine?: string
  @IsOptional() @CleanOptional() @IsString() occupationalHazards?: string
  @IsOptional() @CleanOptional() @IsString() stressLevel?: string
}

class MaleSexualHealthDto {
  @IsOptional() @CleanOptional() @IsString() erectileDysfunction?: string
  @IsOptional() @CleanOptional() @IsString() ejaculatoryIssues?: string
  @IsOptional() @CleanOptional() @IsString() libidoLevel?: string
  @IsOptional() @CleanOptional() @IsString() sexualSatisfaction?: string
}

class SemenAnalysisDto {
  @IsOptional() @CleanOptional() @IsDateString() testDate?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() volumeMl?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() countMillionPerMl?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() motilityPercent?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() normalMorphologyPercent?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() abstinenceDays?: number
  @IsOptional() @CleanOptional() @IsString() interpretation?: string
}

export class PatientRegisterStep3Dto {
  @IsOptional() @CleanOptional() @IsString() pastMedicalHistory?: string
  @IsOptional() @CleanOptional() @IsString() familyMedicalHistory?: string
  @IsOptional() @IsArray() @IsString({ each: true }) previousSurgeries?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) chronicConditions?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) allergies?: string[]
  @IsOptional() @CleanOptional() @Type(() => MaleLifestyleFactorsDto) lifestyleFactors?: MaleLifestyleFactorsDto
  @IsOptional() @CleanOptional() @Type(() => MaleSexualHealthDto) sexualHealthHistory?: MaleSexualHealthDto
  @IsOptional() @CleanOptional() @Type(() => SemenAnalysisDto) semenAnalysis?: SemenAnalysisDto
  @IsOptional() @IsArray() @IsString({ each: true }) currentMedications?: string[]
}
