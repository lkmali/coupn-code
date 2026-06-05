import { IsOptional, IsString, IsNumber, IsArray, IsDateString } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

class MenstrualHistoryDto {
  @IsOptional() @CleanOptional() @IsDateString() lastMenstrualPeriod?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() cycleDuration?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() cycleLength?: number
  @IsOptional() @CleanOptional() @IsString() cycleRegularity?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() menarcheAge?: number
  @IsOptional() @CleanOptional() @IsString() menstrualFlow?: string
  @IsOptional() @CleanOptional() @IsString() dysmenorrhea?: string
}

class AMHReportDto {
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() amhValue?: number
  @IsOptional() @CleanOptional() @IsDateString() testDate?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() afcRightOvary?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() afcLeftOvary?: number
  @IsOptional() @CleanOptional() @IsString() interpretation?: string
}

class PregnancyHistoryDto {
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() gravida?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() para?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() abortion?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() living?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() ectopic?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() molar?: number
  @IsOptional() @CleanOptional() @IsString() details?: string
}

class GeneralExaminationDto {
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() heightCm?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() weightKg?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() bmi?: number
  @IsOptional() @CleanOptional() @IsString() bloodPressure?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() pulseBpm?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() temperatureF?: number
}

class SystematicExaminationDto {
  @IsOptional() @CleanOptional() @IsString() cvs?: string
  @IsOptional() @CleanOptional() @IsString() rs?: string
  @IsOptional() @CleanOptional() @IsString() abdomen?: string
  @IsOptional() @CleanOptional() @IsString() pallor?: string
  @IsOptional() @CleanOptional() @IsString() icterus?: string
  @IsOptional() @CleanOptional() @IsString() edema?: string
  @IsOptional() @CleanOptional() @IsString() breast?: string
  @IsOptional() @CleanOptional() @IsString() thyroid?: string
}

class FemaleLifestyleFactorsDto {
  @IsOptional() @CleanOptional() @IsString() alcoholConsumption?: string
  @IsOptional() @CleanOptional() @IsString() smoking?: string
  @IsOptional() @CleanOptional() @IsString() dietPattern?: string
  @IsOptional() @CleanOptional() @IsString() exerciseRoutine?: string
  @IsOptional() @CleanOptional() @IsString() stressLevel?: string
  @IsOptional() @CleanOptional() @IsString() sleepQuality?: string
}

class FemaleSexualHealthDto {
  @IsOptional() @CleanOptional() @IsString() sexuallyActive?: string
  @IsOptional() @CleanOptional() @IsString() frequencyOfIntercourse?: string
  @IsOptional() @CleanOptional() @IsString() sexualDysfunction?: string
  @IsOptional() @CleanOptional() @IsString() painDuringIntercourse?: string
  @IsOptional() @CleanOptional() @IsString() contraceptionHistory?: string
}

export class PatientRegisterStep2Dto {
  @IsOptional() @CleanOptional() @Type(() => MenstrualHistoryDto) menstrualHistory?: MenstrualHistoryDto
  @IsOptional() @CleanOptional() @Type(() => AMHReportDto) amhReport?: AMHReportDto
  @IsOptional() @CleanOptional() @Type(() => PregnancyHistoryDto) pregnancyHistory?: PregnancyHistoryDto
  @IsOptional() @CleanOptional() @IsString() pastMedicalHistory?: string
  @IsOptional() @CleanOptional() @IsString() familyMedicalHistory?: string
  @IsOptional() @IsArray() @IsString({ each: true }) previousSurgeries?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) chronicConditions?: string[]
  @IsOptional() @CleanOptional() @Type(() => GeneralExaminationDto) generalExamination?: GeneralExaminationDto
  @IsOptional() @CleanOptional() @Type(() => SystematicExaminationDto) systematicExamination?: SystematicExaminationDto
  @IsOptional() @IsArray() @IsString({ each: true }) currentMedications?: string[]
  @IsOptional() @IsArray() @IsString({ each: true }) allergies?: string[]
  @IsOptional() @CleanOptional() @Type(() => FemaleLifestyleFactorsDto) lifestyleFactors?: FemaleLifestyleFactorsDto
  @IsOptional() @CleanOptional() @Type(() => FemaleSexualHealthDto) sexualHealthHistory?: FemaleSexualHealthDto
}
