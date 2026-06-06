import { IsMongoId, IsNotEmpty } from 'class-validator'

export class RefundPaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  orderId!: string
}
