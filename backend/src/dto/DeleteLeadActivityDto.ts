import { IsNumber, IsOptional, IsString, IsArray, Min } from 'class-validator'

export class DeleteLeadActivityDto {
  @IsString()
  @IsOptional()
  public id?: string

  @IsArray()
  @IsOptional()
  public ids?: string[]

  @IsString()
  @IsOptional()
  public leadId?: string

  @IsNumber()
  @IsOptional()
  @Min(1)
  public daysOld?: number

  @IsNumber()
  @IsOptional()
  @Min(1)
  public hoursOld?: number

  @IsString()
  @IsOptional()
  public orgId?: string
}
