import { IsBoolean, IsNotEmpty, IsString } from 'class-validator'

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  public permissionId!: string

  @IsBoolean()
  @IsNotEmpty()
  public isActive!: boolean
}

// Use this DTO for accepting raw array: [{"permissionId":1,"isActive":true}, ...]
// In your controller, use: @Body(new ParseArrayPipe({ items: PermissionDto }))
export { PermissionDto as UpdatePermissionsArrayDto }
