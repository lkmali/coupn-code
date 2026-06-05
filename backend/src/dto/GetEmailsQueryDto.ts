import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

export class GetEmailsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxResults?: number

  @IsOptional()
  @IsString()
  pageToken?: string

  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsString()
  @IsIn(['emailDate', 'from', 'subject', 'isRead', 'processingStatus'])
  sortBy?: string

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'
}
