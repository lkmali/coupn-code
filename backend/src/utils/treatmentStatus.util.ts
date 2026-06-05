import {
  Patient,
  Timeline,
  Task,
  TaskStatus,
  toObjectId,
} from '@anantai/common'
import { badRequest } from './errorCode'

export const TERMINAL_TASK_STATUSES = [TaskStatus.COMPLETED, TaskStatus.CANCELLED]
export const TERMINAL_TIMELINE_STATUSES = ['COMPLETED', 'CANCELLED']

export type TreatmentCategory = 'TREATMENT' | 'IPD'

// Blocks starting a duplicate flow:
// - TREATMENT: existing `patient.status === 'IN_TREATMENT'` semantics
// - IPD:       `patient.ipd?.active === true`
// These two flows are independent — a patient can be IN_TREATMENT and admitted
// to IPD at the same time, so the caller must specify which lane.
export async function assertNoActiveTreatment(
  patientId: string,
  orgId: string,
  treatmentCategory: TreatmentCategory = 'TREATMENT',
): Promise<void> {
  const patient = await Patient.findOne({
    _id: toObjectId(patientId),
    orgId: toObjectId(orgId),
  }).lean()
  if (!patient) return

  if (treatmentCategory === 'IPD' && (patient as any)?.ipd?.active) {
    const err: any = badRequest('Patient is already admitted to IPD. Discharge before re-admitting.')
    ;(err.error as any).code = 'ACTIVE_IPD_EXISTS'
    throw err
  }

  if (treatmentCategory === 'TREATMENT' && (patient as any)?.status === 'IN_TREATMENT') {
    const err: any = badRequest('Cannot start a new treatment: complete the current treatment first')
    ;(err.error as any).code = 'ACTIVE_TREATMENT_EXISTS'
    throw err
  }
}

// Terminal-task gate for completeTreatment + endIpd. Single indexed query on
// (patientId, treatmentCategory, status). Also counts non-terminal Timeline rows
// in the same category so the discharge / completion blocks consistently with
// what the UI shows.
//
// Legacy rows: tasks + timelines created before the `treatmentCategory` field
// shipped have it undefined. They MUST count toward the TREATMENT gate (they
// are treatment-flow rows that just predate the field). The IPD gate stays
// strict — only explicit `'IPD'` rows count, so legacy data never leaks into
// the discharge check.
export async function countOpenWorkByCategory(
  patientId: string,
  orgId: string,
  treatmentCategory: TreatmentCategory,
): Promise<{ openTaskCount: number; openTimelineCount: number }> {
  const orgObjectId = toObjectId(orgId)
  const patientObjectId = toObjectId(patientId)

  const categoryFilter: any =
    treatmentCategory === 'IPD'
      ? { treatmentCategory: 'IPD' }
      : { treatmentCategory: { $ne: 'IPD' } }

  const openTaskCount = await Task.countDocuments({
    patientId: patientObjectId,
    orgId: orgObjectId,
    ...categoryFilter,
    status: { $nin: TERMINAL_TASK_STATUSES },
    isDelete: false,
  } as any)

  const openTimelineCount = await Timeline.countDocuments({
    patientId: patientObjectId,
    orgId: orgObjectId,
    ...categoryFilter,
    status: { $nin: TERMINAL_TIMELINE_STATUSES },
    isDelete: false,
  } as any)

  return { openTaskCount, openTimelineCount }
}

// Throws 409 with code TASKS_PENDING when the lane has any open work. Shared
// gate body used by completeTreatment + endIpd; the controller maps the error
// code to a user-facing toast on the FE.
export async function assertAllTasksTerminal(
  patientId: string,
  orgId: string,
  treatmentCategory: TreatmentCategory,
): Promise<void> {
  const { openTaskCount, openTimelineCount } = await countOpenWorkByCategory(
    patientId,
    orgId,
    treatmentCategory,
  )
  if (openTaskCount === 0 && openTimelineCount === 0) return

  const label = treatmentCategory === 'IPD' ? 'discharge' : 'complete treatment'
  const parts: string[] = []
  if (openTaskCount > 0) parts.push(`${openTaskCount} task(s) still open`)
  if (openTimelineCount > 0) parts.push(`${openTimelineCount} timeline event(s) still open`)
  const err: any = badRequest(`Cannot ${label}: ${parts.join(', ')}`)
  ;(err.error as any).code = 'TASKS_PENDING'
  ;(err.error as any).openTaskCount = openTaskCount
  ;(err.error as any).openTimelineCount = openTimelineCount
  ;(err.error as any).treatmentCategory = treatmentCategory
  throw err
}

