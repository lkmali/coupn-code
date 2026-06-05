import { Request } from 'express'
import { AuthenticationStrategy } from './authentication.strategies'
import { badRequest, unauthorized, verifySignatureMiddleware } from '../utils'
import { OrganizationConfigurationService } from '../service'
import { IMetaAttributes, WhatsAppBusinessAccount } from '../typings'
import { MongoMetaWebhookPayloadRepository } from '@anantai/common'

const metaWebhookPayloadRepository = new MongoMetaWebhookPayloadRepository()

function extractMessageType(payload: object): string | undefined {
  try {
    const entry = (payload as any)?.entry?.[0]
    const value = entry?.changes?.[0]?.value
    if (value?.messages) return 'messages'
    if (value?.statuses) return 'statuses'
    return undefined
  } catch {
    return undefined
  }
}

export class MetaWebhookStrategy implements AuthenticationStrategy {
  async authenticate(request: Request): Promise<any> {
    const signature = request.headers['x-hub-signature-256'] as string
    const orgId = await this.getOrgId(request)

    // Store raw payload in background AFTER orgId is resolved (non-blocking, silent fail)
    if (request.body && Object.keys(request.body).length > 0) {
      const messageType = extractMessageType(request.body)
      metaWebhookPayloadRepository
        .saveMetaWebhookPayload({
          payload: request.body,
          webhookType: request.body?.object,
          messageType,
          processedStatus: 'received',
          orgId: orgId as any,
        })
        .catch(() => {})
    }
    console.log('orgId', orgId)
    if (!signature) {
      throw unauthorized('Missing signature')
    }
    // Extract path parameters from URL

    if (!orgId) {
      throw unauthorized('orgId not found in URL')
    }

    const orgConfig = await OrganizationConfigurationService.Instance.getOrganizationConfiguration(orgId)
    const metaConfig: IMetaAttributes = orgConfig.metaAttributes
    const body = (request as any).rawBody // raw body (added in server.ts)
    const isValid = verifySignatureMiddleware(
      metaConfig.appSecret,
      request.headers['x-hub-signature-256'] as string,
      body,
    )
    if (!isValid) {
      throw unauthorized('not valid signature')
    }
    return orgConfig
  }

  async getOrgId(request: Request): Promise<string> {
    const match = request.originalUrl.match(/\/facebook\/(\d+)/)
    if (match && match.length >= 2) {
      const orgId = match?.[1] as unknown as string
      if (orgId) {
        return orgId
      }
    }
    const body = request.body as WhatsAppBusinessAccount
    if (
      body.entry &&
      body.entry.length > 0 &&
      body.entry[0].changes &&
      body.entry[0].changes[0].value?.metadata?.phone_number_id
    ) {
      const orgId = await OrganizationConfigurationService.Instance.getOrganizationIdByPhoneNumber(
        body.entry[0].changes[0].value?.metadata?.phone_number_id,
      )
      if (orgId) {
        return orgId
      }
      throw badRequest('Missing data')
    }
    throw badRequest('Missing data')
  }
}
