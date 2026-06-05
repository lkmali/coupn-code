/**
 * ExotelHelperService — owns all Exotel-side side effects on our DB.
 *
 * The thin `ExotelService` talks to Exotel's HTTP APIs. This helper takes
 * the responses (or webhook payloads) and:
 *  - persists `CallActivity` rows linked to the originating lead/patient
 *  - downloads call recordings from Exotel and re-hosts them on our S3
 *  - exposes refreshable presigned URLs the frontend can play
 *
 * Keeping this separate from `ExotelService` keeps the HTTP/auth layer
 * pure and lets the rest of the codebase depend on a single facade for
 * call-activity persistence (e.g. patient/lead services, webhook handler).
 */
import axios from 'axios'
import { isNil } from 'lodash'
import {
  MongoCallActivityRepository,
  MongoLeadRepository,
  ICallActivity,
  toObjectId,
  downloadAndStoreRecording as commonDownloadAndStoreRecording,
  getExotelConfigForOrg,
  buildExotelBasicAuthHeader as commonBuildExotelBasicAuthHeader,
} from '@anantai/common'

// `CallDirection` lives on the model file but isn't re-exported through
// the package barrel — inlining the literal here keeps the helper free
// of cross-package import gymnastics.
const CALL_DIRECTION_OUTBOUND = 'OUTBOUND'
const CALL_DIRECTION_INBOUND = 'INBOUND'

import { LoggerProvider } from '../provider/logger.provider'
import { ExotelStatusCallbackPayload, RecordInboundCallInput, RecordOutboundCallStartedInput, UserProfile } from '../typings'
import {checkUrlIsPublic} from '../utils'
import { S3Service } from './aws/s3.service'

const loggerProvider = LoggerProvider.Instance

// 7-day presigned URL — long enough that the frontend can cache the
// recording link in lead state without immediately re-fetching.
const RECORDING_URL_TTL_SECONDS = 7 * 24 * 60 * 60

export class ExotelHelperService {
  private static instance: ExotelHelperService
  private readonly callActivityRepository: MongoCallActivityRepository
  private readonly leadsRepository: MongoLeadRepository
  private readonly s3Service: S3Service

  private constructor() {
    this.callActivityRepository = new MongoCallActivityRepository()
    this.leadsRepository = new MongoLeadRepository()
    this.s3Service = S3Service.Instance
  }

  /** Public alias for callers that need to decide PENDING vs SKIPPED inline. */
  async isRecordingS3Enabled(orgId?: string): Promise<boolean> {
    if (!orgId) return false
    const cfg = await getExotelConfigForOrg(orgId)
    return !!cfg?.recordingStoreInS3
  }

  /**
   * Build a Basic-auth header for fetching Exotel recordings. Exotel
   * accepts either `apiKey:apiToken` or `customerId:customerSecret` —
   * prefer apiKey/apiToken when present, otherwise fall back to the
   * customer credentials we already use for the Integrations API.
   * Returns null if the org has no Exotel config at all, which is
   * intentionally non-fatal (legacy public-link recordings still work).
   */
  async buildExotelBasicAuthHeader(orgId?: string): Promise<string | null> {
    if (!orgId) return null
    const cfg = await getExotelConfigForOrg(orgId)
    return commonBuildExotelBasicAuthHeader(cfg)
  }

  /**
   * Look up the orgId attached to a CallActivity row so we can fetch
   * the right Exotel credentials when rehosting the recording async.
   */
  async resolveOrgIdFromCallActivity(callActivityId: string): Promise<string | undefined> {
    try {
      const row = await this.callActivityRepository.findById(callActivityId)
      return (row as any)?.orgId?.toString?.()
    } catch {
      return undefined
    }
  }

  static get Instance(): ExotelHelperService {
    if (isNil(this.instance)) this.instance = new ExotelHelperService()
    return this.instance
  }

