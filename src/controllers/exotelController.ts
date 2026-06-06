import { JsonController, Post, Body, Get, Req, Res, Param } from 'routing-controllers'
import { Request, Response } from 'express'

import { ExotelService } from '../service/exotel.service'
import { Authentication, CurrentUser } from '../decorators'
import { AuthenticationStrategyType, UserProfile } from '../typings'
import { ExotelOutboundCallDto, ExotelAvailabilityDto } from '../dto'
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
   * Toggle the current agent's availability for inbound calls. Used by the
   * softphone widget when the user clicks "Go online" / "Go offline". Agents
   * with isAvailable === false are skipped by the inbound agent picker.
   */
  @Post('/availability')
  
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
}
