import { IsMongoId, IsNotEmpty } from 'class-validator'

export class CreatePaymentIntentDto {
  @IsMongoId()
  @IsNotEmpty()
  orderId!: string
}
