import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator'

/**
 * Admin payload for the per-org Stripe configuration. Secret fields are optional
 * on update: omit/leave empty to keep the stored (encrypted) value unchanged.
 */
export class UpdateStripeConfigDto {
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean

  @IsOptional()
  @IsString()
  @Matches(/^pk_(test|live)_[A-Za-z0-9]+$/, { message: 'publishableKey must be a valid Stripe publishable key' })
  publishableKey?: string

  @IsOptional()
  @IsString()
  @Matches(/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/, { message: 'secretKey must be a valid Stripe secret/restricted key' })
  secretKey?: string

  @IsOptional()
  @IsString()
  @Matches(/^whsec_[A-Za-z0-9]+$/, { message: 'webhookSecret must be a valid Stripe webhook signing secret' })
  webhookSecret?: string

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'defaultCurrency must be a 3-letter ISO code' })
  defaultCurrency?: string

  @IsOptional()
  @IsString()
  accountId?: string
}
