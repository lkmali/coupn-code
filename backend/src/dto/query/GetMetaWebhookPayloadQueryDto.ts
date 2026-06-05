import { IsOptional, IsString, IsInt, Min, Max, IsNumber } from 'class-validator'
import { CleanOptional } from '../../decorators'
import { Type } from 'class-transformer'

export class GetMetaWebhookPayloadQueryDto {
  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 25

  @IsOptional()
  @CleanOptional()
  @IsString()
  webhookType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  objectType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  processedStatus?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  messageType?: string
}

export class DeleteMetaWebhookPayloadQueryDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  webhookType?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  processedStatus?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  orgId?: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  daysOld?: number

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  hoursOld?: number
}
