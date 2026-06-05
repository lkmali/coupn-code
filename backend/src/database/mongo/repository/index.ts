// Organization & Configuration
export { MongoOrganizationRepository } from './organization.repository'
export { MongoOrganizationConfigurationRepository } from './organizationConfiguration.repository'
export { MongoOrganizationMasterDataRepository } from './organizationMasterData.repository'
export { MongoCryoSlotAssignmentRepository } from './cryoSlotAssignment.repository'

// Users & Authentication
export { MongoUserRepository } from './user.repository'
export { MongoPasswordRepository } from './password.repository'
export { MongoUsersSessionRepository } from './usersSession.repository'
export { MongoTokenRepository } from './token.repository'

// RBAC (Role-Based Access Control)
export { MongoRoleRepository } from './role.repository'
export { MongoPermissionRepository } from './permission.repository'
export { MongoRolePermissionRepository } from './rolePermission.repository'
export { MongoUserPermissionRepository } from './userPermission.repository'

// Patients & Medical
export { MongoPatientRepository } from './patient.repository'
export { MongoPatientHistoryRepository } from './patientHistory.repository'
export { MongoPatientNoteRepository } from './patientNote.repository'
export { MongoDoctorRepository } from './doctor.repository'
export { MongoReportRepository } from './report.repository'
export {
  MongoAppointmentRepository,
  AppointmentPaginatedInput,
  AppointmentPaginatedResult,
} from './appointment.repository'

// Leads & CRM
export { MongoLeadRepository } from './lead.repository'
export { MongoLeadSocialRepository } from './leadSocial.repository'
export { MongoLeadActivityRepository } from './leadActivity.repository'

// Activities & Tasks
export { MongoActivityRepository } from './activity.repository'
export { MongoCallActivityRepository } from './callActivity.repository'
export { MongoTaskRepository } from './task.repository'
export { MongoTaskHistoryRepository } from './taskHistory.repository'

// Social & Chat
export { MongoSocialContactRepository } from './socialContact.repository'
export { MongoSocialMessageRepository } from './socialMessage.repository'
export { MongoChatHistoryRepository } from './chatHistory.repository'

// Misc
export { MongoAddressRepository } from './address.repository'
export { MongoClientKeyRepository } from './clientKey.repository'
export { MongoAIAnalysisRepository } from './aiAnalysis.repository'
export { MongoS3TempKeyRepository } from './s3TempKey.repository'
export { MongoWhatsappApiResponseRepository } from './whatsappApiResponse.repository'
export { MongoMetaWebhookPayloadRepository } from './metaWebhookPayload.repository'
export { MongoAIErrorRepository } from './aiError.repository'

// Treatment Type

// Treatment Type
export { MongoTreatmentTypeRepository } from './treatmentType.repository'

// Timeline
export { MongoTimelineEventRepository } from './timelineEvent.repository'
// MongoTimelineTaskRepository removed — `timeline_tasks` consolidated into `tasks`.
// MongoTimelineSubtaskRepository removed — `timeline_subtasks` consolidated into Task.subtasks
// (embedded array). Use MongoTaskRepository or the Task model directly for subtask CRUD.

// Lab Tests
export { MongoLabTestRepository } from './labTest.repository'

// Ad Assignment
export { MongoAdAssignmentRepository } from './adAssignment.repository'

// Phone Routing
export { MongoPhoneRoutingRepository } from './phoneRouting.repository'

// Webhook Routing (standalone, no orgId)
export { MongoWebhookRoutingRepository } from './webhookRouting.repository'

// Provider OAuth Tokens (Gmail, Outlook, etc.)
export { MongoProviderOAuthTokenRepository } from './providerOAuthToken.repository'

// Org Emails (synced from connected mail providers)
export { MongoOrgEmailRepository } from './orgEmail.repository'

// User Emails (emails associated with leads/patients)
export { MongoUserEmailRepository } from './userEmail.repository'

// SOP
export { MongoSOPTreatmentTypeRepository } from './sopTreatmentType.repository'
export { MongoSOPEventRepository } from './sopEvent.repository'
export { MongoSOPTaskTemplateRepository } from './sopTaskTemplate.repository'
export { MongoPatientTimelineRepository } from './patientTimeline.repository'

// Patient Timeline (new)
export { MongoTimelineRepository } from './timeline.repository'
export { MongoMedicineRepository } from './medicine.repository'
export { MongoCommentRepository } from './comment.repository'
export { MongoFormResponseRepository } from './formResponse.repository'

// Patient Visits (In/Out Tracking)
export { MongoPatientVisitRepository } from './patientVisit.repository'

// Reminders
export { MongoReminderRepository } from './reminder.repository'

// FollowUps
export { MongoFollowUpRepository, FollowUpFacetInput, FollowUpFacetResult } from './followUp.repository'
export { MongoFollowUpHistoryRepository } from './followUpHistory.repository'

// Organization Media
export { MongoOrgMediaRepository } from './orgMedia.repository'

// Pregnancy & Cycles
export { MongoPregnancyRepository } from './pregnancy.repository'
export { MongoIUICycleRepository } from './iuiCycle.repository'
export { MongoIVFCycleRepository } from './ivfCycle.repository'
export { MongoIVFStimulationRepository } from './ivfStimulation.repository'
export { MongoIVFOPUPickupRepository } from './ivfOpuPickup.repository'
export { MongoIVFSpermRecordRepository } from './ivfSpermRecord.repository'
export { MongoSpermBatchRepository } from './spermBatch.repository'
export { MongoIVFEmbryoRepository } from './ivfEmbryo.repository'
export { MongoIVFOocyteRepository } from './ivfOocyte.repository'
export { MongoIVFOocyteBatchRepository } from './ivfOocyteBatch.repository'
export { MongoIVFETPCycleRepository } from './ivfEtpCycle.repository'
export { MongoIVFTransferRepository } from './ivfTransfer.repository'
export { MongoIVFOutcomeRepository } from './ivfOutcome.repository'
export { MongoIVFPrescriptionRepository } from './ivfPrescription.repository'

// Donors
export { MongoDonorRepository } from './donor.repository'
export { MongoDonorRequestRepository } from './donorRequest.repository'

// Query Options type
export type { MongoQueryOptions } from '../../../typings'
