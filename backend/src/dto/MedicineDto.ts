import { IsString, IsNumber, Min } from 'class-validator'

export class MedicineDto {
  @IsString({ message: 'Medicine name must be a string' })
  public name!: string

  @IsString({ message: 'Medicine description must be a string' })
  public description!: string

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  public price!: number
}
