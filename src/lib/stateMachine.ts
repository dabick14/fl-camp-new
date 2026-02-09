/**
 * State machine for participant status transitions
 */

import type { ParticipantState } from '@models/index'

export interface StateTransition {
  from: ParticipantState
  to: ParticipantState
  label: string
  requiresData?: string[] // e.g., ["paymentId"] for payment transitions
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

  // Paid → Room Assigned (staff action)
  {
    from: 'paid',
    to: 'room_assigned',
    label: 'Assign Room',
    requiresData: ['roomId'],
  },

  // Room Assigned → Checked In (at event)
  { from: 'room_assigned', to: 'checked_in', label: 'Check In' },

  // From any state → Cancelled
  { from: 'draft', to: 'cancelled', label: 'Cancel' },
  { from: 'registered', to: 'cancelled', label: 'Cancel' },
  { from: 'payment_pending', to: 'cancelled', label: 'Cancel' },
  { from: 'paid', to: 'cancelled', label: 'Cancel' },

  // From any state → No Show
  { from: 'room_assigned', to: 'no_show', label: 'Mark as No Show' },
  { from: 'checked_in', to: 'no_show', label: 'Mark as No Show' },
]

/**
 * Get available transitions from a given state
 */
export function getAvailableTransitions(
  from: ParticipantState,
): StateTransition[] {
  return PARTICIPANT_STATE_TRANSITIONS.filter((t) => t.from === from)
}

/**
 * Check if a transition is valid
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
 * Color coding for participant states
 */
export function getStateColor(state: ParticipantState): string {
  const colors: Record<ParticipantState, string> = {
    draft: 'bg-gray-100 text-gray-800',
    registered: 'bg-blue-100 text-blue-800',
    payment_pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    room_assigned: 'bg-purple-100 text-purple-800',
    checked_in: 'bg-indigo-100 text-indigo-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-orange-100 text-orange-800',
  }
  return colors[state] || 'bg-gray-100 text-gray-800'
}
