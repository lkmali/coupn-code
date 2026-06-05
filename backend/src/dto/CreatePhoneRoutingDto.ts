import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreatePhoneRoutingDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string

  @IsString()
  @IsNotEmpty()
  centerName!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsString()
  @IsNotEmpty()
  assignToUserId!: string
}

export class UpdatePhoneRoutingDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  centerName?: string

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
