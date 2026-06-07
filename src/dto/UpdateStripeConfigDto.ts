import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

/**
 * One curated subscription plan shown on the subscriber page. `priceId` must be
 * a recurring Stripe price (price_…) in the org's account — it is what checkout
 * charges against; the remaining fields are display metadata.
 */
export class SubscriptionProductDto {
  @IsString()
  @Matches(/^price_[A-Za-z0-9]+$/, { message: 'priceId must be a valid Stripe price id (price_…)' })
  priceId!: string

  @IsString()
  @Length(1, 120)
  name!: string

  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string

  @IsOptional()
  @IsInt({ message: 'amount must be an integer in the smallest currency unit (e.g. cents)' })
  @Min(0)
  amount?: number

  @IsOptional()
  @IsString()
  @Length(3, 3, { message: 'currency must be a 3-letter ISO code' })
  currency?: string

  @IsOptional()
  @IsIn(['day', 'week', 'month', 'year'])
  interval?: 'day' | 'week' | 'month' | 'year'

  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalCount?: number

  @IsOptional()
  @IsBoolean()
  featured?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

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

  // Curated subscriber-page plans. Sent as the full list (replaces the stored
  // one) so admins can add/remove/reorder; omit to leave the stored list intact.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionProductDto)
  subscriptionProducts?: SubscriptionProductDto[]
}
