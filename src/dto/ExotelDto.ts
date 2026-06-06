import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { CleanOptional } from '../decorators'
import { Type } from 'class-transformer'

/**
 * Per-organization Exotel configuration. Embedded in OrganizationConfiguration.
 * `isEnabled = false` (or absent) hides the softphone UI on the frontend.
 */
export class ExotelConfigurationDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  customerId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  customerSecret!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  appId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  appSecret!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  accountSid!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  virtualNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  domain!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  integrationsBaseUrl!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  apiKey!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  apiToken!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  subdomain!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  webhookToken!: string

  @IsBoolean()
  @IsNotEmpty()
  isEnabled!: boolean
}

export class ExotelOutboundCallDto {
  @IsString()
  @IsNotEmpty()
  customerNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId!: string
}

export class ExotelAvailabilityDto {
  @IsBoolean()
  @IsNotEmpty()
  isAvailable!: boolean
}

export class ExotelCallLogDto {
  @IsOptional()
  @CleanOptional()
  @IsString()
  callStatus!: string

  @IsString()
  @IsNotEmpty()
  direction!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  sid!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  callId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  leadId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  patientId!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  description!: string

  @IsOptional()
  @CleanOptional()
  @Type(() => Number)
  callDuration!: number

  @IsOptional()
  @CleanOptional()
  @IsString()
  fromNumber!: string

  @IsOptional()
  @CleanOptional()
  @IsString()
  toNumber!: string
}
