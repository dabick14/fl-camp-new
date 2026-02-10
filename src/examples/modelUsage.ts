/**
 * Example usage of core data models and state machine
 * This file demonstrates how to use the models in your application
 */

import type {
  Camp,
  CampParticipant,
  Room,
  GroupingDimension,
  ParticipantState,
} from '@/models/index'
import {
  isTransitionAllowed,
  getAvailableTransitions,
  canAssignRoom,
  canCheckIn,
  getStateLabel,
  getStateColor,
  type StateTransition,
} from '@/lib/stateMachine'
import {
  participantRegistrationSchema,
  paymentUpdateSchema,
  stateTransitionSchema,
} from '@/lib/validators'

// Example 1: Create grouping dimensions
const ageGroupDimension: GroupingDimension = {
  name: 'Age Group',
  required: true,
  values: ['13-15', '16-18', '19-21'],
  order: 1,
}

const skillLevelDimension: GroupingDimension = {
  name: 'Skill Level',
  required: false,
  values: ['Beginner', 'Intermediate', 'Advanced'],
  order: 2,
}

// Example 2: Create a camp
const summerCamp: Partial<Camp> = {
  id: 'camp-2026-summer',
  name: 'Summer Leadership Camp 2026',
  slug: 'summer-2026',
  description: 'A week-long leadership development program',
  dates: {
    start: new Date('2026-07-01'),
    end: new Date('2026-07-07'),
  },
  location: 'Mountain View Retreat Center',
  maxParticipants: 100,
  minAge: 13,
  maxAge: 21,
  registrationOpen: true,
  selfServiceEnabled: true,
  currency: 'USD',
  totalCost: 299.99,
  paymentRequired: true,
  roomAssignmentType: 'on_site', // Rooms assigned during check-in
  groupingDimensions: [ageGroupDimension, skillLevelDimension],
}

// Example 3: Validate participant registration
const registrationData = {
  campId: 'camp-2026-summer',
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    dateOfBirth: new Date('2008-03-15'),
    gender: 'male' as const,
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+1-555-0124',
      relationship: 'Mother',
    },
  },
  groupingValues: {
    'Age Group': '16-18',
    'Skill Level': 'Beginner',
  },
}

// Validate with Zod schema
const validationResult =
  participantRegistrationSchema.safeParse(registrationData)
if (validationResult.success) {
  console.log('✅ Registration data is valid')
} else {
  console.error('❌ Validation errors:', validationResult.error.errors)
}

// Example 4: Create a participant
const participant: Partial<CampParticipant> = {
  id: 'participant-001',
  campId: 'camp-2026-summer',
  personalInfo: registrationData.personalInfo,
  groupingValues: registrationData.groupingValues,
  states: {
    registration: {
      state: 'registered',
      timestamp: new Date(),
      actorUid: 'user-self-service',
    },
    payment: {
      state: 'pending',
      timestamp: new Date(),
    },
    room: {
      state: 'unassigned',
      timestamp: new Date(),
    },
    checkIn: {
      state: 'pending',
      timestamp: new Date(),
    },
  },
  paymentDetails: {
    status: 'pending',
    auditHistory: [
      {
        actorUid: 'system',
        ts: new Date(),
        note: 'Registration initiated',
      },
    ],
  },
  registeredAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Example 5: State transitions
console.log('\n=== State Transition Examples ===\n')

// Current state
let currentState: ParticipantState = 'registered'
console.log(`Current state: ${getStateLabel(currentState)}`)
console.log(`Badge classes: ${getStateColor(currentState)}`)

// Try to assign room (should fail - not paid yet)
console.log(
  '\nCan assign room when not paid?',
  canAssignRoom(false), // false
)
console.log(
  'Can assign room when paid?',
  canAssignRoom(true), // true
)

// Get available transitions
const availableTransitions = getAvailableTransitions(currentState)
console.log(
  '\nAvailable transitions from "registered":',
  availableTransitions.map(
    (t: StateTransition) => `${t.from} → ${t.to} (${t.label})`,
  ),
)

// Simulate payment flow
currentState = 'payment_pending'
console.log(`\nTransitioned to: ${getStateLabel(currentState)}`)

// Check if transition to paid is allowed
const canTransitionToPaid = isTransitionAllowed(currentState, 'paid')
console.log(`Can transition to "paid"? ${canTransitionToPaid}`)

// Validate payment update
const paymentUpdate = {
  participantId: 'participant-001',
  amount: 299.99,
  currency: 'USD',
  processor: 'stripe' as const,
  transactionId: 'txn_abc123',
  actorUid: 'webhook-stripe',
  note: 'Payment confirmed via Stripe webhook',
}

const paymentValidation = paymentUpdateSchema.safeParse(paymentUpdate)
if (paymentValidation.success) {
  console.log('✅ Payment update is valid')
  currentState = 'paid'
  console.log(`Transitioned to: ${getStateLabel(currentState)}`)
}

// Now check room assignment (should be allowed)
console.log('\nCan assign room now?', canAssignRoom(true))

// Check check-in rules for different modes
console.log('\n=== Check-In Rules ===\n')
console.log(
  'On-site mode, no room assigned:',
  canCheckIn(false, 'on_site'), // false
)
console.log(
  'On-site mode, room assigned:',
  canCheckIn(true, 'on_site'), // true
)
console.log(
  'Pre-assigned mode, no room:',
  canCheckIn(false, 'pre_assigned'), // true
)

// Example 6: Room creation
const cabinA: Partial<Room> = {
  id: 'room-cabin-a',
  campId: 'camp-2026-summer',
  name: 'Cabin A',
  type: 'cabin',
  capacity: 8,
  gender: 'male', // Male-only cabin
  overbookAllowed: false,
  currentOccupancy: 0,
  floor: 1,
  building: 'North Lodge',
  notes: 'Has air conditioning',
}

// Example 7: Complete transition with validation
const transitionData = {
  participantId: 'participant-001',
  from: 'paid' as ParticipantState,
  to: 'room_assigned' as ParticipantState,
  actorUid: 'staff-admin',
  metadata: {
    roomId: 'room-cabin-a',
  },
}

const transitionValidation = stateTransitionSchema.safeParse(transitionData)
if (transitionValidation.success) {
  const allowed = isTransitionAllowed(transitionData.from, transitionData.to, {
    isPaid: true,
    hasRoom: false,
  })

  if (allowed) {
    console.log(
      `\n✅ Transition ${transitionData.from} → ${transitionData.to} is allowed`,
    )
  } else {
    console.log(
      `\n❌ Transition ${transitionData.from} → ${transitionData.to} is not allowed`,
    )
  }
}

console.log('\n=== All Examples Complete ===\n')

export {}
