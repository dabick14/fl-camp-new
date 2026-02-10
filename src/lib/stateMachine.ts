/**
 * State machine for participant status transitions
 * Includes atomic Firestore transactions, role-based guards, and audit logging
 */

import {
  getFirestore,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
  runTransaction,
  doc,
  arrayUnion,
} from 'firebase/firestore'
import type {
  ParticipantState,
  Camp,
  CampParticipant,
  Room,
} from '@/models/index'

export interface StateTransition {
  from: ParticipantState
  to: ParticipantState
  label: string
  requiresData?: string[] // e.g., ["paymentId"] for payment transitions
  businessRule?: (context?: TransitionContext) => boolean
}

export interface TransitionContext {
  camp?: Camp
  isPaid?: boolean
  hasRoom?: boolean
  roomAssignmentType?: 'pre_assigned' | 'on_site' | 'mixed'
}

export interface StateTransitionContext {
  actorUid: string
  actorRole: 'super_admin' | 'admin' | 'staff' | 'self' | 'webhook'
  note?: string
  metadata?: Record<string, any>
}

export interface StateTransitionResult {
  success: boolean
  newState?: ParticipantState
  error?: string
  roomAssigned?: string
}

export interface AuditLogEntry {
  actorUid: string
  ts: Date
  note: string
  metadata?: Record<string, any>
}

/**
 * Valid state transitions for participant lifecycle
 */
export const PARTICIPANT_STATE_TRANSITIONS: StateTransition[] = [
  // Draft → Registered
  { from: 'draft', to: 'registered', label: 'Complete Registration' },

  // Registered → Payment Pending (if payment required)
  { from: 'registered', to: 'payment_pending', label: 'Request Payment' },

  // Payment Pending → Paid (after payment webhook)
  {
    from: 'payment_pending',
    to: 'paid',
    label: 'Confirm Payment',
    requiresData: ['paymentId'],
  },

  // Paid → Paid Unassigned (payment confirmed, no room yet)
  {
    from: 'paid',
    to: 'paid_unassigned',
    label: 'Mark as Unassigned',
  },

  // Paid Unassigned → Room Assigned (staff action)
  {
    from: 'paid_unassigned',
    to: 'room_assigned',
    label: 'Assign Room',
    requiresData: ['roomId'],
    businessRule: (ctx) => ctx?.isPaid === true,
  },

  // Paid → Room Assigned (direct assignment for pre_assigned camps)
  {
    from: 'paid',
    to: 'room_assigned',
    label: 'Assign Room',
    requiresData: ['roomId'],
    businessRule: (ctx) => ctx?.isPaid === true,
  },

  // Room Assigned → Checked In (at event)
  {
    from: 'room_assigned',
    to: 'checked_in',
    label: 'Check In',
    businessRule: (ctx) => {
      // For on_site camps, must have room assignment before check-in
      if (ctx?.roomAssignmentType === 'on_site') {
        return ctx?.hasRoom === true
      }
      return true
    },
  },

  // Checked In → Checked Out (departure)
  {
    from: 'checked_in',
    to: 'checked_out',
    label: 'Check Out',
  },

  // Room Assigned → Paid Unassigned (unassign room)
  {
    from: 'room_assigned',
    to: 'paid_unassigned',
    label: 'Unassign Room',
  },

  // Checked In → Room Assigned (undo check-in)
  {
    from: 'checked_in',
    to: 'room_assigned',
    label: 'Undo Check-In',
  },

  // From any state → Cancelled
  { from: 'draft', to: 'cancelled', label: 'Cancel' },
  { from: 'registered', to: 'cancelled', label: 'Cancel' },
  { from: 'payment_pending', to: 'cancelled', label: 'Cancel' },
  { from: 'paid', to: 'cancelled', label: 'Cancel' },
  { from: 'paid_unassigned', to: 'cancelled', label: 'Cancel' },
  { from: 'room_assigned', to: 'cancelled', label: 'Cancel' },
]

// Role requirements for state transitions
const TRANSITION_ROLES: Record<
  string,
  ('super_admin' | 'admin' | 'staff' | 'self')[]
