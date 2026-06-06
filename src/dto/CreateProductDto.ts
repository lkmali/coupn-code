import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  /** Amount in the smallest currency unit (e.g. cents). */
  @IsInt()
  @Min(0)
  amount!: number

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string
}
