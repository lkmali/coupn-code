import { Request } from 'express'
import { AuthenticationStrategy } from './authentication.strategies'
import { unauthorized, badRequest } from '../utils'
import { StripeConfigService, StripeClientService } from '../service/stripe'
import { AuditLogService } from '../service/auditLog.service'
import { AuditAction } from '../typings'
import { LoggerProvider } from '../provider/logger.provider'

const loggerProvider = LoggerProvider.Instance

/**
 * Verifies the Stripe webhook signature for a specific org and attaches the
 * verified event to the request (`request.stripeEvent`). The per-org webhook
 * signing secret is read (decrypted) from the configuration DB.
 *
 * Route shape: POST /api/webhook/stripe/:orgId
 */
export class StripeWebhookStrategy implements AuthenticationStrategy {
  async authenticate(request: Request): Promise<any> {
    const orgId = this.getOrgId(request)
    if (!orgId) {
      throw badRequest('orgId not found in webhook URL')
    }

    const signature = request.headers['stripe-signature'] as string | undefined
    if (!signature) {
      await this.auditFailure(orgId, 'missing_signature', request)
      throw unauthorized('Missing Stripe signature')
    }

    const config = await StripeConfigService.Instance.getDecryptedConfig(orgId)
    if (!config || !config.webhookSecret || !config.secretKey) {
      await this.auditFailure(orgId, 'stripe_not_configured', request)
      throw unauthorized('Stripe webhook is not configured for this organization')
    }

    // Raw body is captured by the express.json `verify` hook in index.ts.
    const rawBody = (request as any).rawBody
    if (!rawBody) {
      throw badRequest('Raw request body unavailable for signature verification')
    }

    const stripe = StripeClientService.Instance.fromSecretKey(config.secretKey)
    try {
      const event = stripe.webhooks.constructEvent(rawBody, signature, config.webhookSecret)
      // Hand the verified event to the controller.
      ;(request as any).stripeEvent = event
      return {
        orgId,
        userId: orgId,
        sessionId: event.id,
        roles: [],
        isActive: true,
      }
    } catch (error: any) {
      await this.auditFailure(orgId, 'signature_verification_failed', request, error.message)
      loggerProvider.logger.warn('stripe_webhook_signature_invalid', { orgId, error: error.message })
      throw unauthorized('Invalid Stripe signature')
    }
  }

  private getOrgId(request: Request): string | null {
    const match = request.originalUrl.match(/\/webhook\/stripe\/([^/?]+)/)
    return match?.[1] ?? null
  }

  private async auditFailure(orgId: string, reason: string, request: Request, detail?: string): Promise<void> {
    await AuditLogService.Instance.log({
      orgId,
      action: AuditAction.AUTH_FAILURE,
      resourceType: 'StripeWebhook',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      payload: { reason, detail },
    })
  }
}
