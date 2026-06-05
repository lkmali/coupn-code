import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator'
import { CleanOptional } from '../decorators'

export class CreateWebhookRoutingDto {
  @IsString()
  @IsNotEmpty()
  mobileNumber!: string

  @IsString()
  @IsNotEmpty()
  appSecret!: string

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  routingUrl!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string
}

export class UpdateWebhookRoutingDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  appSecret?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  routingUrl?: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
