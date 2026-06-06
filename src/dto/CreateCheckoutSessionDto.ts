import { IsMongoId, IsNotEmpty } from 'class-validator'

/**
 * Body for POST /payments/create-checkout-session. Like the PaymentIntent flow,
 * the amount is never trusted from the client — it is derived from the order
 * (which was priced server-side from the product).
 */
export class CreateCheckoutSessionDto {
  @IsMongoId()
  @IsNotEmpty()
  orderId!: string
}