  // ─── Outbound: log activity at call-initiation time ──────────────────────
  /**
   * Persist a CallActivity row the moment we ask Exotel to start an
   * outbound call. We don't yet know duration/recording — those land via
   * the status callback. The row is keyed by `sid` so the callback can
   * find and update it later.
   */
  async recordOutboundCallStarted(
    input: RecordOutboundCallStartedInput,
  ): Promise<ICallActivity | null> {
    try {
      const data: Partial<ICallActivity> = {
        orgId: toObjectId(input.orgId) as any,
        leadId: input.leadId ? (toObjectId(input.leadId) as any) : undefined,
        patientId: input.patientId ? (toObjectId(input.patientId) as any) : undefined,
        sid: input.callSid,
        callId: input.callSid,
        callStatus: 'INITIATED',
        direction: CALL_DIRECTION_OUTBOUND,
        fromNumber: input.fromNumber,
        toNumber: input.customerNumber,
        createdBy: input.userId ? (toObjectId(input.userId) as any) : undefined,
        updatedBy: input.userId ? (toObjectId(input.userId) as any) : undefined,
      }
      const saved = await this.callActivityRepository.saveCallActivity(data)
      loggerProvider.logger.info('exotel_helper_record_outbound_call_started', {
        sid: input.callSid,
        leadId: input.leadId,
        patientId: input.patientId,
      })
      return saved
    } catch (error: any) {
      loggerProvider.logger.error('recordOutboundCallStarted_Error', {
        message: error?.message,
        stack: error?.stack,
        input,
      })
      // Don't throw — failing to log a CallActivity must not break the
      // outbound-call HTTP response back to the agent's softphone.
      return null
    }
  }

  // ─── Status callback: update activity + kick off recording download ─────
  /**
   * Apply an Exotel status webhook payload to the matching CallActivity.
   * Looks the row up by `sid` (CallSid). If we don't find one — e.g. the
   * call was started outside our flow — we create a fresh row so the
   * recording isn't lost.
   */
  async applyStatusCallback(payload: ExotelStatusCallbackPayload): Promise<{
    callActivityId?: string
    matched: boolean
  }> {
    try {
      const callSid = payload.CallSid
      if (!callSid) {
        loggerProvider.logger.warn('exotel_helper_status_callback_missing_sid', {
          payload,
        })
        return { matched: false }
      }

      const status = payload.Status || payload.CallStatus
      const duration = Number(payload.ConversationDuration ?? payload.DialCallDuration ?? 0) || 0
      // Exotel uses lowercase "completed" for successful calls; everything
      // else (busy/no-answer/failed) gets surfaced as unsuccessful so the
      // UI can render a red badge without parsing free-form strings.
      const callSuccessful = (status || '').toLowerCase() === 'completed'

      const update: Partial<ICallActivity> = {
        callStatus: status,
        callSuccessful,
        callDuration: duration,
        fromNumber: payload.From,
        toNumber: payload.To,
      }
      // Only store the raw Exotel URL if there's one. Mark it PRIVATE
      // because Exotel recording URLs require Basic-auth to fetch — the
      // frontend must go through our auth-proxy endpoint, not open it
      // directly. `downloadAndStoreRecording` flips this to PUBLIC once
      // the file has been rehosted on our S3 bucket.
      if (payload.RecordingUrl) {
        update.recordingUrl = payload.RecordingUrl
        update.recordingUrlType = await checkUrlIsPublic(payload.RecordingUrl)
      }

      const existing = await this.callActivityRepository.getCallActivity({ sid: callSid })

      let callActivityId: string | undefined
      if (existing) {
        // Webhook only persists the Exotel URL; the rehost Lambda picks up
        // rows where `recordingS3Key` is null and the org has opted in.
        await this.callActivityRepository.updateCallActivity({ sid: callSid }, update)
        callActivityId = (existing as any)._id?.toString() || (existing as any).callActivityId?.toString()
        // Inbound calls drive the Lead.hasMissedCall flag the leads-list
        // "Missed Calls" filter reads. Outbound miss/no-answer is tracked
        // separately via lead status NOT_PICKUP.
        if (existing.leadId && existing.direction === CALL_DIRECTION_INBOUND) {
          await this.leadsRepository.updateLead(
            { _id: existing.leadId },
            { hasMissedCall: !callSuccessful, lastActivityAt: new Date() },
          )
        }
      } else {
        // No row yet — create one. We don't know orgId for an unknown call,
        // so we leave it blank and let the next API touch fill it. Upstream
        // logging will flag the orphan.
        loggerProvider.logger.warn('exotel_helper_status_callback_orphan_call', { callSid })
      }

      return { matched: !!existing, callActivityId }
    } catch (error: any) {
      loggerProvider.logger.error('applyStatusCallback_Error', {
        message: error?.message,
        stack: error?.stack,
        payload,
      })
      return { matched: false }
    }
  }

