/**
 * ExotelService — POC integration with DB-backed agent provisioning.
 *
 * One API surface only — the Integrations Core API at
 *   `integrationscore.mum1.exotel.com/v2/integrations/...`
 *
 * Used for:
 *  - `/token`               → fetch app-level bearer token
 *  - `/usermapping` (POST)  → register an agent (creates SIP identity)
 *  - `/usermapping` (GET)   → fetch the agent's SIP details by AppUserId
 *  - `/call/outbound_call`  → kick off click-to-call
 *
 * Flow on `init()`:
 *   1. Look up the calling CRM user in our Mongo `users` collection.
 *   2. If `user.exotel.sipUsername && user.exotel.sipSecret` are populated
 *      → return them (cheap path; no Exotel calls).
 *   3. Otherwise register the user via POST /usermapping, then re-fetch
 *      via GET /usermapping to capture the canonical mapping, persist it
 *      on `user.exotel`, and return it.
 *   4. As a last-resort POC fallback (e.g. user lookup fails), the
 *      hardcoded `agent_001` credentials in `EXOTEL_POC_CONFIG` are used so
 *      a single shared SIP identity still works for development.
 */
import axios from 'axios'
import { isNil } from 'lodash'
import { Request, Response } from 'express'
import { UnauthorizedError } from 'routing-controllers'
import {
  MongoOrganizationConfigurationRepository,
  MongoUserRepository,
  MongoCallActivityRepository,
  toObjectId,
  User,
} from '@anantai/common'

import { LoggerProvider } from '../provider/logger.provider'
import { IExotelApiResponse, IExotelResolvedConfig, IExotelUserMapping, UserProfile } from '../typings'
import {
  IExotelConfiguration,
  IUserExotelCredentials,
  IMongoUser,
} from '../typings/mongoModel'
import { ExotelOutboundCallDto, ExotelCallLogDto } from '../dto'
import { RedisService } from './redis.service'
import { ExotelHelperService } from './exotel.helper.service'
import { PhoneRoutingService } from './phoneRouting.service'
import { LeadService } from './lead.service'
import { envConfig} from '../config'
import { checkUrlIsPublic, splitNameForExotel } from '../utils'
import { LeadSource, Role } from '../typings'

const loggerProvider = LoggerProvider.Instance

// ─── Redis-backed app-token cache ───────────────────────────────────────────
// Keyed by Exotel `appId`. App tokens are reused across every Integrations
// Core API call. We cache them in Redis (shared across processes) with a TTL
// just under Exotel's ~1h token lifetime so all instances of the service
// share the same token and avoid redundant /token mints.
const APP_TOKEN_TTL_SECONDS = 50 * 60 // 50 minutes
const APP_TOKEN_REDIS_KEY = (appId: string) => `exotel:appToken:${appId}`

// ─── Redis-backed inbound-webhook token → orgId cache ──────────────────────
// The `:token` segment of `/webhooks/incoming/:token` is the per-org
// `exotelConfiguration.webhookToken`. Each Exotel inbound call would
// otherwise cost a Mongo round-trip to find the owning org — caching the
// resolved orgId + virtualNumber in Redis cuts that to one lookup per TTL
// window (10 min). Cache is invalidated when the org config is updated.
const WEBHOOK_TOKEN_TTL_SECONDS = 10 * 60 // 10 minutes
export const EXOTEL_WEBHOOK_TOKEN_REDIS_KEY = (token: string) =>
  `exotel:webhookToken:${token}`


export class ExotelService {
  private static instance: ExotelService
  private readonly userRepository: MongoUserRepository
  private readonly orgConfigRepository: MongoOrganizationConfigurationRepository
  private readonly callActivityRepository: MongoCallActivityRepository

  private readonly helper: ExotelHelperService

  private constructor() {
    this.userRepository = new MongoUserRepository()
    this.orgConfigRepository = new MongoOrganizationConfigurationRepository()
    this.callActivityRepository = new MongoCallActivityRepository()
    this.helper = ExotelHelperService.Instance
  }

  static get Instance(): ExotelService {
    if (isNil(this.instance)) this.instance = new ExotelService()
    return this.instance
  }

  // ─── Org Config Loader ───────────────────────────────────────────────────
  /**
   * Loads `OrganizationConfiguration.exotelConfiguration` for the given org
   * and validates that all fields required by the Integrations Core API are
   * populated. Throws on missing/disabled config so callers don't silently
   * fall back to a stale or hardcoded value.
   */
  private async getExotelConfig(orgId: string): Promise<IExotelResolvedConfig> {
 

    const orgConfig = await this.orgConfigRepository.getOrganizationConfiguration({
      orgId: toObjectId(orgId),
    }) as { exotelConfiguration?: IExotelConfiguration } | null

    const cfg = orgConfig?.exotelConfiguration
    if (!cfg) {
      throw new Error(`exotel config: not configured for orgId=${orgId}`)
    }
    if (cfg.isEnabled === false) {
      throw new Error(`exotel config: disabled for orgId=${orgId}`)
    }

    const required: (keyof IExotelConfiguration)[] = [
      'customerId',
      'customerSecret',
      'appId',
      'appSecret',
      'accountSid',
      'virtualNumber',
      'domain',
      'integrationsBaseUrl',
    ]
    const missing = required.filter((k) => !cfg[k])
    if (missing.length) {
      throw new Error(
        `exotel config: missing required fields [${missing.join(', ')}] for orgId=${orgId}`,
      )
    }

    return {
      customerId: cfg.customerId!,
      customerSecret: cfg.customerSecret!,
      appId: cfg.appId!,
      appSecret: cfg.appSecret!,
      accountSid: cfg.accountSid!,
      virtualNumber: cfg.virtualNumber!,
      domain: cfg.domain!,
      integrationsBaseUrl: cfg.integrationsBaseUrl!,
      subdomain: cfg.subdomain,
      apiKey: cfg.apiKey,
      apiToken: cfg.apiToken,
    }
  }

  // ─── Token Management (Integrations Core API) ────────────────────────────
  private async generateToken(
    cfg: IExotelResolvedConfig,
    id: string,
    secret: string,
    entity: 'customer' | 'app',
  ): Promise<string> {
    const res = await axios.post(`${cfg.integrationsBaseUrl}/token`, {
      Id: id,
      Secret: secret,
      Entity: entity,
    })
    if (res.data.Status !== 'Success') {
      throw new Error(`Token generation failed: ${res.data.Error}`)
    }
    return res.data.Data
  }