// Multi-instance variant of assertAllTasksTerminal. Narrows the open-work count by the
// specific `treatmentInstanceId` (TREATMENT lane) or `ipdInstanceId` (IPD lane) so
// completing one treatment / discharging one IPD does NOT depend on sibling instances
// being clean. Indexed by (patientId, treatmentInstanceId|ipdInstanceId, status) in
// task.model and timeline.model.
export async function assertAllTasksTerminalForInstance(
  patientId: string,
  orgId: string,
  treatmentCategory: TreatmentCategory,
  instanceId: string,
): Promise<void> {
  const orgObjectId = toObjectId(orgId)
  const patientObjectId = toObjectId(patientId)
  const instanceObjectId = toObjectId(instanceId)
  const instanceField = treatmentCategory === 'IPD' ? 'ipdInstanceId' : 'treatmentInstanceId'

  const openTaskCount = await Task.countDocuments({
    patientId: patientObjectId,
    orgId: orgObjectId,
    [instanceField]: instanceObjectId,
    status: { $nin: TERMINAL_TASK_STATUSES },
    isDelete: false,
  } as any)

  const openTimelineCount = await Timeline.countDocuments({
    patientId: patientObjectId,
    orgId: orgObjectId,
    [instanceField]: instanceObjectId,
    status: { $nin: TERMINAL_TIMELINE_STATUSES },
    isDelete: false,
  } as any)

  if (openTaskCount === 0 && openTimelineCount === 0) return

  const label = treatmentCategory === 'IPD' ? 'discharge' : 'complete treatment'
  const parts: string[] = []
  if (openTaskCount > 0) parts.push(`${openTaskCount} task(s) still open`)
  if (openTimelineCount > 0) parts.push(`${openTimelineCount} timeline event(s) still open`)
  const err: any = badRequest(`Cannot ${label}: ${parts.join(', ')}`)
  ;(err.error as any).code = 'TASKS_PENDING'
  ;(err.error as any).openTaskCount = openTaskCount
  ;(err.error as any).openTimelineCount = openTimelineCount
  ;(err.error as any).treatmentCategory = treatmentCategory
  ;(err.error as any).instanceId = instanceId
  throw err
}

// Guard: a terminal (COMPLETED/CANCELLED) timeline row is locked — it cannot be
// edited, and no new task / medicine / report may be attached to it. Adding work
// to a closed row would also silently re-open it (see syncTimelineStatusForTask),
// so the lock is enforced server-side regardless of what the UI allows. Rows that
// don't exist (or are already deleted) are treated as not-locked so the caller's
// own not-found handling stays in charge. Throws 409-style badRequest with code
// TIMELINE_LOCKED, mirroring the TASKS_PENDING gate shape.
export async function assertTimelineNotLocked(
  timelineId: string,
  orgId: string,
): Promise<void> {
  if (!timelineId) return
  const timeline = await Timeline.findOne({
    _id: toObjectId(String(timelineId)),
    orgId: toObjectId(orgId),
    isDelete: false,
  }).lean<any>()
  if (!timeline) return
  if (TERMINAL_TIMELINE_STATUSES.includes(timeline.status)) {
    const isCancelled = timeline.status === 'CANCELLED'
    const err: any = badRequest(
      `This timeline event is ${isCancelled ? 'cancelled' : 'completed'} and can no longer be edited or added to.`,
    )
    ;(err.error as any).code = 'TIMELINE_LOCKED'
    ;(err.error as any).timelineId = String(timelineId)
    ;(err.error as any).status = timeline.status
    throw err
  }
}