  // ─── Recording: download from Exotel + re-host on our S3 ────────────────
  /**
   * Stream the recording at `recordingUrl` (Exotel's CDN, requires their
   * basic-auth header to fetch) into our S3 bucket and stamp the resulting
   * key onto the CallActivity row. The frontend then plays it through our
   * presigned URL — no Exotel login needed.
   *
   * Gated on `exotelConfiguration.recordingStoreInS3` — a no-op when the
   * org hasn't opted into S3 rehosting.
   *
   * S3 key layout: `call-recordings/{orgId}/{YYYY}/{MM}/{DD}/{callSid}.{ext}`.
   */
  async downloadAndStoreRecording(input: {
    callActivityId: string
    recordingUrl: string
    orgId: string
    callSid?: string
  }): Promise<{ s3Key: string; publicUrl: string } | null> {
    const s3 = this.s3Service
    const result = await commonDownloadAndStoreRecording({
      callActivityId: input.callActivityId,
      recordingUrl: input.recordingUrl,
      orgId: input.orgId,
      callSid: input.callSid,
      repo: this.callActivityRepository,
      uploadBuffer: (buffer, key, contentType) => s3.uploadBufferToS3(buffer, key, contentType).then(() => undefined),
      buildPublicUrl: (key) => s3.getPublicDownloadSignedUrl(key, RECORDING_URL_TTL_SECONDS),
    })
    if (result) {
      loggerProvider.logger.info('exotel_helper_recording_stored', {
        callActivityId: input.callActivityId,
        s3Key: result.s3Key,
      })
    }
    return result
  }

