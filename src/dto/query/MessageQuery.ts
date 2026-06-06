import { IsOptional, IsInt, Min } from 'class-validator'
import { CleanOptional } from '../../decorators'

export class MessageQuery {
  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  pageNumber: number = 0

  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(1)
  limit: number = 30

  @IsOptional()
  @CleanOptional()
  @IsInt()
  @Min(0)
  skip?: number=0
}
