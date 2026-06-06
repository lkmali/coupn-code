import Stripe = require('stripe')
import { createHash } from 'crypto'
import { isNil } from 'lodash'
import { LoggerProvider } from '../../provider/logger.provider'
import { StripeClient } from '../../typings'
import { StripeConfigService } from './stripeConfig.service'

const loggerProvider = LoggerProvider.Instance

/**
 * Builds and caches a per-org Stripe SDK client from that org's (decrypted)
 * secret key. Clients are cached keyed on a fingerprint of the secret key so a
 * key rotation transparently produces a fresh client.
 */
export class StripeClientService {
  private static instance: StripeClientService
  private readonly stripeConfigService = StripeConfigService.Instance
  private readonly clients = new Map<string, StripeClient>()

  /** Build a client directly from a secret key (used by the webhook strategy). */
  fromSecretKey(secretKey: string): StripeClient {
    const fingerprint = createHash('sha256').update(secretKey).digest('hex').slice(0, 16)
    const cached = this.clients.get(fingerprint)
    if (cached) return cached
    // No apiVersion pin: use the SDK's pinned default, which matches the
    // installed stripe major version and avoids type drift.
    const client = new Stripe(secretKey, { typescript: true, maxNetworkRetries: 2 })
    this.clients.set(fingerprint, client)
    return client
  }

  /** Resolve the org's Stripe config and return a ready client. */
  async getClient(orgId: string): Promise<StripeClient> {
    try {
      const config = await this.stripeConfigService.getEnabledConfigOrThrow(orgId)
      return this.fromSecretKey(config.secretKey as string)
    } catch (error: any) {
      loggerProvider.logger.error('getStripeClient_Error', {
        error: error.message,
        orgId,
      })
      throw error
    }
  }

  public static get Instance() {
    if (isNil(this.instance)) this.instance = new this()
    return this.instance
  }
}