  /**
   * Returns a cached Exotel app-level bearer token, minting (and caching) a
   * fresh one in Redis on a miss. Shared across processes so we don't burn
   * /token mints under load.
   */
  private async getAppToken(cfg: IExotelResolvedConfig): Promise<string> {
    const redis = RedisService.Instance
    const cacheKey = APP_TOKEN_REDIS_KEY(cfg.appId)
    try {
      const cached = await redis.get(cacheKey)
      if (cached) return cached
    } catch (error: any) {
      // Redis miss/down should not block call flow — fall through to mint.
      loggerProvider.logger.warn('exotel_app_token_cache_get_failed', {
        appId: cfg.appId,
        message: error?.message,
      })
    }

    const token = await this.generateToken(cfg, cfg.appId, cfg.appSecret, 'app')

    try {
      await redis.set(cacheKey, token, APP_TOKEN_TTL_SECONDS)
    } catch (error: any) {
      loggerProvider.logger.warn('exotel_app_token_cache_set_failed', {
        appId: cfg.appId,
        message: error?.message,
      })
    }
    return token
  }

  private async getExotelUserData(
    cfg: IExotelResolvedConfig,
    appUserId: string,
  ): Promise<any> {
    try {
      const token = await this.getAppToken(cfg)
      const res = await axios.get(`${cfg.integrationsBaseUrl}/${appUserId}`, {
        headers: { Authorization: token },
      })

      console.log('getExotelUser response', res.data)
      if (res.data.Status !== 'Success') {
        throw new Error(`Get user failed: ${res.data.Error}`)
      }
      return res.data.Data
    } catch (error: any) {
      loggerProvider.logger.error('getExotelUserData_Error', {
        error: error?.message,
        stack: error?.stack,
        responseData: error?.response?.data,
      })
      throw error
    }
  }

  // ─── User Mapping (Integrations API — POC fallback path) ────────────────
  async getExotelUser(orgId: string, appUserId: string): Promise<any> {
    const cfg = await this.getExotelConfig(orgId)
    await this.getExotelUserData(cfg, appUserId) // ensure token is cached before user lookup
    const token = await this.getAppToken(cfg)

    const res = await axios.get(
      `${cfg.integrationsBaseUrl}/usermapping?user_id=${appUserId}`,
      { headers: { Authorization: token } },
    )

    console.log('getExotelUser response', res.data)
    if (res.data.Status !== 'Success') {
      throw new Error(`Get user failed: ${res.data.Error}`)
    }
    return res.data.Data
  }

  // ─── Integrations API request wrapper ────────────────────────────────────
  /**
   * Centralises:
   *  - App-token Authorization header
   *  - Content-Type
   *  - try/catch with structured error logging that ALWAYS includes the
   *    step name, method, URL, request body, HTTP status and Exotel
   *    response body.
   *
   * Throws an Error tagged `[exotel:<step>]` so the failing call is
   * obvious in stack traces. Each step method below uses this wrapper —
   * never call axios directly from a step method.
   */
  private async integrationsRequest<T = any>(
    cfg: IExotelResolvedConfig,
    step: string,
    config: { method: 'GET' | 'POST' | 'PUT' | 'DELETE'; url: string; data?: any },
  ): Promise<T> {
    try {
      const token = await this.getAppToken(cfg)
      const res = await axios.request<T>({
        method: config.method,
        url: config.url,
        data: config.data,
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      })
      loggerProvider.logger.info(`exotel_${step}_response`, {
        step,
        method: config.method,
        url: config.url,
        status: res.status,
      })
      return res.data
    } catch (error: any) {
      loggerProvider.logger.error(`exotel_${step}_Error`, {
        step,
        method: config.method,
        url: config.url,
        requestBody: config.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        message: error?.message,
        stack: error?.stack,
      })
      throw new Error(`[exotel:${step}] ${error?.message || 'request failed'}`)
    }
  }

  // ─── Helpers shared by registration + recovery ─────────────────────────

  /**
   * AppUserId derived from the Mongo user document. Reads
   * `user.exotelAppUserIdVersion` (incremented every time we burn an
   * appUserId — see unregisterAgent and the 409 handler in
   * registerAgentWithExotel) so we can step around orphan mappings
   * that Exotel won't let us delete.
   *
   * Version 0 → `agent_<userId>` (original)
   * Version N → `agent_<userId>_v<N>`
   *
   * Exotel retired DELETE /usermapping in 2026, so once an appUserId
   * is registered it's stuck on their side forever. The version
   * counter lets us provision a fresh mapping by changing the ID.
   */
  private deriveAppUserId(user: IMongoUser): string {
    const version = ((user as any).exotelAppUserIdVersion || 0) as number
    const base = `agent_${user._id.toString()}`
    return version === 0 ? base : `${base}_v${version}`
  }

  /**
   * Convert an Exotel `usermapping` payload (from POST or GET) into the
   * IUserExotelCredentials shape we persist on `user.exotel`.
   *
   * `plaintextSecret` should be passed when the mapping came from a POST
   * response — that's the only time Exotel returns the real SIP secret.
   * GET responses always return a hashed secret that fails SIP digest
   * auth, so we fall back to the POC env override in that case.
   */
  private buildCredentialsFromMapping(
    cfg: IExotelResolvedConfig,
    appUserId: string,
    mapping: any,
    plaintextSecret: string,
  ): IUserExotelCredentials {
    const sipUsername: string = mapping?.SipId?.replace(/^sip:/, '') || appUserId
    return {
      exotelUserId: appUserId,
      deviceId: mapping?.SipDeviceID || mapping?.PhoneDeviceID || undefined,
      sipUsername,
      sipId: mapping?.SipId,
      sipSecret: plaintextSecret,
      domain: cfg.domain,
      status: 'ACTIVE',
      registeredAt: new Date(),
      lastValidatedAt: new Date(),
      // Mapping was just registered/refreshed against Exotel with this
      // VirtualNumber, so record it. Drift-detection on outbound calls
      // compares this to cfg.virtualNumber and re-syncs if they differ.
      lastSyncedVirtualNumber: mapping?.VirtualNumber || cfg.virtualNumber,
    }
  }

  // ─── STEP 1: Register agent on Exotel ──────────────────────────────────
  // POST /v2/integrations/usermapping
  // Body (array per Exotel spec):
  //   [{ AppUserId, AppUsername, Email, ExotelAccountSid,
  //      ExotelUserName, VirtualNumber }]
  private async registerUserMapping(
    cfg: IExotelResolvedConfig,
    user: IMongoUser,
  ): Promise<{ appUserId: string; mapping: any }> {
    try {
      const appUserId = this.deriveAppUserId(user)
      // Exotel splits AppUsername on whitespace and rejects short last names with
      // "Invalid parameter, last_name too short". splitNameForExotel strips titles (Dr./Mr./…),
      // trims, and guarantees a last name of at least 2 chars so the request always lands.
      const rawName = user.userName || user.email || appUserId
      const { display: displayName } = splitNameForExotel(rawName)
      // Synthesised per-agent email keyed off the AppUserId. Using the
      // user's real email risks collisions on Exotel's side (their
      // /usermapping rejects duplicates), and we don't actually need a
      // deliverable address — the field is just an identifier to Exotel.
      const email = `${appUserId}@yourapp.com`

      const payload = [
        {
          AppUserId: appUserId,
          AppUsername: displayName,
          Email: email,
          ExotelAccountSid: cfg.accountSid,
          ExotelUserName: displayName,
          VirtualNumber: cfg.virtualNumber,
        },
      ]

      loggerProvider.logger.info('exotel_register_user_mapping_request', {
        userId: user._id.toString(), appUserId, email,
      })

      const data = await this.integrationsRequest<any>(cfg, 'registerUserMapping', {
        method: 'POST',
        url: `${cfg.integrationsBaseUrl}/usermapping`,
        data: payload,
      })

      if (data?.Status && data.Status !== 'Success') {
        throw new Error(`registerUserMapping: ${data.Error || 'non-success status'}`)
      }

      const created = Array.isArray(data?.Data) ? data.Data[0] : data?.Data
      loggerProvider.logger.info('exotel_register_user_mapping_success', {
        userId: user._id.toString(), appUserId, sipId: created?.SipId,
      })
      return { appUserId, mapping: created }
    } catch (error: any) {
      loggerProvider.logger.error('exotel_register_user_mapping_Error', {
        userId: user._id.toString(), message: error?.message, stack: error?.stack,
      })
      throw error
    }
  }