> = {
  'draft->registered': ['self', 'staff', 'admin', 'super_admin'],
  'registered->payment_pending': ['self', 'staff', 'admin', 'super_admin'],
  'payment_pending->paid': ['admin', 'super_admin'], // Usually via webhook
  'paid->room_assigned': ['staff', 'admin', 'super_admin'],
  'paid_unassigned->room_assigned': ['staff', 'admin', 'super_admin'],
  'room_assigned->checked_in': ['staff', 'admin', 'super_admin'],
  'checked_in->checked_out': ['staff', 'admin', 'super_admin'],
  'room_assigned->paid_unassigned': ['staff', 'admin', 'super_admin'],
  'checked_in->room_assigned': ['staff', 'admin', 'super_admin'],
  '*->cancelled': ['admin', 'super_admin'],
}

/**
 * Get available transitions from a given state
 */
export function getAvailableTransitions(
  from: ParticipantState,
  context?: TransitionContext,
): StateTransition[] {
  return PARTICIPANT_STATE_TRANSITIONS.filter((t) => {
    if (t.from !== from) return false
    if (t.businessRule && context) {
      return t.businessRule(context)
    }
    return true
  })
}

/**
 * Check if a transition is valid (simple check without business rules)
 */
export function isValidTransition(
  from: ParticipantState,
  to: ParticipantState,
): boolean {
  return PARTICIPANT_STATE_TRANSITIONS.some(
    (t) => t.from === from && t.to === to,
  )
}

/**
 * Check if a transition is valid with business rules
 */
export function isTransitionAllowed(
  from: ParticipantState,
  to: ParticipantState,
  context?: TransitionContext,
): boolean {
  const transition = PARTICIPANT_STATE_TRANSITIONS.find(
    (t) => t.from === from && t.to === to,
  )

  if (!transition) return false

  // Apply business rules if present
  if (transition.businessRule && context) {
    return transition.businessRule(context)
  }

  return true
}

/**
 * Check if actor has permission for transition
 */
export function hasTransitionPermission(
  currentState: ParticipantState,
  targetState: ParticipantState,
  actorRole: StateTransitionContext['actorRole'],
): boolean {
  // Webhooks can only do payment transitions
  if (actorRole === 'webhook') {
    return targetState === 'paid' && currentState === 'payment_pending'
  }

  // Super admin can do anything
  if (actorRole === 'super_admin') return true

  const transitionKey = `${currentState}->${targetState}`
  const cancelKey = '*->cancelled'

  const allowedRoles =
    TRANSITION_ROLES[transitionKey] || TRANSITION_ROLES[cancelKey] || []

  return allowedRoles.includes(actorRole)
}

/**
 * Derive participant state from sub-states
 */
export function deriveParticipantState(
  participant: CampParticipant,
): ParticipantState {
  const { registration, payment, room, checkIn } = participant.states

  // Check terminal states first
  if (checkIn.state === 'checked_out') return 'checked_out'
  if (checkIn.state === 'checked_in') return 'checked_in'
  if (registration.state === 'cancelled') return 'cancelled'

  // Check room assignment
  if (room.state === 'assigned') return 'room_assigned'

  // Check payment status
  if (payment.state === 'paid') {
    return room.state === 'unassigned' ? 'paid_unassigned' : 'paid'
  }

  if (payment.state === 'pending') return 'payment_pending'

  // Check registration
  if (registration.state === 'registered') return 'registered'
  if (registration.state === 'draft') return 'draft'

  return 'draft' // Fallback
}

/**
 * Create audit log entry
 */
export function createAuditEntry(
  context: StateTransitionContext,
  fromState: ParticipantState,
  toState: ParticipantState,
): AuditLogEntry {
  return {
    actorUid: context.actorUid,
    ts: new Date(),
    note: context.note || `State transition: ${fromState} -> ${toState}`,
    metadata: context.metadata,
  }
}

/**
 * Query eligible rooms for auto-assignment
 */
export async function findEligibleRoom(
  campId: string,
  gender: 'male' | 'female' | 'other' | null,
  db = getFirestore(),
): Promise<Room | null> {
  const roomsRef = collection(db, 'rooms')

  // Query rooms for this camp with capacity
  let q = query(
    roomsRef,
    where('campId', '==', campId),
    where('currentOccupancy', '<', 'capacity'),
    orderBy('currentOccupancy', 'asc'),
    limit(1),
  )

  // Filter by gender if specified
  if (gender && gender !== 'other') {
    q = query(
      roomsRef,
      where('campId', '==', campId),
      where('currentOccupancy', '<', 'capacity'),
      where('gender', 'in', [gender, null]),
      orderBy('currentOccupancy', 'asc'),
      limit(1),
    )
  }

  const snapshot = await getDocs(q)

  if (snapshot.empty) return null

  const roomDoc = snapshot.docs[0]
  return { id: roomDoc.id, ...roomDoc.data() } as Room
}

