import { IsNotEmpty, IsString, Matches, IsOptional, IsInt, Min, Max } from 'class-validator'

/**
 * Body for POST /subscriptions/checkout.
 *
 * The client only supplies a Stripe `priceId` (a recurring price created in the
 * org's Stripe dashboard, e.g. `price_123…`). Everything else — customer,
 * currency, amount — comes from Stripe's price object, so the client can never
 * tamper with what is billed.
 */
export class CreateSubscriptionCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^price_[A-Za-z0-9]+$/, { message: 'priceId must be a Stripe price id (price_…)' })
  priceId!: string

  /** Optional free-trial length in days (Stripe allows 1–730). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(730)
  trialPeriodDays?: number
}
