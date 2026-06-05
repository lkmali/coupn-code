import { IsOptional, IsString, IsEnum, IsInt, Min, IsBoolean } from 'class-validator'
import { Role, SortingOrder } from '../../typings'
import { CleanOptional } from '../../decorators'

export class UserListQuery {
  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  skip: number = 0


  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(1)
  pageNumber: number = 1

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
  orderBy?: string = SortingOrder.DESC

  @IsOptional()
  @CleanOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @IsOptional()
  @CleanOptional()
  @IsString()
  search?: string

  @IsOptional()
  @CleanOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @CleanOptional()
  @IsString()
  @IsEnum(Role, {
    message: 'Role can only be ADMIN, USER, or other defined roles',
  })
  role?: string
}