  // ─── Call status lookup (polling endpoint) ──────────────────────────────
  /**
   * Find a CallActivity by Exotel CallSid. Returns a narrow view with
   * just the fields the frontend needs for polling: status, duration,
   * recording URL + its type (PUBLIC/PRIVATE), timestamps. Null if no
   * row exists yet — webhook may not have fired.
   */
  async getCallStatusBySid(
    callSid: string,
    orgId: string,
  ): Promise<{
    callActivityId: string
    sid: string
    callStatus: string | null
    callSuccessful: boolean
    callDuration: number
    fromNumber: string | null
    toNumber: string | null
    direction: string
    recordingUrl: string | null
    recordingUrlType: 'PUBLIC' | 'PRIVATE' | null
    createdAt: Date
    updatedAt: Date
  } | null> {
    const row = await this.callActivityRepository.getCallActivity({
      sid: callSid,
      orgId: toObjectId(orgId) as any,
    }) as ICallActivity | null
    if (!row) return null
    return {
      callActivityId: (row as any)._id?.toString?.() ?? (row as any).callActivityId?.toString?.(),
      sid: row.sid || callSid,
      callStatus: row.callStatus || null,
      callSuccessful: !!row.callSuccessful,
      callDuration: row.callDuration || 0,
      fromNumber: row.fromNumber || null,
      toNumber: row.toNumber || null,
      direction: row.direction,
      recordingUrl: row.recordingUrl || null,
      recordingUrlType: (row as any).recordingUrlType || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  // ─── Auth-proxy: stream a private Exotel recording to the caller ────────
  /**
   * Fetch a recording from its original Exotel URL using Basic-auth and
   * return the raw stream + content-type so the controller can pipe it
   * straight to the HTTP response. Used when `recordingUrlType === 'PRIVATE'`
   * — the frontend hits our proxy instead of opening the URL directly,
   * because the browser can't send Exotel's Basic-auth header.
   */
  async streamPrivateRecording(callActivityId: string): Promise<{
    stream: NodeJS.ReadableStream
    contentType: string
  } | null> {
    try {
      const activity = (await this.callActivityRepository.findOne(
        { _id: toObjectId(callActivityId) as any }
      )) as ICallActivity | null
      if (!activity) return null


      if (!activity.recordingUrl) return null

      const authHeader = await this.buildExotelBasicAuthHeader(
        (activity as any).orgId?.toString?.(),
      )

      // Exotel's recording CDN returns transient 404/5xx — either right
      // after a call ends (file not yet finalized) or sporadically for
      // older recordings. Retry a few times before surfacing a failure so
      // the frontend doesn't see a 404 for a recording that's actually
      // there in our DB.
      const retryDelaysMs = [0, 1500, 3500]
      let lastErr: any = null
      for (let i = 0; i < retryDelaysMs.length; i++) {
        if (retryDelaysMs[i] > 0) {
          await new Promise((r) => setTimeout(r, retryDelaysMs[i]))
        }
        try {
          const res = await axios.get(activity.recordingUrl, {
            responseType: 'stream',
            headers: authHeader ? { Authorization: authHeader } : undefined,
            timeout: 15000,
          })
          return {
            stream: res.data as NodeJS.ReadableStream,
            contentType: res.headers['content-type'] || 'audio/mpeg',
          }
        } catch (err: any) {
          lastErr = err
          const status = err?.response?.status
          // Only retry on transient upstream errors. Auth/permission
          // failures (401/403) won't resolve by retrying.
          const isTransient = !status || status === 404 || status >= 500
          if (!isTransient) break
        }
      }
      loggerProvider.logger.error('streamPrivateRecording_Error', {
        message: lastErr?.message,
        status: lastErr?.response?.status,
        callActivityId,
      })
      return null
    } catch (error: any) {
      loggerProvider.logger.error('streamPrivateRecording_Error', {
        message: error?.message,
        stack: error?.stack,
        callActivityId,
      })
      return null
    }
  }

  // ─── Refresh a presigned URL for an existing recording ──────────────────

  // ─── Read helpers used by lead/patient detail responses ─────────────────
  async listCallActivitiesForLead(leadId: string, orgId: string): Promise<ICallActivity[]> {
    return this.callActivityRepository.getCallActivities(
      { leadId: toObjectId(leadId) as any, orgId: toObjectId(orgId) as any },
      { sort: { createdAt: -1 } },
    )
  }

  /**
   * Convenience used by the outbound-call controller — wraps
   * `recordOutboundCallStarted` so callers don't have to repeat the
   * orgId/userId plumbing from `userProfile`.
   */
  async logOutboundCallFromProfile(
    userProfile: UserProfile,
    customerNumber: string,
    callSid: string,
    leadId?: string,
    patientId?: string,
    fromNumber?: string,
  ): Promise<void> {
    if (!callSid || !userProfile?.orgId) return
    await this.recordOutboundCallStarted({
      orgId: String(userProfile.orgId),
      userId: userProfile.userId ? String(userProfile.userId) : undefined,
      leadId,
      patientId,
      customerNumber,
      callSid,
      fromNumber,
    })
  }

  /**
   * Persist a CallActivity row for an inbound call. Called by the
   * incoming-call webhook after phone routing resolves the assigned user.
   * The status callback will later update duration/recording via `sid`.
   */
  async recordInboundCall(
    input: RecordInboundCallInput,
  ): Promise<ICallActivity | null> {
    try {
      const data: Partial<ICallActivity> = {
        orgId: toObjectId(input.orgId) as any,
        leadId: input.leadId ? (toObjectId(input.leadId) as any) : undefined,
        sid: input.callSid,
        callId: input.callSid,
        callStatus: 'RINGING',
        direction: CALL_DIRECTION_INBOUND,
        fromNumber: input.fromNumber,
        toNumber: input.toNumber,
        createdBy: input.userId ? (toObjectId(input.userId) as any) : undefined,
        updatedBy: input.userId ? (toObjectId(input.userId) as any) : undefined,
      }
      const saved = await this.callActivityRepository.saveCallActivity(data)
      loggerProvider.logger.info('exotel_helper_record_inbound_call', {
        sid: input.callSid,
        leadId: input.leadId,
      })
      return saved
    } catch (error: any) {
      loggerProvider.logger.error('recordInboundCall_Error', {
        message: error?.message,
        stack: error?.stack,
        input,
      })
      return null
    }
  }
}
