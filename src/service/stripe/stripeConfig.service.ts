import { MongoOrganizationConfigurationRepository, toObjectId } from '../../database'
import { LoggerProvider } from '../../provider/logger.provider'
import { TimezoneUtil } from '../../utils/timezone.util'
import { badRequest } from '../../utils'
import {
  IStripeConfiguration,
  IStripeConfigurationView,
  UserProfile,
  AuditAction,
} from '../../typings'
import { UpdateStripeConfigDto } from '../../dto'
import { AuditLogService } from '../auditLog.service'
import { EncryptionService } from '../encryption.service'
import { isNil } from 'lodash'

const loggerProvider = LoggerProvider.Instance

/**
 * Reads/writes the per-org Stripe configuration that lives inside the
 * organization configuration document. Secret key and webhook secret are
 * encrypted at rest (SecretCrypto) and never returned to the client.
 */
export class StripeConfigService {
  private static instance: StripeConfigService
  private readonly orgConfigRepo = new MongoOrganizationConfigurationRepository()
  private readonly auditLogService = AuditLogService.Instance
  private readonly encryption = EncryptionService.Instance

  /** Internal: decrypted Stripe config for an org, or null if not configured. */
  async getDecryptedConfig(orgId: string): Promise<IStripeConfiguration | null> {
    const config = await this.orgConfigRepo.getOrganizationConfiguration({
      orgId: toObjectId(orgId),
      isDelete: false,
    })
    const stripe = (config as any)?.stripeConfiguration as IStripeConfiguration | undefined
    if (!stripe) return null
    return {
      ...stripe,
      secretKey: stripe.secretKey ? this.encryption.decryptSecret(stripe.secretKey) : undefined,
      webhookSecret: stripe.webhookSecret ? this.encryption.decryptSecret(stripe.webhookSecret) : undefined,
    }
  }

  /** Throw unless the org has Stripe enabled with a usable secret key. */
  async getEnabledConfigOrThrow(orgId: string): Promise<IStripeConfiguration> {
    const config = await this.getDecryptedConfig(orgId)
    if (!config || !config.isEnabled || !config.secretKey) {
      throw badRequest('Stripe is not configured for this organization')
    }
    return config
  }

  /** Masked, secret-free view for the admin UI. */
  async getConfigView(orgId: string): Promise<IStripeConfigurationView | null> {
    const config = await this.orgConfigRepo.getOrganizationConfiguration({
      orgId: toObjectId(orgId),
      isDelete: false,
    })
    const stripe = (config as any)?.stripeConfiguration as IStripeConfiguration | undefined
    if (!stripe) return null
    return {
      isEnabled: Boolean(stripe.isEnabled),
      publishableKey: stripe.publishableKey,
      defaultCurrency: stripe.defaultCurrency,
      accountId: stripe.accountId,
      livemode: stripe.livemode,
      secretKeyConfigured: Boolean(stripe.secretKey),
      secretKeyMasked: stripe.secretKey
        ? this.encryption.maskSecret(this.encryption.decryptSecret(stripe.secretKey))
        : undefined,
      webhookSecretConfigured: Boolean(stripe.webhookSecret),
      updatedAt: stripe.updatedAt,
    }
  }

  /**
   * Create/update the org's Stripe config. Empty secret fields are treated as
   * "leave unchanged" so the UI can re-save without re-entering secrets. Secrets
   * are encrypted before persisting.
   */
  async updateConfig(
    orgId: string,
    dto: UpdateStripeConfigDto,
    userProfile: UserProfile,
  ): Promise<IStripeConfigurationView> {
    try {
      const existingDoc = await this.orgConfigRepo.getOrganizationConfiguration({
        orgId: toObjectId(orgId),
        isDelete: false,
      })
      const existing = ((existingDoc as any)?.stripeConfiguration ?? {}) as IStripeConfiguration

      const next: IStripeConfiguration = {
        isEnabled: dto.isEnabled ?? existing.isEnabled ?? false,
        publishableKey: dto.publishableKey ?? existing.publishableKey,
        defaultCurrency: (dto.defaultCurrency ?? existing.defaultCurrency ?? 'usd').toLowerCase(),
        accountId: dto.accountId ?? existing.accountId,
        livemode: dto.publishableKey
          ? dto.publishableKey.startsWith('pk_live_')
          : existing.livemode,
        // Only re-encrypt when a new non-empty secret is supplied; otherwise keep
        // the already-encrypted value untouched.
        secretKey: dto.secretKey ? this.encryption.encryptSecret(dto.secretKey) : existing.secretKey,
        webhookSecret: dto.webhookSecret
          ? this.encryption.encryptSecret(dto.webhookSecret)
          : existing.webhookSecret,
        updatedAt: TimezoneUtil.nowUTC(),
      }

      if (existingDoc) {
        await this.orgConfigRepo.updateOrganizationConfiguration(
          { _id: toObjectId((existingDoc as any)._id) },
          {
            stripeConfiguration: next,
            updatedBy: toObjectId(userProfile.userId),
            updatedAt: TimezoneUtil.nowUTC(),
          } as any,
        )
      } else {
        await this.orgConfigRepo.saveOrganizationConfiguration({
          orgId: toObjectId(orgId),
          stripeConfiguration: next,
          adminUserId: toObjectId(userProfile.userId),
          createdBy: toObjectId(userProfile.userId),
          updatedBy: toObjectId(userProfile.userId),
          isDeleteAllowed: false,
          isActive: true,
          isDelete: false,
        } as any)
      }

      await this.auditLogService.log({
        orgId,
        userId: userProfile.userId,
        action: AuditAction.STRIPE_CONFIG_UPDATED,
        resourceType: 'StripeConfiguration',
        resourceId: orgId,
        // Never log secret values — only which fields changed.
        payload: {
          isEnabled: next.isEnabled,
          secretKeyChanged: Boolean(dto.secretKey),
          webhookSecretChanged: Boolean(dto.webhookSecret),
          publishableKeySet: Boolean(next.publishableKey),
        },
      })

      return (await this.getConfigView(orgId)) as IStripeConfigurationView
    } catch (error: any) {
      loggerProvider.logger.error('updateStripeConfig_Error', {
        error: error.message,
        stack: error.stack,
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
