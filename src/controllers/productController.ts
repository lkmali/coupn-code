import { JsonController, Post, Put, Get, Body, Param } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { ProductService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import { CreateProductDto, UpdateProductDto } from '../dto'

/**
 * Minimal product catalog backing server-side order pricing. Listing requires
 * auth; creating requires admin.
 */
@JsonController('/products')
export class ProductController {
  private productService = ProductService.Instance

  @Get()
  @OpenAPI({ summary: 'List products', tags: ['Payments'] })
  async list(@CurrentUser() user: UserProfile) {
    const data = await this.productService.listProducts(user.orgId)
    return { success: true, data }
  }

  @Post()
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Create a product (admin)',
    tags: ['Payments'],
    description: 'amount is in the smallest currency unit (e.g. cents).',
  })
  async create(@Body() body: CreateProductDto, @CurrentUser() user: UserProfile) {
    const data = await this.productService.createProduct(user.orgId, body, user)
    return { success: true, data }
  }

  @Put('/:id')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Update a product (admin)',
    tags: ['Payments'],
    description: 'Edit an existing product. Only supplied fields change; the name must stay unique within the org. amount is in the smallest currency unit (e.g. cents).',
    responses: {
      '200': { description: 'Product updated' },
      '400': { description: 'Validation error / duplicate product name' },
      '404': { description: 'Product not found' },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser() user: UserProfile,
  ) {
    const data = await this.productService.updateProduct(user.orgId, id, body, user)
    return { success: true, data }
  }
}
