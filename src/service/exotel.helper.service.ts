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
import { isNil } from 'lodash'
import {getExotelConfigForOrg,buildExotelBasicAuthHeader} from '../utils'





export class ExotelHelperService {
  private static instance: ExotelHelperService


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
    return buildExotelBasicAuthHeader(cfg)
  }

  static get Instance(): ExotelHelperService {
    if (isNil(this.instance)) this.instance = new ExotelHelperService()
    return this.instance
  }




 
}
