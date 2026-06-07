import { ProductService } from '../../product.service'
import { CopilotTool } from './types'

const productService = ProductService.Instance

/**
 * Read-only product-catalog tools. These back questions like "what plans do we
 * sell?" or "how much is product X?".
 */
export const productTools: CopilotTool[] = [
  {
    definition: {
      type: 'function',
      function: {
        name: 'list_products',
        description: 'List the active product catalog (name, price, currency) for the current organization.',
        parameters: { type: 'object', properties: {} },
      },
    },
    handler: async (_args, ctx) => productService.listProducts(String(ctx.user.orgId)),
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_product',
        description: 'Get a single active product by id, including its price and currency.',
        parameters: {
          type: 'object',
          properties: {
            productId: { type: 'string', description: 'The product id (Mongo ObjectId).' },
          },
          required: ['productId'],
        },
      },
    },
    handler: async (args, ctx) =>
      productService.getActiveProductOrThrow(String(ctx.user.orgId), args.productId),
  },
]
