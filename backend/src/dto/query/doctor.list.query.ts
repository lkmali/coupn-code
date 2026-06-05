import { IsOptional, IsString, IsEnum, IsInt, Min, IsBoolean } from 'class-validator'
import { SortingOrder } from '../../typings'
import { CleanOptional } from '../../decorators'

export class DoctorsListDto {
  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  skip: number = 0

  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(1)
  limit: number = 10

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsEnum(SortingOrder, {
    message: 'OrderBy can only be ASC or DESC',
  })
  orderBy: string = SortingOrder.DESC

  @IsOptional()
  @CleanOptional()
  @IsString()
  sortBy: string = 'updatedAt'

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isActive?: boolean
}
