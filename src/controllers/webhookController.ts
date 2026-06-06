import { JsonController, Post, Get, Req, Res, Param } from 'routing-controllers'
import { Authentication } from '../decorators'
import { Request, Response } from 'express'
import { CurrentUser } from '../decorators'
import { AuthenticationStrategyType, IOrganizationConfiguration, StripeEvent } from '../typings'
import { SocialService } from '../service/social.service'
import { PaymentService } from '../service'
import { LoggerProvider } from '../provider/logger.provider'
import { Messages } from '../constants'
import { OpenAPI } from 'routing-controllers-openapi'
const loggerProvider = LoggerProvider.Instance
@JsonController('/webhook')
export class WebhookController {
  @Post('/meta/:orgId')
  @Authentication(AuthenticationStrategyType.FACEBOOK_AUTH)
  @OpenAPI({
    summary: 'Receive Meta webhook for a specific organization',
    tags: ['Webhook'],
    description: 'Receives incoming webhook events from Meta (WhatsApp Business API and Facebook Lead Gen) for a specific organization. Authenticated via Facebook webhook verification. Processes messages, status updates, and lead form submissions.',
    parameters: [
      { name: 'orgId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID to route the webhook to', example: '669960860c8379e64aea586a' },
    ],
    requestBody: {
      content: {
        'application/json': {
          example: {
            object: 'whatsapp_business_account',
            entry: [
              {
                id: '123456789',
                changes: [
                  {
                    value: {
                      messaging_product: 'whatsapp',
                      metadata: { display_phone_number: '+919876543210', phone_number_id: '111222333' },
                      messages: [
                        {
                          from: '919876543210',
                          id: 'wamid.abc123',
                          timestamp: '1712217600',
                          text: { body: 'Hello, I need an appointment' },
                          type: 'text',
                        },
                      ],
                    },
                    field: 'messages',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Webhook processed successfully',
        content: { 'application/json': { example: { message: 'Success' } } },
      },
      '401': { description: 'Unauthorized - Facebook webhook verification failed' },
    },
  })
  async facebookWebhookPostForOrigination(
    @Param('orgId') orgId: string,
    @Req() request: Request,
    @Res() res: Response,
    @CurrentUser() userProfile: IOrganizationConfiguration,
  ) {
    const trackingId = `webhook_${orgId}_${Date.now()}`
    loggerProvider.logger.info(`[${trackingId}] Webhook received`, {
      trackingId,
      orgId,
      endpoint: `/webhook/facebook/${orgId}`,
    })
    // Process webhook dynamically based on type (WhatsApp messages or Facebook Lead Gen)
    await SocialService.Instance.processWebhook(request.body, orgId, userProfile, trackingId)
    loggerProvider.logger.info(`[${trackingId}] Webhook processed successfully`, { trackingId, orgId })
    return res.status(200).send({ message: Messages.SUCCESS.SUCCESS })
  }

  @Get('/meta/:orgId')
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  @OpenAPI({
    summary: 'Verify Meta webhook subscription for a specific organization',
    tags: ['Webhook'],
    description: 'Handles the Meta webhook verification challenge for a specific organization. Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge query parameters during webhook subscription setup. Returns the challenge token to confirm subscription.',
    parameters: [
      { name: 'orgId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID', example: '669960860c8379e64aea586a' },
      { name: 'hub.mode', in: 'query', schema: { type: 'string' }, description: 'Verification mode (subscribe)' },
      { name: 'hub.verify_token', in: 'query', schema: { type: 'string' }, description: 'Token to verify against configured secret' },
      { name: 'hub.challenge', in: 'query', schema: { type: 'string' }, description: 'Challenge string to echo back' },
    ],
    responses: {
      '200': {
        description: 'Challenge token echoed back to confirm subscription',
        content: { 'text/plain': { example: 'challenge_token_abc123' } },
      },
    },
  })
  async facebookWebhookGETForOrigination(@Param('orgId') orgId: string, @Req() request: Request, @Res() res: Response) {
    console.log('orgId', orgId)
    // const mode = request.query['hub.mode']
    // const token = request.query['hub.verify_token']
    const challenge = request.query['hub.challenge']
    return res.status(200).send(challenge)
  }




  @Post('/meta')
  @Authentication(AuthenticationStrategyType.FACEBOOK_AUTH)
  @OpenAPI({
    summary: 'Receive Meta webhook for all organizations',
    tags: ['Webhook'],
    description: 'Receives incoming webhook events from Meta (WhatsApp Business API and Facebook Lead Gen) using a shared webhook URL. The organization is resolved from the Facebook auth context. Processes messages, status updates, and lead form submissions.',
    requestBody: {
      content: {
        'application/json': {
          example: {
            object: 'whatsapp_business_account',
            entry: [
              {
                id: '123456789',
                changes: [
                  {
                    value: {
                      messaging_product: 'whatsapp',
                      metadata: { display_phone_number: '+919876543210', phone_number_id: '111222333' },
                      messages: [
                        {
                          from: '919876543210',
                          id: 'wamid.def456',
                          timestamp: '1712217600',
                          text: { body: 'I want to book a consultation' },
                          type: 'text',
                        },
                      ],
                    },
                    field: 'messages',
                  },
                ],
              },
            ],
          },
        },
      },
    },
    responses: {
      '200': {
        description: 'Webhook processed successfully',
        content: { 'application/json': { example: { message: 'Success' } } },
      },
      '401': { description: 'Unauthorized - Facebook webhook verification failed' },
    },
  })
  async facebookWebhookPostForAllOrigination(
    @Req() request: Request,
    @Res() res: Response,
    @CurrentUser() userProfile: IOrganizationConfiguration,
  ) {
    const trackingId = `webhook_${userProfile.orgId}_${Date.now()}`
    loggerProvider.logger.info(`[${trackingId}] Webhook received`, {
      trackingId,
      orgId:userProfile.orgId,
      endpoint: `/webhook/facebook/${userProfile.orgId}`,
    })
    // Process webhook dynamically based on type (WhatsApp messages or Facebook Lead Gen)
    await SocialService.Instance.processWebhook(request.body, userProfile.orgId, userProfile, trackingId)
    loggerProvider.logger.info(`[${trackingId}] Webhook  processed successfully`, { trackingId, orgId:userProfile.orgId })
    return res.status(200).send({ message: Messages.SUCCESS.SUCCESS })
  }

  @Post('/stripe/:orgId')
  @Authentication(AuthenticationStrategyType.STRIPE_WEBHOOK)
  @OpenAPI({
    summary: 'Receive Stripe webhook events for an organization',
    tags: ['Webhook'],
    description:
      'Receives Stripe events for a specific org. The signature is verified by the Stripe webhook strategy using the per-org webhook secret stored in the configuration DB. Handlers (all idempotent): payment_intent.succeeded/payment_failed & charge.refunded (order/payment reconciliation), checkout.session.completed (hosted checkout), customer.subscription.created/updated/deleted (subscription mirror), invoice.paid/payment_failed (billing history), account.updated (Connect capabilities) and payout.paid/failed (payout tracking). The frontend never marks an order paid — only this webhook does.',
    parameters: [
      { name: 'orgId', in: 'path', required: true, schema: { type: 'string' }, description: 'Organization ID', example: '669960860c8379e64aea586a' },
    ],
    responses: {
      '200': { description: 'Event received', content: { 'application/json': { example: { received: true } } } },
      '401': { description: 'Invalid or missing Stripe signature' },
    },
  })
  async stripeWebhook(@Param('orgId') orgId: string, @Req() request: Request, @Res() res: Response) {
    // Signature already verified by StripeWebhookStrategy, which attached the
    // parsed event to the request.
    const event = (request as any).stripeEvent as StripeEvent
    const trackingId = `stripe_webhook_${orgId}_${event?.id ?? 'unknown'}`
    loggerProvider.logger.info(`[${trackingId}] Stripe webhook received`, { orgId, type: event?.type })
    await PaymentService.Instance.processWebhookEvent(orgId, event, {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    })
    loggerProvider.logger.info(`[${trackingId}] Stripe webhook processed`, { orgId, type: event?.type })
    return res.status(200).send({ received: true })
  }

  @Get('/meta')
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  @OpenAPI({
    summary: 'Verify Meta webhook subscription (shared URL)',
    tags: ['Webhook'],
    description: 'Handles the Meta webhook verification challenge for the shared webhook URL. Meta sends a GET request with hub.mode, hub.verify_token, and hub.challenge query parameters during webhook subscription setup. Returns the challenge token to confirm subscription.',
    parameters: [
      { name: 'hub.mode', in: 'query', schema: { type: 'string' }, description: 'Verification mode (subscribe)' },
      { name: 'hub.verify_token', in: 'query', schema: { type: 'string' }, description: 'Token to verify against configured secret' },
      { name: 'hub.challenge', in: 'query', schema: { type: 'string' }, description: 'Challenge string to echo back' },
    ],
    responses: {
      '200': {
        description: 'Challenge token echoed back to confirm subscription',
        content: { 'text/plain': { example: 'challenge_token_abc123' } },
      },
    },
  })
  async facebookWebhookGETForAllOrigination(@Req() request: Request, @Res() res: Response) {
    // const mode = request.query['hub.mode']
    // const token = request.query['hub.verify_token']
    const challenge = request.query['hub.challenge']
    return res.status(200).send(challenge)
  }
}
