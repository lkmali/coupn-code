import { IsOptional, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { CleanOptional } from '../decorators'

export class TimelineQueryDto {
  @IsOptional() @CleanOptional() @IsString() cycleId?: string
  @IsOptional() @CleanOptional() @IsString() treatmentPlanId?: string
  @IsOptional() @CleanOptional() @IsString() status?: string
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() page?: number
  @IsOptional() @CleanOptional() @Type(() => Number) @IsNumber() limit?: number
}

export class UpdateTimelineStatusDto {
  @IsString() status!: string
}