/**
 * Atomic state transition with auto-room assignment
 */
export async function transitionParticipantState(
  participantId: string,
  targetState: ParticipantState,
  context: StateTransitionContext,
  db = getFirestore(),
): Promise<StateTransitionResult> {
  const participantRef = doc(collection(db, 'participants'), participantId)

  try {
    const result = await runTransaction(db, async (transaction) => {
      // Read current participant state
      const participantDoc = await transaction.get(participantRef)

      if (!participantDoc.exists) {
        throw new Error('Participant not found')
      }

      const participant = participantDoc.data() as CampParticipant
      const currentState = deriveParticipantState(participant)

      // Validate transition
      if (!isValidTransition(currentState, targetState)) {
        throw new Error(
          `Invalid transition from ${currentState} to ${targetState}`,
        )
      }

      // Check permissions
      if (
        !hasTransitionPermission(currentState, targetState, context.actorRole)
      ) {
        throw new Error(
          `Actor role ${context.actorRole} not authorized for ${currentState}->${targetState}`,
        )
      }

      // Create audit entry
      const auditEntry = createAuditEntry(context, currentState, targetState)

      // Prepare state updates
      const updates: any = {
        updatedAt: serverTimestamp(),
      }

      let assignedRoomId: string | undefined

      // Update sub-states based on target state
      switch (targetState) {
        case 'registered':
          updates['states.registration'] = {
            state: 'registered',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }
          break

        case 'payment_pending':
          updates['states.payment'] = {
            state: 'pending',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }
          break

        case 'paid':
        case 'paid_unassigned':
          updates['states.payment'] = {
            state: 'paid',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }
          updates['paymentDetails.status'] = 'completed'
          updates['paymentDetails.paidAt'] = serverTimestamp()

          if (context.metadata?.amount) {
            updates['paymentDetails.amount'] = context.metadata.amount
          }
          if (context.metadata?.transactionId) {
            updates['paymentDetails.transactionId'] =
              context.metadata.transactionId
          }

          // Auto-assign room if transitioning to 'paid' and room assignment is enabled
          if (targetState === 'paid') {
            const room = await findEligibleRoom(
              participant.campId,
              participant.personalInfo.gender ?? null,
              db,
            )

            if (room) {
              assignedRoomId = room.id
              const roomRef = doc(collection(db, 'rooms'), room.id)

              // Update room occupancy
              transaction.update(roomRef, {
                currentOccupancy: increment(1),
                updatedAt: serverTimestamp(),
              })

              // Update participant with room assignment
              updates['states.room'] = {
                state: 'assigned',
                timestamp: serverTimestamp(),
                actorUid: 'system-auto-assign',
              }
              updates['room'] = {
                roomId: room.id,
                assignedAt: serverTimestamp(),
                assignedBy: 'system-auto-assign',
              }

              auditEntry.note += ` | Auto-assigned to room ${room.name}`
            } else {
              // No room available, set to paid_unassigned
              updates['states.room'] = {
                state: 'unassigned',
                timestamp: serverTimestamp(),
              }
            }
          }
          break

        case 'room_assigned':
          if (!context.metadata?.roomId) {
            throw new Error('Room ID required for room assignment')
          }

          const newRoomRef = doc(
            collection(db, 'rooms'),
            context.metadata.roomId,
          )
          const newRoomDoc = await transaction.get(newRoomRef)

          if (!newRoomDoc.exists) {
            throw new Error('Room not found')
          }

          const newRoom = newRoomDoc.data() as Room

          // Check capacity
          if (
            newRoom.currentOccupancy >= newRoom.capacity &&
            !newRoom.overbookAllowed
          ) {
            throw new Error('Room is at capacity')
          }

          // Check gender compatibility
          if (
            newRoom.gender &&
            participant.personalInfo.gender !== newRoom.gender
          ) {
            throw new Error('Gender mismatch for room assignment')
          }

          // If participant had previous room, decrement its occupancy
          if (participant.room?.roomId) {
            const oldRoomRef = doc(
              collection(db, 'rooms'),
              participant.room.roomId,
            )
            transaction.update(oldRoomRef, {
              currentOccupancy: increment(-1),
              updatedAt: serverTimestamp(),
            })
          }

          // Increment new room occupancy
          transaction.update(newRoomRef, {
            currentOccupancy: increment(1),
            updatedAt: serverTimestamp(),
          })

          assignedRoomId = context.metadata.roomId
          updates['states.room'] = {
            state: 'assigned',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }
          updates['room'] = {
            roomId: context.metadata.roomId,
            assignedAt: serverTimestamp(),
            assignedBy: context.actorUid,
          }
          break

        case 'checked_in':
          updates['states.checkIn'] = {
            state: 'checked_in',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }
          updates['checkIn'] = {
            ts: serverTimestamp(),
            actorUid: context.actorUid,
          }
          break

        case 'checked_out':
          updates['states.checkIn'] = {
            state: 'checked_out',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }
          updates['checkOut'] = {
            ts: serverTimestamp(),
            actorUid: context.actorUid,
          }
          break

        case 'cancelled':
          updates['states.registration'] = {
            state: 'cancelled',
            timestamp: serverTimestamp(),
            actorUid: context.actorUid,
          }

          // If participant had a room, free it up
          if (participant.room?.roomId) {
            const roomRef = doc(
              collection(db, 'rooms'),
              participant.room.roomId,
            )
            transaction.update(roomRef, {
              currentOccupancy: increment(-1),
              updatedAt: serverTimestamp(),
            })
          }
          break
      }

      // Append audit log
      updates['paymentDetails.auditHistory'] = arrayUnion({
        actorUid: auditEntry.actorUid,
        ts: Timestamp.fromDate(auditEntry.ts),
        note: auditEntry.note,
        ...(auditEntry.metadata ? { metadata: auditEntry.metadata } : {}),
      })

      // Apply updates
      transaction.update(participantRef, updates)

      return {
        success: true,
        newState: targetState,
        roomAssigned: assignedRoomId,
      }
    })

    return result
  } catch (error: any) {
    console.error('State transition error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error during state transition',
    }
  }
}

