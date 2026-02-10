/**
 * State machine for participant status transitions
 */

import type { ParticipantState, Camp } from '@/models/index'

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

  // From any state → Cancelled
  { from: 'draft', to: 'cancelled', label: 'Cancel' },
  { from: 'registered', to: 'cancelled', label: 'Cancel' },
  { from: 'payment_pending', to: 'cancelled', label: 'Cancel' },
  { from: 'paid', to: 'cancelled', label: 'Cancel' },
  { from: 'paid_unassigned', to: 'cancelled', label: 'Cancel' },
  { from: 'room_assigned', to: 'cancelled', label: 'Cancel' },
]

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
