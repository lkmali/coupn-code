import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator'

/**
 * Admin payload for editing an existing product. Every field is optional: omit a
 * field to leave its stored value unchanged.
 */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  /** Amount in the smallest currency unit (e.g. cents). */
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