/**
 * Batch transition multiple participants (e.g., bulk check-in)
 */
export async function batchTransitionParticipants(
  participantIds: string[],
  targetState: ParticipantState,
  context: StateTransitionContext,
  db = getFirestore(),
): Promise<Record<string, StateTransitionResult>> {
  const results: Record<string, StateTransitionResult> = {}

  // Process in chunks of 10 for transaction limits
  const chunkSize = 10
  for (let i = 0; i < participantIds.length; i += chunkSize) {
    const chunk = participantIds.slice(i, i + chunkSize)

    await Promise.all(
      chunk.map(async (id) => {
        results[id] = await transitionParticipantState(
          id,
          targetState,
          context,
          db,
        )
      }),
    )
  }

  return results
}

/**
 * Business rule: Cannot assign room unless participant is paid
 */
export function canAssignRoom(isPaid: boolean): boolean {
  return isPaid === true
}

/**
 * Business rule: Cannot check-in unless room is assigned (for on_site mode)
 */
export function canCheckIn(
  hasRoom: boolean,
  roomAssignmentType?: 'pre_assigned' | 'on_site' | 'mixed',
): boolean {
  if (roomAssignmentType === 'on_site') {
    return hasRoom === true
  }
  // For pre_assigned and mixed modes, room may not be required at check-in
  return true
}

/**
 * Color coding for participant states (using shadcn/ui color tokens)
 */
export function getStateColor(state: ParticipantState): string {
  const colors: Record<ParticipantState, string> = {
    draft: 'bg-muted text-muted-foreground',
    registered: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    payment_pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    paid_unassigned:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    room_assigned:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    checked_in:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    checked_out:
      'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    cancelled:
      'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive',
  }
  return colors[state] || 'bg-muted text-muted-foreground'
}

/**
 * Human-readable state labels
 */
export function getStateLabel(state: ParticipantState): string {
  const labels: Record<ParticipantState, string> = {
    draft: 'Draft',
    registered: 'Registered',
    payment_pending: 'Payment Pending',
    paid: 'Paid',
    paid_unassigned: 'Paid (Unassigned)',
    room_assigned: 'Room Assigned',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    cancelled: 'Cancelled',
  }
  return labels[state] || state
}
