import { JsonController, Post, Body, Get, Req, Res, Param, QueryParam } from 'routing-controllers'
import { Request, Response } from 'express'

import { ExotelService } from '../service/exotel.service'
import { Authentication, Authorize, CurrentUser } from '../decorators'
import { AuthenticationStrategyType, UserProfile } from '../typings'
import { HospitalRole } from '../config'
import { ExotelOutboundCallDto, ExotelCallLogDto, ExotelAvailabilityDto } from '../dto'
import { OpenAPI } from 'routing-controllers-openapi'

@JsonController('/exotel')
export class ExotelController {
  private exotelService = ExotelService.Instance

  /**
   * Initialize Exotel for the current user.
   * Returns SIP credentials when the org has Exotel enabled, otherwise
   * returns { sipCredentials: null } so the frontend can hide the softphone UI.
   */
  @Get('/init')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Initialize Exotel for current user',
    tags: ['Exotel'],
    description:
      'Returns SIP credentials for the authenticated user. If the org has no Exotel configuration or it is disabled, returns { sipCredentials: null }.',
  })
  async init(@CurrentUser() userProfile: UserProfile) {
    return await this.exotelService.init(userProfile)
  }

  /**
   * Clear the user's Exotel mapping (DB + Exotel-side) so the next
   * /init call provisions fresh credentials. Frontend invokes this
   * when the SIP server rejects the cached secret (401 auth-loop).
   */
  @Post('/agent/unregister')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Unregister current user from Exotel',
    tags: ['Exotel'],
    description:
      "Wipes the user's Exotel SIP mapping on both Exotel (DELETE /usermapping) and our DB ($unset user.exotel). Idempotent — safe to call when no mapping exists.",
  })
  async unregisterAgent(@CurrentUser() userProfile: UserProfile) {
    return await this.exotelService.unregisterAgent(userProfile)
  }

  /**
   * Initiate an outbound call via Exotel.
   */
  @Post('/calls/outbound')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Make an outbound call',
    tags: ['Exotel'],
    description:
      'Initiates an outbound call via Exotel. Optionally links the call to a lead or patient record for tracking.',
  })
  async makeOutboundCall(
    @Body() body: ExotelOutboundCallDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.makeOutboundCall(body, userProfile)
  }

  /**
   * Hang up an in-flight call by Exotel CallSid. The frontend invokes this
   * when the agent clicks "End Call" — terminates the call on Exotel's side
   * (not just the local UI) and updates the matching CallActivity.
   */
  @Post('/calls/:callSid/hangup')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Hang up an in-flight call',
    tags: ['Exotel'],
  })
  async hangupCall(
    @Param('callSid') callSid: string,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.hangupCall(callSid, userProfile)
  }

  /**
   * Log a call activity (used by the frontend SDK after a call ends).
   */
  @Post('/calls/log')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Log a call record',
    tags: ['Exotel'],
    description: 'Logs a call activity with status, direction and duration.',
  })
  async logCall(
    @Body() body: ExotelCallLogDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.logCall(body, userProfile)
  }

  /**
   * Toggle the current agent's availability for inbound calls. Used by the
   * softphone widget when the user clicks "Go online" / "Go offline". Agents
   * with isAvailable === false are skipped by the inbound agent picker.
   */
  @Post('/availability')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Set agent availability for inbound calls',
    tags: ['Exotel'],
  })
  async setAvailability(
    @Body() body: ExotelAvailabilityDto,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.setAvailability(body.isAvailable, userProfile)
  }

  /**
   * Inbound call webhook — invoked by Exotel when a customer calls the
   * virtual number. The `:token` segment is a per-org shared secret stored
   * on `OrganizationConfiguration.exotelConfiguration.webhookToken`; it
   * identifies the org *and* authenticates the request without a header.
   * Configure the Exotel callback URL as
   *   `<BACKEND_URL>/api/exotel/webhooks/incoming/<webhookToken>`.
   * Responds with the Exotel XML routing the call to the agent's SIP device.
   * No bearer auth — Exotel posts directly.
   */
  @Post('/webhooks/incoming/:token')
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  @OpenAPI({
    summary: 'Inbound call webhook',
    tags: ['Exotel Webhooks'],
    description:
      'Webhook called by Exotel when an inbound call is received. The :token path segment is the per-org webhookToken and is required.',
  })
  async incomingCallWebhook(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.exotelService.handleIncomingCallWebhook(token, req, res)
  }

  /**
   * Status / recording callback — invoked by Exotel at the end of every call
   * with CallSid, Status, ConversationDuration, RecordingUrl, etc. We update
   * the matching CallActivity and re-host the recording on our S3.
   * No auth — called directly by Exotel infrastructure.
   */
  @Post('/webhooks/status')
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  @OpenAPI({
    summary: 'Call status / recording callback',
    tags: ['Exotel Webhooks'],
    description:
      'Webhook called by Exotel after a call ends. Updates CallActivity with final status, duration, and downloads the recording into our S3 so admins can play it without an Exotel login.',
  })
  async statusCallbackWebhook(@Req() req: Request, @Res() res: Response) {
    return await this.exotelService.handleStatusCallback(req, res)
  }

  /**
   * Public recording callback — invoked by Exotel (or any upstream system)
   * once a call recording is ready. Same payload shape as `/webhooks/status`
   * (CallSid + RecordingUrl), but split out so the recording pipeline can
   * be wired to a dedicated webhook from the Exotel dashboard. Downloads
   * the recording into our S3 and stamps the matching CallActivity.
   * No auth — called directly by Exotel infrastructure.
   */
  @Post('/webhooks/recording')
  @Authentication(AuthenticationStrategyType.NO_AUTH)
  @OpenAPI({
    summary: 'Public call-recording callback',
    tags: ['Exotel Webhooks'],
    description:
      'Public webhook that accepts Exotel call-recording callbacks. Body should include CallSid and RecordingUrl. Downloads the recording into our S3 bucket and links it to the matching CallActivity.',
  })
  async recordingCallbackWebhook(@Req() req: Request, @Res() res: Response) {
    return await this.exotelService.handleRecordingCallback(req, res)
  }

  /**
   * GET /api/exotel/calls/status/:callSid
   * Poll the latest state of a call from our DB (fed by the Exotel
   * status webhook). Returns null if no row exists yet — the webhook
   * may not have fired. Use `recordingUrlType` to decide whether the
   * frontend can open `recordingUrl` directly (PUBLIC) or has to route
   * through the auth-proxy stream endpoint (PRIVATE).
   */
  @Get('/calls/status/:callSid')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Get latest call status by Exotel CallSid',
    tags: ['Exotel'],
    description:
      'Returns the latest CallActivity state for a given Exotel CallSid. Intended for UI polling. Includes status, duration, from/to, and recording URL + URL type (PUBLIC = S3 presigned, PRIVATE = needs auth-proxy).',
  })
  async getCallStatus(
    @Param('callSid') callSid: string,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.getCallStatus(callSid, userProfile)
  }

  /**
   * GET /api/exotel/calls/:callSid/fetch
   * Fetch call details directly from Exotel's API and sync to our DB.
   * Use this after a call disconnects as a fallback when the webhook
   * hasn't fired — retrieves status, duration, and recording URL from
   * Exotel and updates (or creates) the CallActivity record. Also
   * triggers async recording download to S3.
   */
  @Get('/calls/:callSid/fetch')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Fetch call details from Exotel API and sync to DB',
    tags: ['Exotel'],
    description:
      'Fetches call status, duration, and recording URL directly from the Exotel API (GET /call/{callSid}). Updates the matching CallActivity in our DB. Use as a fallback after disconnect if the webhook was missed.',
  })
  async fetchCallDetails(
    @Param('callSid') callSid: string,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.fetchAndSyncCallDetails(callSid, userProfile)
  }

  /**
   * POST /api/exotel/calls/:callSid/download-recording
   * Trigger-on-demand recording download. The frontend calls this ~5s
   * after a call completes (a deterministic nudge alongside the async
   * status webhook). Syncs call details from Exotel, then rehosts the
   * recording to S3 if the org has `recordingStoreInS3` enabled and the
   * row doesn't already have an `recordingS3Key`.
   */
  @Post('/calls/:callSid/download-recording')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Download a single call recording to S3 by CallSid',
    tags: ['Exotel'],
    description:
      'Invoked by the frontend ~5 seconds after a call completes. Syncs details from Exotel and rehosts the recording to S3. Skips if already uploaded or if the org has not enabled S3 recording storage.',
  })
  async downloadRecordingByCallSid(
    @Param('callSid') callSid: string,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.downloadRecordingByCallSid(callSid, userProfile)
  }

  /**
   * GET /api/exotel/call-activities?leadId=…
   * Returns call activities for a given lead. Recording URLs are never
   * exposed — instead a `recordingAvailable` boolean flag is returned.
   * The frontend uses the stream endpoint to play recordings on demand.
   */
  @Get('/call-activities')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'List call activities for a lead',
    tags: ['Exotel'],
    description:
      'Returns call activities for a lead without exposing recording URLs. Use the stream endpoint to play recordings.',
  })
  async getCallActivities(
    @QueryParam('leadId') leadId: string,
    @CurrentUser() userProfile: UserProfile,
  ) {
    return await this.exotelService.getCallActivitiesByLeadId(leadId, userProfile)
  }

  /**
   * GET /api/exotel/recordings/:callActivityId/stream
   * Authenticated proxy that fetches the recording from Exotel (or our
   * rehosted S3 copy) and pipes the audio stream back to the client.
   * Needed because Exotel recording URLs are Basic-auth-protected — the
   * browser can't add that header itself, so it hits our backend which
   * attaches the org's Exotel credentials and forwards the bytes.
   *
   * For a PUBLIC recording (already rehosted on our S3) we simply proxy
   * the presigned URL for consistency so the frontend only ever calls
   * one endpoint regardless of recording state.
   */
  @Get('/recordings/:callActivityId/stream')
  @Authorize(HospitalRole)
  @OpenAPI({
    summary: 'Stream a call recording through the authenticated proxy',
    tags: ['Exotel'],
    description:
      'Streams the recording audio bytes back to the client. Use this for PRIVATE recordings (raw Exotel URLs that need Basic-auth).',
  })
  async streamRecording(
    @Param('callActivityId') callActivityId: string,
    @Res() res: Response,
  ) {
    const result = await this.exotelService.streamRecording(callActivityId)
    if (!result) {
      res.status(404).json({ message: 'Recording not available' })
      return res
    }
    res.setHeader('Content-Type', result.contentType)
    res.setHeader('Cache-Control', 'private, max-age=300')
    result.stream.pipe(res)
    return res
  }
}