  // ─── Drift sync: align the agent's Exotel VirtualNumber with org config ─
  //
  // Called from makeOutboundCall when user.exotel.lastSyncedVirtualNumber
  // doesn't match the org's current exotelConfiguration.virtualNumber. The
  // virtual number that the recipient sees on their caller-ID is whatever
  // Exotel has bound to the AppUserId at registration time — passing
  // `virtual_number` in the outbound payload is not enough by itself. So
  // we push the org's value back to Exotel.
  //
  // Tries PUT first (non-destructive, keeps SipId/SipSecret). If PUT is
  // not supported (404/405) we DELETE the mapping then re-register via
  // POST — which rotates SipSecret, so the agent's active softphone
  // session will need to refetch /init.
  private async syncUserMappingVirtualNumber(
    cfg: IExotelResolvedConfig,
    user: IMongoUser,
    current: IUserExotelCredentials,
  ): Promise<IUserExotelCredentials> {
    const appUserId = this.deriveAppUserId(user)
    const rawName = user.userName || user.email || appUserId
    const { display: displayName } = splitNameForExotel(rawName)
    const email = `${appUserId}@yourapp.com`

    const fullPayload = [
      {
        AppUserId: appUserId,
        AppUsername: displayName,
        Email: email,
        ExotelAccountSid: cfg.accountSid,
        ExotelUserName: displayName,
        VirtualNumber: cfg.virtualNumber,
      },
    ]

    loggerProvider.logger.info('exotel_sync_virtual_number_start', {
      userId: user._id.toString(),
      appUserId,
      from: current.lastSyncedVirtualNumber,
      to: cfg.virtualNumber,
    })

    // ── Path A: PUT /usermapping/{appUserId} ─────────────────────────────
    try {
      await this.integrationsRequest(cfg, 'updateUserMappingVirtualNumber', {
        method: 'PUT',
        url: `${cfg.integrationsBaseUrl}/usermapping/${appUserId}`,
        data: fullPayload,
      })
      await (User as any).updateOne(
        { _id: user._id },
        { $set: { 'exotel.lastSyncedVirtualNumber': cfg.virtualNumber } },
        { strict: false },
      )
      loggerProvider.logger.info('exotel_sync_virtual_number_put_success', {
        userId: user._id.toString(), appUserId, virtualNumber: cfg.virtualNumber,
      })
      return { ...current, lastSyncedVirtualNumber: cfg.virtualNumber }
    } catch (putErr: any) {
      loggerProvider.logger.warn('exotel_sync_virtual_number_put_failed', {
        userId: user._id.toString(), appUserId, message: putErr?.message,
      })
    }

    // ── Path B: DELETE + re-POST fallback ────────────────────────────────
    try {
      await this.integrationsRequest(cfg, 'deleteUserMappingForResync', {
        method: 'DELETE',
        url: `${cfg.integrationsBaseUrl}/usermapping?user_id=${appUserId}`,
      })
    } catch (delErr: any) {
      // DELETE 404 (already gone) is fine — proceed to POST. Other errors
      // are logged but not rethrown so the POST still gets a chance.
      loggerProvider.logger.warn('exotel_sync_virtual_number_delete_failed', {
        userId: user._id.toString(), appUserId, message: delErr?.message,
      })
    }

    const fresh = await this.registerAgentWithExotel(cfg, user)
    await this.persistAgentCredentials(user._id, fresh)
    loggerProvider.logger.info('exotel_sync_virtual_number_reregistered', {
      userId: user._id.toString(), appUserId, virtualNumber: cfg.virtualNumber,
    })
    return fresh
  }

  // ─── STEP 2: Fetch the canonical mapping ───────────────────────────────
  // GET /v2/integrations/usermapping?user_id={appUserId}
  private async fetchUserMapping(
    cfg: IExotelResolvedConfig,
    appUserId: string,
  ): Promise<IExotelUserMapping | null> {
    try {
      const data = await this.integrationsRequest<IExotelApiResponse<IExotelUserMapping>>(cfg, 'fetchUserMapping', {
        method: 'GET',
        url: `${cfg.integrationsBaseUrl}/usermapping?user_id=${appUserId}`,
      })

      if (data?.Status && data.Status !== 'Success') {
        throw new Error(`fetchUserMapping: ${data.Error || 'non-success status'}`)
      }
      const mapping: IExotelUserMapping | null = Array.isArray(data?.Data)
        ? data.Data[0] ?? null
        : data?.Data ?? null
      if (!mapping?.SipId) {
        return null
      }
      loggerProvider.logger.info('exotel_fetch_user_mapping_success', {
        appUserId, sipId: mapping.SipId,
      })
      return mapping
    } catch (error: any) {
      loggerProvider.logger.error('exotel_fetch_user_mapping_Error', {
        appUserId, message: error?.message, stack: error?.stack,
      })
      throw error
    }
  }

