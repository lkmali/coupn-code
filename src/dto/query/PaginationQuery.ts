import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator'
import { SortingOrder } from '../../typings'
import { CleanOptional } from '../../decorators'

export class PaginationQuery {
  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  skip: number = 0

  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(1)
  limit: number = 25

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
}