// Auto-flip a Timeline row's status based on whether any of its tasks are still
// open. Mirror of the treatment-level terminal-task gate: "open" = NOT in
// COMPLETED/CANCELLED. Behaviour:
//   - all tasks terminal AND status != COMPLETED → flip to COMPLETED + stamp completedDate
//   - any task open AND status == COMPLETED → flip back to IN_PROGRESS (handles re-open)
//   - CANCELLED rows are left alone (user-cancelled rows stay cancelled even if their
//     tasks later resolve)
//   - rows with zero linked tasks are skipped — a row with nothing on it is not
//     auto-completable; clinicians close it explicitly.
//
// Best-effort: callers should wrap in try/catch so a task-status mutation still
// succeeds if the timeline write fails.
export async function syncTimelineStatusForTask(
  taskId: string,
  userId: string,
  orgId: string,
): Promise<void> {
  const task = await Task.findById(toObjectId(taskId)).lean<any>()
  if (!task) return
  const timelineId = (task as any).timelineId
  if (!timelineId) return

  const orgObjectId = toObjectId(orgId)
  const timelineObjectId = toObjectId(String(timelineId))

  const timeline = await Timeline.findOne({
    _id: timelineObjectId,
    orgId: orgObjectId,
    isDelete: false,
  }).lean<any>()
  if (!timeline) return
  if (timeline.status === 'CANCELLED') return

  const [openTaskCount, totalTaskCount] = await Promise.all([
    Task.countDocuments({
      timelineId: timelineObjectId,
      orgId: orgObjectId,
      status: { $nin: TERMINAL_TASK_STATUSES },
      isDelete: false,
    } as any),
    Task.countDocuments({
      timelineId: timelineObjectId,
      orgId: orgObjectId,
      isDelete: false,
    } as any),
  ])

  if (totalTaskCount === 0) return

  if (openTaskCount === 0 && timeline.status !== 'COMPLETED') {
    await Timeline.updateOne(
      { _id: timelineObjectId },
      {
        $set: {
          status: 'COMPLETED',
          completedDate: new Date(),
          updatedBy: toObjectId(userId),
        },
      } as any,
    )
    return
  }

  if (openTaskCount > 0 && timeline.status === 'COMPLETED') {
    await Timeline.updateOne(
      { _id: timelineObjectId },
      {
        $set: {
          status: 'IN_PROGRESS',
          completedDate: null,
          updatedBy: toObjectId(userId),
        },
      } as any,
    )
  }
}

// Reject starting a NEW treatment whose SOP already has an ACTIVE entry in
// `patient.activeTreatments[]`. Different SOPs may run concurrently, so this
// is intentionally per-SOP, not a global "is anything active" check.
// During the migration window, also honours the legacy `patient.status === 'IN_TREATMENT'`
// flag (set by single-instance writes) when `activeTreatments[]` is empty AND
// the legacy `treatmentType` matches the SOP being started.
export async function assertSopNotAlreadyActive(
  patientId: string,
  orgId: string,
  treatmentType: string,
): Promise<void> {
  const patient = await Patient.findOne({
    _id: toObjectId(patientId),
    orgId: toObjectId(orgId),
  }).lean()
  if (!patient) return

  const wanted = treatmentType.toUpperCase()
  const active: any[] = (patient as any)?.activeTreatments ?? []
  const dupe = active.find(
    (t: any) => t.status === 'ACTIVE' && String(t.treatmentType || '').toUpperCase() === wanted,
  )
  if (dupe) {
    const err: any = badRequest(`Cannot start ${treatmentType}: a ${treatmentType} treatment is already running. Complete it before starting another instance.`)
    ;(err.error as any).code = 'SOP_ALREADY_ACTIVE'
    ;(err.error as any).treatmentType = treatmentType
    throw err
  }

  // Legacy shim: pre-migration patients carry only `treatmentType` + `status`.
  if (
    active.length === 0 &&
    (patient as any)?.status === 'IN_TREATMENT' &&
    String((patient as any)?.treatmentType || '').toUpperCase() === wanted
  ) {
    const err: any = badRequest(`Cannot start ${treatmentType}: a ${treatmentType} treatment is already running. Complete it before starting another instance.`)
    ;(err.error as any).code = 'SOP_ALREADY_ACTIVE'
    ;(err.error as any).treatmentType = treatmentType
    throw err
  }
}

// Reject admitting a second IPD for the same treatment instance while one is still ACTIVE.
// During the migration window, also honours the legacy `patient.ipd.active === true`
// flag when `ipds[]` is empty (treat as a single legacy admission scoped to no
// treatment instance — admitting any new IPD is allowed once the legacy one is closed).
export async function assertNoActiveIpdForInstance(
  patientId: string,
  orgId: string,
  treatmentInstanceId: string,
): Promise<void> {
  const patient = await Patient.findOne({
    _id: toObjectId(patientId),
    orgId: toObjectId(orgId),
  }).lean()
  if (!patient) return

  const tid = String(treatmentInstanceId)
  const ipds: any[] = (patient as any)?.ipds ?? []
  const dupe = ipds.find(
    (i: any) => i.status === 'ACTIVE' && String(i.treatmentInstanceId) === tid,
  )
  if (dupe) {
    const err: any = badRequest('An IPD admission is already active for this treatment. Discharge it before re-admitting.')
    ;(err.error as any).code = 'IPD_ALREADY_ACTIVE'
    ;(err.error as any).treatmentInstanceId = tid
    throw err
  }

  // Legacy shim: pre-migration patients carry only `ipd.active`. Block any new
  // admit while the legacy single-IPD flag is on — caller must discharge first.
  if (ipds.length === 0 && (patient as any)?.ipd?.active) {
    const err: any = badRequest('An IPD admission is already active for this patient. Discharge it before re-admitting.')
    ;(err.error as any).code = 'IPD_ALREADY_ACTIVE'
    throw err
  }
}
