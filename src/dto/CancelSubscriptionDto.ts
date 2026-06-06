import { IsBoolean, IsOptional } from 'class-validator'

/**
 * Body for POST /subscriptions/:id/cancel.
 *
 * By default a subscription is canceled at the end of the current billing period
 * (the customer keeps access until then). Set `immediately: true` to cancel right
 * away.
 */
export class CancelSubscriptionDto {
  @IsOptional()
  @IsBoolean()
  immediately?: boolean
}
