import { JsonController, Post, Get, Body } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { StripeConfigService } from '../service'
import { Authorize, CurrentUser } from '../decorators'
import { Role, UserProfile } from '../typings'
import { UpdateStripeConfigDto } from '../dto'

/**
 * Per-org Stripe configuration, entered from the admin UI and stored (with
 * secrets encrypted) in the configuration DB. Secret values are never returned.
 */
@JsonController('/stripe')
export class StripeConfigController {
  private stripeConfigService = StripeConfigService.Instance

  @Get('/config')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Get the org Stripe configuration (admin)',
    tags: ['Stripe Configuration'],
    description: 'Returns a masked view of the Stripe configuration. Secret key and webhook secret are never returned — only whether they are configured.',
  })
  async getConfig(@CurrentUser() user: UserProfile) {
    const data = await this.stripeConfigService.getConfigView(user.orgId)
    return { success: true, data }
  }

  @Post('/config')
  @Authorize([Role.ADMIN])
  @OpenAPI({
    summary: 'Create/update the org Stripe configuration (admin)',
    tags: ['Stripe Configuration'],
    description: 'Stores the publishable key, secret key and webhook secret for this org. Secrets are encrypted at rest. Empty secret fields are left unchanged.',
    requestBody: {
      content: {
        'application/json': {
          example: {
            isEnabled: true,
            publishableKey: 'pk_live_xxx',
            secretKey: 'sk_live_xxx',
            webhookSecret: 'whsec_xxx',
            defaultCurrency: 'usd',
          },
        },
      },
    },
  })
  async updateConfig(@Body() body: UpdateStripeConfigDto, @CurrentUser() user: UserProfile) {
    const data = await this.stripeConfigService.updateConfig(user.orgId, body, user)
    return { success: true, data }
  }

  @Get('/publishable-key')
  @OpenAPI({
    summary: 'Get the org Stripe publishable key',
    tags: ['Stripe Configuration'],
    description: 'Returns the publishable key (safe for the frontend) so the UI can initialize Stripe.js.',
  })
  async getPublishableKey(@CurrentUser() user: UserProfile) {
    const view = await this.stripeConfigService.getConfigView(user.orgId)
    return {
      success: true,
      data: { publishableKey: view?.publishableKey, isEnabled: Boolean(view?.isEnabled) },
    }
  }
}
