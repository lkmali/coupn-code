import {
  getMongoSearchQuery,
  getStartEndDate,
  getMobileWithCountryCode,
  prepareErrorMessageForAgents,
  removeZeroValues,
  resolveDoctorId,
  resolvePatientId,
  resolveUserId,
  badRequest,
  notFoundData,
} from '../../utils'
import {
  AppointmentService,
  PatientService,
  PatientsHistoryService,
  DoctorService,
  TasksService,
  LeadService,
  ActivityService,
} from '../../service'
import { SocialService } from '../../service/social.service'
import { SOPService } from '../../service/sop/sop.service'
import { AppointmentStatus, ITask, LeadSource, UserProfile } from '../../typings'
import { validateToolInput } from './joiSchema'
import { omit, pick } from 'lodash'
import { GetAppointmentQueryDto } from '../../dto'
import { LoggerProvider } from '../../provider'
const logger = LoggerProvider.Instance.logger

const OPEN_TASK_STATUSES = ['PENDING', 'NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD']
export const CLOSED_TASK_STATUSES = ['COMPLETED', 'CANCELLED']

// Slim a task row for list responses. Drops form schemas, form data, sub-schemas,
// audit/system fields — anything the FE List card doesn't render. Keeps wire size
// comparable to a lead record so the LLM iteration doesn't blow the Gemini token
// quota. Per-task detail (formConfig, formData, etc.) is fetched via getTask.
function slimTaskForList(t: any): any {
  if (!t || typeof t !== 'object') return t
  return {
    _id: t._id,
    taskId: t.taskId,
    taskNumber: t.taskNumber,
    title: t.title,
    description: typeof t.description === 'string' ? t.description.slice(0, 200) : t.description,
    status: t.status,
    priority: t.priority,
    category: t.category,
    taskType: t.taskType,
    dueDate: t.dueDate,
    visibility: t.visibility,
    tags: t.tags,
    patientId: t.patientId,
    patientName: t.patientName,
    assignToUserId: t.assignToUserId,
    assignedTo: t.assignedTo,
    assignedUser: t.assignedUser,
    createdAt: t.createdAt,
  }
}
const slimTaskList = (rows: any[]): any[] => (Array.isArray(rows) ? rows.map(slimTaskForList) : rows)

// Resolve a task reference from a Mongo ObjectId (taskId), the human-friendly
// taskNumber the UI shows ("TASK-000695" → 695), or — as a natural-language
// fallback — a combination of title + patient/assignee context. The fallback
// lets one-shot voice/chat commands like "mark Embryologist Consultation for
// Laxman as completed" resolve without forcing the LLM to chain listTasks +
// markTaskCompleted. All lookups go through TasksService.getTasks which is
// already org-scoped, so we don't bypass the tenant guard.
async function resolveTaskRef(
  args: {
    taskId?: string
    taskNumber?: number | string
    title?: string
    patientId?: string
    patientName?: string
    userId?: string
    userName?: string
  },
  orgId: string,
): Promise<string> {
  if (args.taskId) return String(args.taskId)
  if (args.taskNumber !== undefined && args.taskNumber !== null && args.taskNumber !== '') {
    const numStr = String(args.taskNumber).replace(/[^0-9]/g, '')
    if (!numStr) throw badRequest('Invalid taskNumber')
    const num = Number(numStr)
    const result: any = await TasksService.Instance.getTasks({ orgId, search: numStr, limit: 5 })
    const matches = ((result?.data || []) as any[]).filter((t: any) => Number(t.taskNumber) === num)
    if (!matches.length) throw notFoundData('Task not found')
    return String(matches[0]._id || matches[0].taskId)
  }

  if (args.title || args.patientId || args.patientName || args.userId || args.userName) {
    const query: any = { orgId, limit: 50 }
    if (args.title) query.search = args.title
    if (args.patientId || args.patientName) {
      query.patientId = await resolvePatientId(
        { patientId: args.patientId, patientName: args.patientName },
        orgId,
      )
    }
    if (args.userId || args.userName) {
      query.assignToUserId = await resolveUserId(
        { userId: args.userId, userName: args.userName } as any,
        orgId,
      )
    }
    const result: any = await TasksService.Instance.getTasks(query)
    let rows: any[] = result?.data || []
    // Prefer open tasks when both open and closed match — "mark X complete" rarely targets an already-closed task.
    const openRows = rows.filter((t: any) => OPEN_TASK_STATUSES.includes(String(t.status).toUpperCase()))
    if (openRows.length) rows = openRows
    if (!rows.length) throw notFoundData('Task not found')
    if (rows.length > 1) {
      const preview = rows
        .slice(0, 5)
        .map((t: any) => `#${t.taskNumber} "${t.title}" (status:${t.status}, due:${t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '—'})`)
        .join('; ')
      throw badRequest(`Multiple tasks match — please specify by taskNumber. Candidates: ${preview}`)
    }
    return String(rows[0]._id || rows[0].taskId)
  }

  throw badRequest('taskId or taskNumber is required')
}

