import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreateAdAssignmentDto {
  @IsString()
  @IsNotEmpty()
  adId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  adName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsString()
  @IsNotEmpty()
  assignToUserId!: string
}

export class UpdateAdAssignmentDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  adName?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  platform?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  assignToUserId?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