  /**
   * Register a CRM user as a SIP agent on Exotel.
   * Orchestrates STEP 1 (POST /usermapping) → STEP 2 (GET /usermapping)
   * by delegating to dedicated methods. Each step owns its own try/catch
   * + structured logging so a failure can be traced to a single API call
   * without ambiguity.
   *
   * IMPORTANT: the *real* plaintext SipSecret is only returned on the
   * POST response (registration). Subsequent GETs return a hashed copy
   * that's unusable for SIP digest auth. We capture the secret from the
   * POST and combine it with the GET-fetched mapping for everything else.
   */
  private async registerAgentWithExotel(
    cfg: IExotelResolvedConfig,
    user: IMongoUser,
  ): Promise<IUserExotelCredentials> {
    // Up to MAX_ATTEMPTS attempts. Each 409 burns the current appUserId
    // (Exotel won't let us delete it — see `deriveAppUserId` comment),
    // so we $inc the version counter and try a fresh appUserId on the
    // next pass. Non-409 errors propagate immediately.
    const MAX_ATTEMPTS = 5
    let currentUser: IMongoUser = user
    let lastError: unknown
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const appUserId = this.deriveAppUserId(currentUser)
      try {
        return await this.doRegisterAndBuildCredentials(cfg, currentUser, appUserId)
      } catch (error: any) {
        lastError = error
        const msg = String(error?.message || '')
        const isConflict =
          /status code 409/i.test(msg) ||
          /\bconflict\b/i.test(msg) ||
          /already (registered|exists)/i.test(msg)
        if (!isConflict) {
          loggerProvider.logger.error('exotel_register_agent_Error', {
            userId: currentUser._id.toString(), appUserId, message: msg, stack: error?.stack,
          })
          throw error
        }
        // Burn this appUserId: bump the version counter so the next
        // attempt uses agent_<userId>_v<N+1>.
        await (User as any).updateOne(
          { _id: currentUser._id },
          { $inc: { exotelAppUserIdVersion: 1 } },
          { strict: false },
        )
        const refreshed = (await this.userRepository.getUserInformation({
          _id: currentUser._id,
        } as any)) as unknown as IMongoUser | null
        if (!refreshed) {
          throw new Error('User disappeared while bumping exotelAppUserIdVersion')
        }
        currentUser = refreshed
        loggerProvider.logger.warn('exotel_register_agent_conflict_version_bumped', {
          userId: currentUser._id.toString(),
          burnedAppUserId: appUserId,
          newVersion: (currentUser as any).exotelAppUserIdVersion,
          attempt,
        })
      }
    }
    loggerProvider.logger.error('exotel_register_agent_exhausted_attempts', {
      userId: currentUser._id.toString(), attempts: MAX_ATTEMPTS,
    })
    throw lastError instanceof Error
      ? lastError
      : new Error('Exotel registration exhausted attempts')
  }

  private async doRegisterAndBuildCredentials(
    cfg: IExotelResolvedConfig,
    user: IMongoUser,
    appUserId: string,
  ): Promise<IUserExotelCredentials> {
    // STEP 1 — register and capture the plaintext secret
    const { mapping: createdMapping } = await this.registerUserMapping(cfg, user)
    const plaintextSecret: string = createdMapping?.SipSecret

    // STEP 2 — re-fetch the canonical mapping (for SipId, device IDs, etc.)
    const mapping = await this.fetchUserMapping(cfg, appUserId)
    if (!mapping) {
      throw new Error('fetchUserMapping: no mapping returned after registration')
    }

    const credentials = this.buildCredentialsFromMapping(cfg, appUserId, mapping, plaintextSecret)

    loggerProvider.logger.info('exotel_register_agent_success', {
      userId: user._id.toString(), appUserId, sipId: credentials.sipId,
    })
    return credentials
  }

  /**
   * Persist the credential bundle on the user document. Goes through
   * `User.updateOne` with `strict: false` because the new fields
   * (deviceId / sipUsername / domain / status / lastValidatedAt) aren't
   * declared in the published `@anantai/common` user schema yet.
   */
  private async persistAgentCredentials(
    userId: IMongoUser['_id'],
    credentials: IUserExotelCredentials,
  ): Promise<void> {
    await (User as any).updateOne(
      { _id: userId },
      { $set: { exotel: credentials } },
      { strict: false },
    )
  }

  /**
   * POST /exotel/agent/unregister
   *
   * Called by the frontend when the SIP server rejects the cached creds
   * (401 auth-loop → `unregistered` event). Wipes the user's Exotel
   * mapping on both sides so the next /init re-provisions fresh:
   *   1. DELETE /usermapping/{appUserId} on Exotel — best effort; 404
   *      (already gone) and other failures are logged but don't block.
   *   2. $unset `user.exotel` in Mongo.
   *
   * Idempotent: safe to call when the user has no mapping at all.
   */
  async unregisterAgent(
    userProfile: UserProfile,
  ): Promise<{ cleared: boolean; reason?: string }> {
    if (!userProfile?.userId) {
      return { cleared: false, reason: 'no_user' }
    }
    const user = (await this.userRepository.getUserInformation({
      _id: toObjectId(userProfile.userId),
    } as any)) as unknown as IMongoUser | null
    if (!user) {
      return { cleared: false, reason: 'user_not_found' }
    }

    const appUserId = this.deriveAppUserId(user)

    // Exotel retired DELETE /usermapping in 2026 (410 Gone), so we can't
    // clean up their side. Instead we (a) wipe the DB row, and (b) $inc
    // exotelAppUserIdVersion — the next /init will derive a fresh
    // appUserId (agent_<userId>_v<N+1>) and POST a brand new mapping
    // with a fresh plaintext SIP secret. The old mapping stays
    // orphaned on Exotel; contact hello@exotel.com if it ever needs
    // cleanup.
    await (User as any).updateOne(
      { _id: user._id },
      { $unset: { exotel: '' }, $inc: { exotelAppUserIdVersion: 1 } },
      { strict: false },
    )
    loggerProvider.logger.info('exotel_unregister_agent_db_cleared_and_burned', {
      userId: user._id.toString(),
      burnedAppUserId: appUserId,
    })
    return { cleared: true }
  }

  /**
   * Credential resolver — three-tier lookup:
   *
   *   1. DB hit       → user.exotel already populated, return as-is.
   *   2. Exotel GET   → mapping already exists upstream (e.g. DB was wiped
   *                     but Exotel still has the AppUserId registered),
   *                     persist + return.
   *   3. Exotel POST  → register fresh, persist + return.
   *
   * The GET-before-POST step matters: registering an AppUserId twice
   * fails on Exotel's side, so if the mapping already exists we recover
   * it instead of bailing out.
   *
   * Throws on hard failures so the caller can decide whether to fall back
   * to the POC hardcoded agent or surface the error.
   */
  private async resolveAgentCredentials(
    cfg: IExotelResolvedConfig,
    userProfile: UserProfile,
  ): Promise<IUserExotelCredentials | null> {
    if (!userProfile?.userId) return null

    // ── 1. DB lookup ───────────────────────────────────────────────────
    const user = (await this.userRepository.getUserInformation({
      _id: toObjectId(userProfile.userId),
    } as any)) as unknown as IMongoUser | null

    if (!user) {
      loggerProvider.logger.warn('exotel_resolve_agent_no_user', {
        userId: String(userProfile.userId),
      })
      return null
    }

    if (user.exotel?.sipUsername && user.exotel?.sipSecret) {
      loggerProvider.logger.info('exotel_resolve_agent_db_hit', {
        userId: user._id.toString(),
      })
      return user.exotel
    }

    // DB miss → POST a fresh mapping. registerAgentWithExotel handles
    // 409 collisions by bumping the appUserId version on the user doc
    // and retrying with a new appUserId. We no longer try GET-recovery
    // or DELETE — Exotel retired DELETE /usermapping (410 Gone), and
    // GET returns a hashed SipSecret unusable for SIP digest auth.
    const provisioned = await this.registerAgentWithExotel(cfg, user)
    await this.persistAgentCredentials(user._id, provisioned)
    loggerProvider.logger.info('exotel_resolve_agent_registered_and_persisted', {
      userId: user._id.toString(), sipId: provisioned.sipId,
    })
    return provisioned
  }

  // ─── Controller Surface ───────────────────────────────────────────────────

  /**
   * GET /exotel/init
   *
   * Returns the SIP credentials the WebRTC SDK needs to register against
   * the Exotel SIP gateway. Tries the DB-backed flow first; if that fails
   * (no user, no DB connection, etc.) falls back to the hardcoded POC
   * agent so dev environments still work.
   */
  async init(
    userProfile: UserProfile,
  ): Promise<{ sipCredentials: any | null; reason?: string; error?: string }> {
    // ── 1. DB-first path ───────────────────────────────────────────────────
    try {
      const cfg = await this.getExotelConfig(userProfile?.orgId as any)
      const dbCreds = await this.resolveAgentCredentials(cfg, userProfile)
      if (dbCreds && dbCreds.sipId && dbCreds.sipSecret) {
        return {
          sipCredentials: {
            sipId: dbCreds.sipId,
            sipSecret: dbCreds.sipSecret,
            virtualNumber: cfg.virtualNumber,
            appId: cfg.appId,
            domain: dbCreds.domain || cfg.domain,
            exotelAccountSid: cfg.accountSid,
            displayName:
              dbCreds.sipUsername || dbCreds.exotelUserId || String(userProfile.userId),
            // Echoed back so makeOutboundCall can route via the right user.
            exotelUserId: dbCreds.exotelUserId,
          },
        }
      }
      return { sipCredentials: null, reason: 'no_credentials' }
    } catch (error: any) {
      loggerProvider.logger.error('exotel_init_db_path_Error', {
        error: error?.message,
        stack: error?.stack,
        responseData: error?.response?.data,
      })
      return { sipCredentials: null, reason: 'db_path_failure', error: error?.message }
    }

    // // ── 2. POC fallback (hardcoded agent_001) ─────────────────────────────
    // try {
    //   const appUserId = EXOTEL_POC_CONFIG.defaultAgentUserId
    //   const exotelUser = await this.getExotelUser(appUserId)

    //   const sipCredentials = {
    //     sipId: exotelUser.SipId,
    //     sipSecret: EXOTEL_POC_CONFIG.defaultAgentSipSecret,
    //     virtualNumber: exotelUser.VirtualNumber || EXOTEL_POC_CONFIG.virtualNumber,
    //     appId: EXOTEL_POC_CONFIG.appId,
    //     domain: EXOTEL_POC_CONFIG.domain,
    //     exotelAccountSid: exotelUser.ExotelAccountSid || EXOTEL_POC_CONFIG.accountSid,
    //     displayName: exotelUser.AppUsername || exotelUser.ExotelUserName || appUserId,
    //     exotelUserId: appUserId,
    //   }
    //   return { sipCredentials, reason: 'fallback_default_agent' }
    // } catch (error: any) {
    //   loggerProvider.logger.error('exotel_init_Error', {
    //     error: error?.message,
    //     stack: error?.stack,
    //   })
    //   return { sipCredentials: null, error: error?.message }
    // }
  }

  /**
   * POST /exotel/calls/outbound
   * Asks Exotel to call the agent's SIP device first, then bridge to the
   * customer number. Routes via the DB-resolved exotelUserId when present
   * so multi-agent setups work; otherwise uses the POC default.
   */
  async makeOutboundCall(
    data: ExotelOutboundCallDto,
    userProfile: UserProfile,
  ): Promise<any> {
    try {
      const cfg = await this.getExotelConfig(userProfile?.orgId as any)
      let dbCreds = await this.resolveAgentCredentials(cfg, userProfile)
      if (!dbCreds?.exotelUserId) {
        throw new Error('Exotel agent user not configured for this user')
      }

      // Drift sync: the VirtualNumber Exotel shows on the recipient leg is
      // bound to the agent at /usermapping registration. If the org has
      // since updated exotelConfiguration.virtualNumber, push the new
      // value to Exotel before placing the call. Sync failures are logged
      // and swallowed so the call still goes through (with the old caller
      // ID) rather than blocking the user.
      if (dbCreds.lastSyncedVirtualNumber !== cfg.virtualNumber) {
        const user = (await this.userRepository.getUserInformation({
          _id: toObjectId(userProfile.userId),
        } as any)) as unknown as IMongoUser | null
        if (user) {
          try {
            dbCreds = await this.syncUserMappingVirtualNumber(cfg, user, dbCreds)
          } catch (syncErr: any) {
            loggerProvider.logger.error('exotel_sync_virtual_number_failed', {
              userId: user._id.toString(),
              message: syncErr?.message,
              stack: syncErr?.stack,
            })
          }
        }
      }

      const token = await this.getAppToken(cfg)
      // `record: true` asks Exotel to capture audio; the recording URL
      // lands on our `/webhooks/status` endpoint once the call ends.
      // `status_callback` tells Exotel where to POST progression events
      // (ringing → in-progress → completed). `PUBLIC_BASE_URL` should
      // be set to the internet-reachable base URL of this backend.
      const statusCallbackBase =  envConfig.BACKEND_URL
      const payload: Record<string, any> = {
        customer_id: cfg.customerId,
        app_id: cfg.appId,
        user_id: dbCreds.exotelUserId,
        to: data.customerNumber,
        virtual_number: cfg.virtualNumber,
        record: true,
      }
      if (statusCallbackBase) {
        payload.status_callback = `${statusCallbackBase}/api/exotel/webhooks/status`
      }

      loggerProvider.logger.info('exotel_outbound_call_request', { payload })

      const res = await axios.post(
        `${cfg.integrationsBaseUrl}/call/outbound_call`,
        payload,
        { headers: { Authorization: token, 'Content-Type': 'application/json' } },
      )

      if (res.data.Status !== 'Success') {
        throw new Error(res.data.Error || 'Outbound call failed')
      }

      const responseData = res.data.Data
      const callSid: string = responseData?.CallSid || responseData

      // Persist a CallActivity row keyed by sid so the status webhook can
      // later attach duration + recording. Failure here is logged but
      // never rejects the outbound-call response — losing a log shouldn't
      // break the agent's softphone flow.
      await this.helper.logOutboundCallFromProfile(
        userProfile,
        data.customerNumber,
        callSid,
        data.leadId,
        data.patientId,
        cfg.virtualNumber,
      )

      return {
        success: true,
        callSid,
        raw: responseData,
      }
    } catch (error: any) {
      loggerProvider.logger.error('exotel_outbound_call_Error', {
        error: error?.message,
        stack: error?.stack,
        responseData: error?.response?.data,
      })

      // Surface the *actual* Exotel failure reason instead of the generic
      // axios "Request failed with status code 403". Exotel wraps the real
      // error inside `Data.Error` (a JSON-encoded string) on the integrations
      // gateway response, e.g. TRAI NDNC rejections come through as
      // `response.error_data.description`.
      let exactError: string = error?.message || 'Outbound call failed'
      const responseData = error?.response?.data
      const rawExotelError = responseData?.Error
      if (rawExotelError) {
        try {
          const parsed =
            typeof rawExotelError === 'string'
              ? JSON.parse(rawExotelError)
              : rawExotelError
          const desc =
            parsed?.response?.error_data?.description ||
            parsed?.response?.error_data?.message ||
            parsed?.response?.message
          if (desc) exactError = desc
        } catch {
          exactError =
            typeof rawExotelError === 'string' ? rawExotelError : exactError
        }
      }

      return { success: false, error: exactError }
    }
  }

  // ─── Stubbed methods (kept so existing routes resolve) ────────────────────

  async hangupCall(
    callSid: string,
    userProfile: UserProfile,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cfg = await this.getExotelConfig(String(userProfile.orgId))
      const host = cfg.subdomain
        ? cfg.subdomain.replace(/^@/, '').replace(/\/$/, '')
        : 'api.exotel.com'
      const apiKey = cfg.apiKey || cfg.customerId
      const apiToken = cfg.apiToken || cfg.customerSecret
      const auth = 'Basic ' + Buffer.from(`${apiKey}:${apiToken}`).toString('base64')

      await axios.post(
        `https://${host}/v1/Accounts/${cfg.accountSid}/Calls/${callSid}.json`,
        new URLSearchParams({ Status: 'completed' }).toString(),
        {
          headers: {
            Authorization: auth,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      )
    } catch (error: any) {
      loggerProvider.logger.error('exotel_hangup_call_Error', {
        callSid,
        message: error?.message,
        status: error?.response?.status,
        responseData: error?.response?.data,
      })
    }
    return { success: true }
  }

  async logCall(data: ExotelCallLogDto, userProfile: UserProfile): Promise<any> {
    try {
      const orgId = userProfile.orgId ? String(userProfile.orgId) : undefined
      if (!orgId) {
        return { success: false, error: 'Missing orgId' }
      }

      const callSuccessful = (data.callStatus || '').toLowerCase() === 'completed'

      const update: Record<string, any> = {
        callStatus: data.callStatus || 'unknown',
        callSuccessful,
        direction: data.direction,
        callDuration: data.callDuration ?? 0,
        description: data.description,
        updatedBy: userProfile.userId ? toObjectId(String(userProfile.userId)) : undefined,
      }

      if (data.leadId) update.leadId = toObjectId(data.leadId)
      if (data.patientId) update.patientId = toObjectId(data.patientId)
      if (data.fromNumber) update.fromNumber = data.fromNumber
      if (data.toNumber) update.toNumber = data.toNumber

      // If we have a sid, try to find and update the existing CallActivity
      if (data.sid) {
        const existing = await this.callActivityRepository.getCallActivity({
          sid: data.sid,
          orgId: toObjectId(orgId) as any,
        })
        if (existing) {
          await this.callActivityRepository.updateCallActivity(
            { sid: data.sid, orgId: toObjectId(orgId) as any },
            update,
          )
          loggerProvider.logger.info('exotel_log_call_updated', {
            sid: data.sid,
            callStatus: data.callStatus,
            orgId,
          })
          const callActivityId =
            (existing as any)._id?.toString() || (existing as any).callActivityId?.toString()
          return { success: true, callActivityId, updated: true }
        }
      }

      // No existing record — create a new CallActivity
      const newActivity: Record<string, any> = {
        ...update,
        orgId: toObjectId(orgId),
        sid: data.sid || undefined,
        callId: data.callId || data.sid || undefined,
        createdBy: userProfile.userId ? toObjectId(String(userProfile.userId)) : undefined,
      }

      const saved = await this.callActivityRepository.saveCallActivity(newActivity)
      const callActivityId =
        (saved as any)?._id?.toString() || (saved as any)?.callActivityId?.toString()

      loggerProvider.logger.info('exotel_log_call_created', {
        callActivityId,
        sid: data.sid,
        callStatus: data.callStatus,
        orgId,
      })

      return { success: true, callActivityId, created: true }
    } catch (error: any) {
      loggerProvider.logger.error('exotel_log_call_error', {
        message: error?.message,
        stack: error?.stack,
        data,
      })
      return { success: false, error: error?.message }
    }
  }

  async setAvailability(
    _isAvailable: boolean,
    _userProfile: UserProfile,
  ): Promise<any> {
    return { success: true }
  }

  /**
   * Resolve an inbound webhook `:token` to the owning org config. Hits
   * Redis first (10 min TTL), falls back to a single Mongo query on miss
   * and caches the result. Returns `null` if the token doesn't match any
   * org — the caller treats that as an auth failure (logs + 200 to Exotel).
   *
   * Cache invalidation is handled by `OrganizationConfigurationService`
   * when `exotelConfiguration.webhookToken` is updated.
   */
  private async resolveOrgByWebhookToken(
    token: string,
  ): Promise<{ orgId: string; virtualNumber?: string; updatedBy?: string } | null> {
    if (!token) return null
    const redis = RedisService.Instance
    const cacheKey = EXOTEL_WEBHOOK_TOKEN_REDIS_KEY(token)

    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached
      }
    } catch (error: any) {
      loggerProvider.logger.warn('exotel_webhook_token_cache_get_failed', {
        message: error?.message,
      })
    }

    const orgConfig = (await this.orgConfigRepository.getOrganizationConfiguration({
      'exotelConfiguration.webhookToken': token,
      'exotelConfiguration.isEnabled': true,
      isDelete: false,
    } as any)) as any

    if (!orgConfig) return null

    const resolved = {
      orgId: String(orgConfig.orgId),
      virtualNumber: orgConfig.exotelConfiguration?.virtualNumber,
      updatedBy: orgConfig.updatedBy ? String(orgConfig.updatedBy) : undefined,
    }

    try {
      await redis.set(cacheKey, JSON.stringify(resolved), WEBHOOK_TOKEN_TTL_SECONDS)
    } catch (error: any) {
      loggerProvider.logger.warn('exotel_webhook_token_cache_set_failed', {
        message: error?.message,
      })
    }

    return resolved
  }

  async handleIncomingCallWebhook(
    token: string,
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const body = req.body || {}
      const callerNumber = body.From || body.CallFrom
      const calledNumber = body.To || body.DialWhomNumber

      loggerProvider.logger.info('exotel_incoming_call_webhook', { body, hasToken: !!token })

      // Validate the per-org webhook token from the path. Anything missing
      // or unknown is rejected silently (200 to keep Exotel from retrying).
      const resolved = await this.resolveOrgByWebhookToken(token)
      if (!resolved) {
        loggerProvider.logger.warn('exotel_incoming_call_invalid_token', {
          hasToken: !!token,
          calledNumber,
        })
        return res.status(200).send('')
      }

      if (!callerNumber || !calledNumber) {
        loggerProvider.logger.warn('exotel_incoming_call_missing_numbers', { body })
        return res.status(200).send('')
      }

      const orgId = resolved.orgId

      // `getRoutingByPhoneNumber` matches across every plausible stored
      // shape ("+91…", "91…", "0…", bare 10-digit) so we don't have to
      // pre-generate variants here.
      const routing = await PhoneRoutingService.Instance.getRoutingByPhoneNumber(
        orgId,
        calledNumber,
      )

      if (!routing) {
        loggerProvider.logger.info('exotel_incoming_call_no_routing', { calledNumber, orgId })
        return res.status(200).send('')
      }

      const defaultAssignUserId = routing.assignToUserId?.toString()
      const centerName = routing.centerName

      // Normalize caller number for lead lookup/creation
      const callerNormalized = callerNumber.replace(/^\+/, '')
      const callerWithCountryCode = callerNormalized.length === 10
        ? `91${callerNormalized}`
        : callerNormalized

      // Create or find lead and assign to routed user
      const leadRepo = (LeadService.Instance as any).leadsRepository
      const existingLead = await leadRepo.getLead({
        orgId: toObjectId(orgId),
        referenceId: callerWithCountryCode,
        isDelete: false,
      })

      let leadId: string | undefined
      let assignToUserId = defaultAssignUserId

      if (existingLead) {
        leadId = existingLead._id?.toString()

        // Check if this lead was previously called by a telecaller.
        // If so, route back to the same person for conversational continuity.
        const lastOutboundCalls = await this.callActivityRepository.getCallActivities(
          {
            leadId: existingLead._id,
            direction: 'OUTBOUND',
            orgId: toObjectId(orgId),
          },
          { sort: { createdAt: -1 }, limit: 1 },
        )

        if (lastOutboundCalls.length > 0 && lastOutboundCalls[0].createdBy) {
          const lastTelecaller = lastOutboundCalls[0].createdBy.toString()
          loggerProvider.logger.info('exotel_incoming_call_returning_caller', {
            leadId,
            lastTelecaller,
            defaultAssignUserId,
          })
          assignToUserId = lastTelecaller
        }

        // Update lead assignment to the resolved user
        if (assignToUserId) {
          await leadRepo.updateLead(
            { _id: existingLead._id },
            {
              assignUserId: toObjectId(assignToUserId),
              ...(centerName && { centerName }),
              routingPhoneNumber: routing.phoneNumber,
            },
          )
        }
      } else {
        // Create a new lead for the incoming caller
        leadId = await LeadService.Instance.saveLeadWithoutTransactions(
          {
            name: `Caller ${callerWithCountryCode}`,
            mobileNumber: callerWithCountryCode,
            source: LeadSource.CALL,
            notes: 'Lead created from incoming call',
            referenceId: callerWithCountryCode,
            assignUserId: assignToUserId,
            ...(centerName && { centerName }),
            routingPhoneNumber: routing.phoneNumber,
          } as any,
          {
            orgId,
            roles: [Role.BOT],
            userId: assignToUserId || resolved.updatedBy,
            sessionId: assignToUserId || resolved.updatedBy,
            isActive: true,
          } as any,
        )
      }

      // Log inbound call activity
      const callSid = body.CallSid
      if (callSid) {
        await this.helper.recordInboundCall({
          orgId,
          userId: assignToUserId,
          leadId,
          customerNumber: callerWithCountryCode,
          callSid,
          fromNumber: callerNumber,
          toNumber: calledNumber,
        })
      }

      loggerProvider.logger.info('exotel_incoming_call_routed', {
        orgId,
        callerNumber,
        calledNumber,
        assignToUserId,
        defaultAssignUserId,
        leadId,
        isReturningCaller: assignToUserId !== defaultAssignUserId,
      })

      return res.status(200).send('')
    } catch (error: any) {
      loggerProvider.logger.error('handleIncomingCallWebhook_Error', {
        error: error?.message,
        stack: error?.stack,
        body: req.body,
      })
      // Always return 200 to prevent Exotel retries
      return res.status(200).send('')
    }
  }

  /**
   * Shared Basic-auth guard for the Exotel webhooks. The endpoints use
   * routing-controllers' `NO_AUTH` strategy (so Exotel can POST without
   * a session token) — this check replaces that with a shared secret
   * the Exotel dashboard is configured to send on every call.
   *
   * Credentials are read from env so nothing is committed:
   *   EXOTEL_WEBHOOK_USER, EXOTEL_WEBHOOK_PASS
   *
   * Throws `UnauthorizedError` on mismatch — routing-controllers turns
   * that into a 401 automatically, matching the standard exception
   * pattern used elsewhere in the codebase.
   *
   * If either env var is unset we log a warning and let the request
   * through, so local dev keeps working. Set both in prod to enforce.
   */
  private assertWebhookBasicAuth(req: Request): void {
    const user = process.env.EXOTEL_WEBHOOK_USER
    const pass = process.env.EXOTEL_WEBHOOK_PASS
    console.log('Asserting Exotel webhook basic auth',req.headers.authorization )
    if (!user || !pass) {
      loggerProvider.logger.warn('exotel_webhook_basic_auth_disabled', {
        reason: 'EXOTEL_WEBHOOK_USER/PASS not set — webhook is open',
      })
      return
    }
    const expected = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
    const got = req.headers.authorization
    if (!got || got !== expected) {
      loggerProvider.logger.warn('exotel_webhook_basic_auth_rejected', {
        path: req.path,
        hasHeader: !!got,
      })
      throw new UnauthorizedError('Unauthorized')
    }
  }

  async handleStatusCallback(req: Request, res: Response): Promise<Response> {
    this.assertWebhookBasicAuth(req)
    loggerProvider.logger.info('exotel_status_callback', { body: req.body })
    // Always 200 — Exotel retries non-2xx, and the helper handles its own
    // failures (orphan calls, S3 issues, etc.) without throwing.
    await this.helper.applyStatusCallback(req.body || {})
    return res.status(200).json({ status: 'ok' })
  }

  /**
   * Public recording-callback handler. Exotel (or any caller) POSTs the
   * call sid + recording URL here once a recording is ready; we download
   * it into S3 and stamp the matching CallActivity. Same payload shape as
   * the status callback so Exotel can fan one webhook to either endpoint.
   */
  async handleRecordingCallback(req: Request, res: Response): Promise<Response> {
    this.assertWebhookBasicAuth(req)
    loggerProvider.logger.info('exotel_recording_callback', { body: req.body })
    const result = await this.helper.applyStatusCallback(req.body || {})
    return res.status(200).json({ status: 'ok', ...result })
  }


  /**
   * Polling endpoint — returns the current state of a call from our DB.
   * Frontend can poll this after initiating a call to reflect ringing →
   * in-progress → completed without a WebSocket dependency.
   */
  async getCallStatus(callSid: string, userProfile: UserProfile) {
    return this.helper.getCallStatusBySid(callSid, String(userProfile.orgId))
  }

  /**
   * Fetch call details directly from Exotel's API (GET /call/{callSid})
   * and update our CallActivity record. Use this as a fallback after the
   * call disconnects — if the webhook hasn't fired or was missed, this
   * ensures we capture status, duration, and recording URL.
   */
  async fetchAndSyncCallDetails(
    callSid: string,
    userProfile: UserProfile,
  ): Promise<any> {
    try {
      const orgId = String(userProfile.orgId)
      const cfg = await this.getExotelConfig(orgId)

      // Exotel standard REST API (not Integrations Core).
      // Subdomain differs by cluster: api.exotel.com (Singapore) vs
      // api.in.exotel.com (Mumbai). Falls back to api.exotel.com.
      const exotelHost = cfg.subdomain
        ? cfg.subdomain.replace(/^@/, '').replace(/\/$/, '')
        : 'api.exotel.com'
      const apiUrl = `https://${exotelHost}/v1/Accounts/${cfg.accountSid}/Calls/${callSid}.json`
      const apiKey = cfg.apiKey || cfg.customerId
      const apiToken = cfg.apiToken || cfg.customerSecret
      const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64')

      loggerProvider.logger.info('exotel_fetch_call_details_request', { callSid, apiUrl })

      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Basic ${auth}` },
      })

      loggerProvider.logger.info('exotel_fetch_call_details_response', {
        callSid,
        data: res.data,
      })

      const callData = res.data?.Call || res.data
      if (!callData) {
        return { success: false, error: 'No call data returned from Exotel' }
      }

      const status = callData.Status
      const duration = Number(callData.ConversationDuration ?? callData.Duration ?? 0) || 0
      const callSuccessful = (status || '').toLowerCase() === 'completed'
      const recordingUrl = callData.RecordingUrl || callData.RecordingURL || null

      const update: Record<string, any> = {
        callStatus: status,
        callSuccessful,
        callDuration: duration,
        updatedBy: userProfile.userId ? toObjectId(String(userProfile.userId)) : undefined,
      }

      if (callData.From) update.fromNumber = callData.From
      if (callData.To) update.toNumber = callData.To
      if (callData.Direction) update.direction = callData.Direction.toUpperCase()
      if (recordingUrl) {
        update.recordingUrl = recordingUrl
        update.recordingUrlType = await checkUrlIsPublic(recordingUrl)
      }

      // Find and update existing CallActivity, or create one
      const existing = await this.callActivityRepository.getCallActivity({
        sid: callSid,
        orgId: toObjectId(orgId) as any,
      })

      let callActivityId: string | undefined
      if (existing) {
        await this.callActivityRepository.updateCallActivity(
          { sid: callSid, orgId: toObjectId(orgId) as any },
          update,
        )
        callActivityId = (existing as any)._id?.toString() || (existing as any).callActivityId?.toString()
      } else {
        const newActivity: Record<string, any> = {
          ...update,
          orgId: toObjectId(orgId),
          sid: callSid,
          callId: callSid,
          createdBy: userProfile.userId ? toObjectId(String(userProfile.userId)) : undefined,
        }
        const saved = await this.callActivityRepository.saveCallActivity(newActivity)
        callActivityId = (saved as any)?._id?.toString() || (saved as any)?.callActivityId?.toString()
      }

      // Rehost to S3 is handled out-of-band by the scheduled Lambda. It
      // polls CallActivity rows with `recordingS3Status: 'PENDING'` via
      // POST /api/exotel/recordings/process-pending.

      loggerProvider.logger.info('exotel_fetch_call_details_synced', {
        callSid,
        callActivityId,
        callStatus: status,
        hasRecording: !!recordingUrl,
      })

      return {
        success: true,
        callActivityId,
        callStatus: status,
        callSuccessful,
        callDuration: duration,
        recordingUrl: recordingUrl || null,
        fromNumber: callData.From || null,
        toNumber: callData.To || null,
      }
    } catch (error: any) {
      loggerProvider.logger.error('exotel_fetch_call_details_Error', {
        message: error?.message,
        stack: error?.stack,
        callSid,
        responseData: error?.response?.data,
      })
      throw error
    }
  }

  /**
   * Returns call activities for a lead with recording URLs stripped out.
   * Instead of recordingUrl/recordingUrlType, returns a `recordingAvailable` flag.
   */
  async getCallActivitiesByLeadId(leadId: string, userProfile: UserProfile) {
    if (!leadId) return []
    const activities = await this.helper.listCallActivitiesForLead(leadId, String(userProfile.orgId))
    return activities.map((a: any) => {
      const { recordingUrl, recordingUrlType, recordingS3Key, ...rest } = a

      return {
        ...rest,
        callActivityId: rest._id,
        recordingUrl:recordingUrl,
        recordingAvailable: !!recordingUrl,
        recordingUrlType: recordingUrl ? (recordingUrlType || 'PUBLIC') : "PUBLIC",
      }
    })
  }

  /**
   * Auth-proxy for private Exotel recordings. Returns the raw stream so
   * the controller can pipe it to the HTTP response.
   */
  async streamRecording(callActivityId: string) {
    return this.helper.streamPrivateRecording(callActivityId)
  }

  /**
   * Download-recording-by-CallSid — the frontend calls this ~5 seconds
   * after a call completes as a deterministic trigger (belt-and-braces
   * alongside the async status webhook). Flow:
   *   1. Sync call details from Exotel (fills recordingUrl if missing).
   *   2. If the row already has `recordingS3Key`, skip — already uploaded.
   *   3. If the row has a `recordingUrl`, rehost it to S3.
   * No-op when the org hasn't opted into `recordingStoreInS3`.
   */
  async downloadRecordingByCallSid(callSid: string, userProfile: UserProfile) {
    const orgId = String(userProfile.orgId)

    // Refresh call details + recordingUrl from Exotel first.
    await this.fetchAndSyncCallDetails(callSid, userProfile)

    const row = await this.callActivityRepository.getCallActivity({
      sid: callSid,
      orgId: toObjectId(orgId) as any,
    })
    if (!row) {
      return { success: false, error: 'CallActivity not found for callSid' }
    }

    const callActivityId =
      (row as any)._id?.toString?.() || (row as any).callActivityId?.toString?.()

    if ((row as any).recordingS3Key) {
      return { success: true, skipped: true, reason: 'already-uploaded', callActivityId }
    }

    if (!(await this.helper.isRecordingS3Enabled(orgId))) {
      return { success: true, skipped: true, reason: 's3-disabled', callActivityId }
    }

    const recordingUrl = (row as any).recordingUrl as string | undefined
    if (!recordingUrl) {
      return { success: false, error: 'No recordingUrl yet — try again later', callActivityId }
    }

    const result = await this.helper.downloadAndStoreRecording({
      callActivityId,
      recordingUrl,
      orgId,
      callSid,
    })
    if (!result) return { success: false, error: 'Recording download failed', callActivityId }
    return { success: true, callActivityId, ...result }
  }
}