export function dayBoundsUTC(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function handleToolCall(toolName: string, body: any, userProfile: UserProfile) {
  console.log(`[MCP-HANDLER] 🎯 Handler received tool call: ${toolName}`)
  logger.info('Handling tool call:', { toolName, body })
  try {
    const args = removeZeroValues(body) as any
    console.log(`[MCP-HANDLER] 📋 Validating input for: ${toolName}`)
    validateToolInput(toolName, args)
    console.log(`[MCP-HANDLER] ✅ Validation passed, executing: ${toolName}`)
    switch (toolName) {
      case 'addNewPatients':
        return PatientService.Instance.saveNewPatient(args, userProfile)

      case 'addNewDoctor':
        return DoctorService.Instance.saveNewDoctor(args, userProfile)

      case 'listDoctors':
        let drQuery: any = {}
        if (args.mobileNumber) {
          drQuery['mobileNumber'] = args.mobileNumber
        } else if (args.name || args.specialization) {
          drQuery = getMongoSearchQuery(args.name || args.specialization, ['name', 'specialization'])
        } else if (args.doctorId) {
          drQuery['_id'] = args.doctorId
        }
        return await DoctorService.Instance.listDoctors({ ...drQuery, orgId: userProfile.orgId })

      case 'listPatient':
        console.log(`[MCP-HANDLER] 🔍 Executing listPatient query`)
        let patientQuery: any = {}
        if (args.mobileNumber) {
          patientQuery['mobileNumber'] = args.mobileNumber
        } else if (args.name) {
          patientQuery = getMongoSearchQuery(args.name, ['name'])
        } else if (args.patientId) {
          patientQuery['_id'] = args.patientId
        }
        console.log(`[MCP-HANDLER] 🔍 Query prepared:`, patientQuery)
        const patientResult = await PatientService.Instance.getPatient({ ...patientQuery, orgId: userProfile.orgId })
        console.log(`[MCP-HANDLER] ✅ listPatient completed, records: ${patientResult?.length || 0}`)
        return patientResult

      case 'getPatientReports': {
        const patientId = await resolvePatientId(
          {
            patientId: args.patientId,
            patientName: args.patientName,
          },
          userProfile.orgId,
        )

        return PatientService.Instance.getReport({ patientId, orgId: userProfile.orgId })
      }

      case 'addPatientHistory': {
        const patientId = await resolvePatientId(
          {
            patientId: args.patientId,
            patientName: args.patientName,
          },
          userProfile.orgId,
        )
        const doctorId = await resolveDoctorId(
          {
            doctorId: args.doctorId,
            doctorName: args.doctorName,
          },
          userProfile.orgId,
        )
        return PatientsHistoryService.Instance.addPatientHistory({
          patientId,
          doctorId,
          orgId: userProfile.orgId,
          history: args.history,
          condition: args.condition,
          reportIds: [],
          createdBy: userProfile.userId,
          updatedBy: userProfile.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      case 'getPatientHistory': {
        const patientId = await resolvePatientId(
          {
            patientId: args.patientId,
            patientName: args.patientName,
          },
          userProfile.orgId,
        )
        return await PatientsHistoryService.Instance.getPatientHistory({ patientId, orgId: userProfile.orgId })
      }

      case 'bookAppointment': {
        const body: any = pick(args, ['description', 'appointmentType', 'duration', 'source'])
        const mobileWithCountryCode = args.mobileNumber
        const referenceId = args.mobileNumber

        body['referenceId'] = referenceId
        console.log(`[MCP-HANDLER] 📅 Booking appointment for referenceId: `, referenceId, mobileWithCountryCode)
        if (!body['patientId'] && !body['doctorId'] && !body['referenceId']) {
          throw new Error('At least one of patientId, doctorId or leadId must be provided')
        }

        return await AppointmentService.Instance.reScheduleAppointments(
          {
            ...body,
            ...getStartEndDate(args.appointmentDate),
            referenceId,
            orgId: userProfile.orgId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userProfile.userId,
            updatedBy: userProfile.userId,
          },
          userProfile,
        )
      }

      case 'getAppointments': {
        const filterQuery = { orgId: userProfile.orgId,...pick(args, ['needAllTimeList']) } as GetAppointmentQueryDto
        if (args.mobileNumber) {
          const referenceId = args.mobileNumber
          filterQuery['referenceId'] = referenceId
        }
        if (args.status) filterQuery['status'] = args.status
        // No status hard-coded here. The system prompt explicitly tells the LLM to
        // call this tool WITHOUT a status filter so it can reason over PENDING /
        // COMPLETED / CANCELLED in the same response ("show all appointments",
        // "no-show rate", "cancellations today"). The previous override pinned every
        // call to PENDING, which hid completed/cancelled rows even when the user
        // asked for them.
        const result = await AppointmentService.Instance.getAppointments(filterQuery, userProfile)
        return result
      }

      case 'checkAvailability': {
        console.log('Args for checkAvailability:', args)
        return await AppointmentService.Instance.getAvailableSlotsByDate(
          { appointmentDate: args.appointmentDate },
          userProfile,
        )
      }

      case 'cancelAppointment': {
        const query: any = { orgId: userProfile.orgId, ...pick(args, ['appointmentId']) }
        if (args.mobileNumber) {
          const referenceId = args.mobileNumber
          query['referenceId'] = referenceId
        }
        if (!query['appointmentId'] && !query['referenceId']) {
          throw new Error('At least one of appointmentId or mobileNumber must be provided')
        }
        return await AppointmentService.Instance.cancelAppointment(
          query,
          args.reason || 'Cancelled by agent',
          userProfile,
          args.source ?? LeadSource.OTHER,
        )
      }

      case 'rescheduleAppointment': {
        const body: any = pick(args, ['description', 'appointmentType', 'duration', 'source'])
        const referenceId = args.mobileNumber

        if (!referenceId) {
          throw new Error('At least one of appointmentId or mobileNumber must be provided')
        }

        return await AppointmentService.Instance.reScheduleAppointments(
          {
            ...body,
            ...getStartEndDate(args.appointmentDate),
            referenceId,
            orgId: userProfile.orgId,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userProfile.userId,
            updatedBy: userProfile.userId,
          },
          userProfile,
        )
      }

      case 'createTask':
      case 'addNewTask': {
        const userId = await resolveUserId(
          {
            userId: args.userId,
            userName: args.userName,
          },
          userProfile.orgId,
        )

        const data: Omit<ITask, 'taskId'> = {
          assignToUserId: userId,
          title: args.title,
          description: args.description,
          priority: args.priority,
          orgId: userProfile.orgId,
          dueDate: new Date(args.dueDate),
          category: args.category,
          createdBy: userProfile.userId,
          updatedBy: userProfile.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: AppointmentStatus.PENDING,
        }
        if (args.patientId || args.patientName) {
          const patientId = await resolvePatientId(
            {
              patientId: args.patientId,
              patientName: args.patientName,
            },
            userProfile.orgId,
          )
          data['patientId'] = patientId
        }

        return await TasksService.Instance.saveTasks(data)
      }

      case 'getTasks': {
        const filterQuery: any = { orgId: userProfile.orgId }
        if (args.userId || args.userName) {
          filterQuery['assignToUserId'] = await resolveUserId(
            {
              userId: args.userId,
              userName: args.userName,
            },
            userProfile.orgId,
          )
        }

        if (args.status) filterQuery['status'] = args.status
        // getTasks now returns a pagination envelope; MCP consumers expect
        // an array, so unwrap.
        const result: any = await TasksService.Instance.getTasks(filterQuery)
        return slimTaskList(result?.data ?? result ?? [])
      }

      // ==================== Task Tools (extended) ====================
      // The legacy `addNewTask` / `getTasks` cases above are kept verbatim for
      // backward compatibility with existing LLM prompts. The richer cases below
      // mirror the REST controller surface (update/delete/status/history/subtask)
      // and add three convenience scopes (today/pending/overdue) plus a
      // structured `summarizeTasks` aggregator the LLM can narrate.

      case 'updateTask': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        const update: any = pick(args, ['title', 'description', 'priority', 'category'])
        if (args.dueDate) update.dueDate = new Date(args.dueDate)
        if (args.userId || args.userName) {
          update.assignToUserId = await resolveUserId(
            { userId: args.userId, userName: args.userName },
            userProfile.orgId,
          )
        }
        return await TasksService.Instance.updateTask(
          taskId,
          update,
          userProfile.userId as any,
          userProfile.orgId,
        )
      }

      case 'deleteTask': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        return await TasksService.Instance.deleteTask(
          taskId,
          userProfile.userId as any,
          userProfile.orgId,
        )
      }

      case 'getTask': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        // getTaskWithForm returns { data, parent? } and also live-merges the
        // form config for pending tasks, which is the most useful single-task
        // shape for an LLM/UI to consume.
        return await TasksService.Instance.getTaskWithForm(taskId, userProfile)
      }

      case 'listTasks': {
        const query: any = { ...args, orgId: userProfile.orgId }
        if (args.userId || args.userName) {
          query.assignToUserId = await resolveUserId(
            { userId: args.userId, userName: args.userName },
            userProfile.orgId,
          )
          delete query.userId
          delete query.userName
        }
        if (args.patientId || args.patientName) {
          query.patientId = await resolvePatientId(
            { patientId: args.patientId, patientName: args.patientName },
            userProfile.orgId,
          )
          delete query.patientName
        }
        const result: any = await TasksService.Instance.getTasks(query)
        return slimTaskList(result?.data ?? [])
      }

      case 'markTaskCompleted': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        // NOTE: TasksService.markComplete filters by assignToUserId === caller,
        // so an admin marking someone else's task complete should call
        // updateTaskStatus({status:'COMPLETED'}) instead. Documented in the tool
        // description so the LLM can pick correctly.
        return await TasksService.Instance.markComplete(
          taskId,
          userProfile.userId as any,
          userProfile.orgId,
        )
      }

      case 'updateTaskStatus': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        if (!args.status) throw badRequest('status is required')
        return await TasksService.Instance.updateStatus(
          taskId,
          args.status,
          userProfile.userId as any,
          userProfile.orgId,
        )
      }

      case 'getTodaysTasks':
      case 'getPendingTasks':
      case 'getOverdueTasks': {
        const scope =
          toolName === 'getTodaysTasks' ? 'today' : toolName === 'getOverdueTasks' ? 'overdue' : 'pending'
        const limit = Number(args.limit) > 0 ? Math.min(200, Number(args.limit)) : 50
        const query: any = { orgId: userProfile.orgId, scope, limit }
        if (scope === 'overdue') {
          query.sortBy = 'dueDate'
          query.orderBy = 'ASC'
        }
        if (args.userId || args.userName) {
          query.assignToUserId = await resolveUserId(
            { userId: args.userId, userName: args.userName },
            userProfile.orgId,
          )
        }
        const result: any = await TasksService.Instance.getTasks(query)
        return slimTaskList(result?.data ?? [])
      }

      case 'getTaskHistory': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        const opts = pick(args, ['skip', 'limit'])
        return await TasksService.Instance.getTaskHistory(taskId, userProfile.orgId, opts)
      }

      case 'addTaskSubtask': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        if (!args.title) throw badRequest('Subtask title is required')
        return await TasksService.Instance.addSubtask(
          taskId,
          args.title,
          userProfile.userId as any,
          userProfile.orgId,
        )
      }

      case 'updateTaskSubtask': {
        const taskId = await resolveTaskRef(args, userProfile.orgId)
        if (!args.subtaskId) throw badRequest('subtaskId is required')
        // Pick only fields the service permits — title / completed / status.
        // Stamp completedAt server-side when the caller flips completed=true so
        // history is consistent even if the LLM forgets to pass a timestamp.
        const data: any = {}
        if (args.title !== undefined) data.title = args.title
        if (args.completed !== undefined) {
          data.completed = !!args.completed
          if (args.completed) data.completedAt = new Date()
          else data.completedAt = null
        }
        if (args.status !== undefined) data.status = args.status
        return await TasksService.Instance.updateSubtask(
          taskId,
          String(args.subtaskId),
          data,
          userProfile.userId as any,
          userProfile.orgId,
        )
      }

      case 'summarizeTasks': {
        const summaryArgs: any = {
          scope: args.scope,
          topN: args.topN,
          patientId: args.patientId,
        }
        if (args.userId || args.userName) {
          summaryArgs.userId = await resolveUserId(
            { userId: args.userId, userName: args.userName },
            userProfile.orgId,
          )
        }
        return await TasksService.Instance.summarizeTasks(summaryArgs, userProfile)
      }

      case 'addNewLead': {
        const leadData = pick(args, [
          'name',
          'mobileNumber',
          'source',
          'notes',
          'email',
          'gender',
          'age',
          'dob',
          'language',
          'userSentimentSummary',
          'others',
          'aiSummary',
          'instagramId',
          'followUpDate',
          'followupCounts',
          'reminderCount',
          'requiredFollowup',
          'messengerId',
          'isValidName',
          'isNeedSendTestimonial',
          'needToUpdateName',
        ]) as any
        // Use mobileNumber as referenceId if referenceId not provided
        if (args.mobileNumber && !args.referenceId) {
          leadData.referenceId = args.mobileNumber
        }
        return await LeadService.Instance.validateAndSaveNewLead(leadData, userProfile)
      }

      case 'updateLead': {
        const updateData = pick(args, [
          'name',
          'mobileNumber',
          'source',
          'notes',
          'email',
          'gender',
          'age',
          'dob',
          'language',
          'userSentimentSummary',
          'others',
          'aiSummary',
          'instagramId',
          'followUpDate',
          'followupCounts',
          'reminderCount',
          'requiredFollowup',
          'messengerId',
          'isValidName',
          'isNeedSendTestimonial',
          'needToUpdateName',
        ]) as any
        // Use mobileNumber as referenceId if referenceId not provided
        if (args.mobileNumber && !args.referenceId) {
          updateData.referenceId = args.mobileNumber
        }
        return await LeadService.Instance.saveNewLead(updateData, userProfile, 'updateLead MCP Tool')
      }

      case 'getLeadList': {
        console.log(`[MCP-HANDLER] 🔍 Executing getLeads query with args:`, args)
        const leadsResult = await LeadService.Instance.getLeadListForAgent(args, userProfile)
        return leadsResult
      }

      case 'getLeadsReport': {
        console.log(`[MCP-HANDLER] 📊 Executing getLeadsReport with args:`, args)
        const reportResult = await LeadService.Instance.getLeadsReport(args, userProfile)
        return reportResult
      }

      case 'addActivity': {
        const body: any = {
          ...omit(args, ['leadId', 'referenceId', 'mobileNumber']),
        }
        const filterQuery: any = {
          ...pick(args, ['leadId']),
        }
        // Use mobileNumber as referenceId
        if (args.mobileNumber) {
          filterQuery.referenceId = args.mobileNumber
        }
        return await ActivityService.Instance.addLeadActivity(filterQuery, body, userProfile)
      }

      case 'addCallActivity': {
        const body: any = {
          ...pick(args, [
            'callId',
            'sid',
            'callStatus',
            'callSuccessful',
            'disconnectionReason',
            'callDuration',
            'description',
            'action',
            'userSentiment',
            'circle',
            'aiSummery',
            'recordingUrl',
            'requiredFollowup',
            'followupCounts',
            'reminderCount',
            'followUpDate',
            'direction',
          ]),
        }
        // Use mobileNumber as referenceId
        if (args.mobileNumber) {
          body.referenceId = args.mobileNumber
        }
        return await LeadService.Instance.addCallActivity(body, userProfile)
      }

      case 'getLeadFullInfo': {
        return await LeadService.Instance.getLeadFullInfo(args.mobileNumber, userProfile)
      }

      case 'lookupContactByMobile': {
        if (!args.mobileNumber) {
          throw new Error('mobileNumber is required')
        }
        return await PatientService.Instance.lookupContactByMobile(args.mobileNumber, userProfile)
      }

      case 'updateLeadFollowup': {
        const referenceId = args.mobileNumber
        if (!referenceId) {
          throw new Error('mobileNumber is required')
        }
        const followupData = pick(args, ['followupCounts', 'requiredFollowup'])
        return await LeadService.Instance.updateLeadFollowup(referenceId, followupData, userProfile)
      }

      case 'getPatientFullInfo': {
        const referenceId = args.mobileNumber
        if (!referenceId) {
          throw new Error('mobileNumber is required')
        }
        return await PatientService.Instance.getPatientFullInfo(referenceId, userProfile.orgId)
      }

      case 'sendAddressToUser': {
        const referenceId = args.mobileNumber
        if (!referenceId) {
          throw new Error('mobileNumber is required')
        }
        return await AppointmentService.Instance.sendAddressToUser(referenceId, userProfile)
      }

      case 'sendWhatsappMessage': {
        const mobileWithCountryCode = getMobileWithCountryCode(args.mobileNumber)
        await SocialService.Instance.sendMessageToUser({
          message: args.message,
          socialId: mobileWithCountryCode,
          orgId: userProfile.orgId,
          userId: userProfile.userId,
          isTemplated: false,
          template: null,
          needToAskForLead: false,
        })
        return { message: 'Message sent successfully' }
      }

      case 'sendWhatsappTemplateMessage': {
        const mobileWithCountryCode = getMobileWithCountryCode(args.mobileNumber)
        return await SocialService.Instance.sendTemplateMessageToUser(
          mobileWithCountryCode,
          args.templateName,
          userProfile.orgId,
          args.bodyParameters,
        )
      }

      case 'sendReplyBackMediaToUser': {
        await SocialService.Instance.replyMediaBackToUser({ keyId: args.keyId }, userProfile.orgId)
        return { message: 'Media reply sent successfully' }
      }

      case 'getWhatsAppHistory': {
        const mobileWithCountryCode = getMobileWithCountryCode(args.mobileNumber)
        return await SocialService.Instance.getWhatsAppHistoryBySocialId(mobileWithCountryCode, userProfile.orgId)
      }

      case 'blockLead': {
        const referenceId = args.mobileNumber
        await LeadService.Instance.deactivateLead(
          {referenceId},
          { reason: args.reason || 'Blocked via agent' } as any,
          userProfile,
        )
        return { message: `Lead has been blocked successfully` }
      }

      case 'inspectData': {
        return { message: 'DATA PRINT' }
      }

      // ==================== SOP Tools ====================

      case 'createSOPTreatmentType':
        return SOPService.Instance.createTreatmentType(
          pick(args, ['name', 'description', 'status']),
          userProfile
        )

      case 'listSOPTreatmentTypes':
        return SOPService.Instance.listTreatmentTypes(userProfile.orgId)

      case 'getSOPTreatmentType':
        return SOPService.Instance.getFullTreatmentType(args.treatmentTypeId, userProfile.orgId)

      case 'updateSOPTreatmentType':
        return SOPService.Instance.updateTreatmentType(
          args.treatmentTypeId,
          omit(args, ['treatmentTypeId']),
          userProfile
        )

      case 'deleteSOPTreatmentType':
        return SOPService.Instance.deleteTreatmentType(args.treatmentTypeId, userProfile)

      case 'createSOPEvent':
        return SOPService.Instance.createEvent(
          args.treatmentTypeId,
          omit(args, ['treatmentTypeId']),
          userProfile
        )

      case 'listSOPEvents':
        return SOPService.Instance.listEvents(args.treatmentTypeId, userProfile.orgId)

      case 'updateSOPEvent':
        return SOPService.Instance.updateEvent(
          args.eventId,
          omit(args, ['eventId']),
          userProfile
        )

      case 'deleteSOPEvent':
        return SOPService.Instance.deleteEvent(args.eventId, userProfile)

      case 'createSOPTaskTemplate':
        return SOPService.Instance.createTaskTemplate(
          args.eventId,
          omit(args, ['eventId']),
          userProfile
        )

      case 'listSOPTaskTemplates':
        return SOPService.Instance.listTaskTemplates(args.eventId, userProfile.orgId)

      case 'updateSOPTaskTemplate':
        return SOPService.Instance.updateTaskTemplate(
          args.taskId,
          omit(args, ['taskId']),
          userProfile
        )

      case 'deleteSOPTaskTemplate':
        return SOPService.Instance.deleteTaskTemplate(args.taskId, userProfile)

      default:
        return { message: `Unknown tool: ${toolName}` }
    }
  } catch (error: any) {
    logger.error(`Error in handleToolCall for tool ${toolName}:`, error)
    return {
      message: prepareErrorMessageForAgents(error),
    }
  }
}
