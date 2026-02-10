# Data Models & State Machine Reference

## Overview

This document describes the core TypeScript data models, enums, and state machine logic for the Camp Management System.

## Participant State Machine

### States

```typescript
type ParticipantState =
  | 'draft' // Initial state, incomplete registration
  | 'registered' // Registration completed
  | 'payment_pending' // Payment requested but not received
  | 'paid' // Payment confirmed
  | 'paid_unassigned' // Paid but no room assigned yet
  | 'room_assigned' // Room has been assigned
  | 'checked_in' // Participant has checked in at event
  | 'checked_out' // Participant has checked out
  | 'cancelled' // Registration cancelled (can happen from any state)
```

### State Transitions

#### Valid Transitions

1. **draft → registered**: Complete registration form
2. **registered → payment_pending**: Request payment (if payment required)
3. **payment_pending → paid**: Payment confirmed via webhook
4. **paid → paid_unassigned**: Payment confirmed, awaiting room assignment
5. **paid_unassigned → room_assigned**: Room assigned by staff
6. **paid → room_assigned**: Direct room assignment (for pre_assigned camps)
7. **room_assigned → checked_in**: Check in at event
8. **checked_in → checked_out**: Check out after event
9. **Any state → cancelled**: Cancel registration

### Business Rules

#### Room Assignment

```typescript
// Cannot assign room unless participant is paid
function canAssignRoom(isPaid: boolean): boolean {
  return isPaid === true
}
```

**Enforcement**: The `isTransitionAllowed()` function checks:

- Transition from `paid` or `paid_unassigned` to `room_assigned` requires `isPaid: true`
- Staff cannot assign rooms to unpaid participants

#### Check-In

```typescript
// For on_site camps, participant must have room before checking in
function canCheckIn(
  hasRoom: boolean,
  roomAssignmentType: 'pre_assigned' | 'on_site' | 'mixed',
): boolean {
  if (roomAssignmentType === 'on_site') {
    return hasRoom === true
  }
  return true // pre_assigned and mixed modes allow check-in without room
}
```

**Enforcement**:

- `on_site` mode: Must be in `room_assigned` state before checking in
- `pre_assigned` mode: Can check in even without room assignment
- `mixed` mode: Flexible, allows both scenarios

### Usage Example

```typescript
import {
  isTransitionAllowed,
  getAvailableTransitions,
} from '@/lib/stateMachine'

// Check if transition is allowed
const canTransition = isTransitionAllowed('paid', 'room_assigned', {
  isPaid: true,
  hasRoom: false,
}) // returns true

// Get all available transitions from current state
const transitions = getAvailableTransitions('paid', {
  camp: campData,
  isPaid: true,
  hasRoom: false,
  roomAssignmentType: 'on_site',
})
// Returns: [{ from: 'paid', to: 'paid_unassigned', ... }, ...]
```

## Data Models

### GroupingDimension

Flexible participant organization (age groups, skill levels, buddy groups, etc.)

```typescript
interface GroupingDimension {
  name: string // e.g., "Age Group", "Skill Level"
  required: boolean // Must participant provide this value?
  values: string[] // Allowed values, e.g., ["13-15", "16-18"]
  order: number // Display order in forms
}
```

**Example:**

```typescript
const ageGroup: GroupingDimension = {
  name: 'Age Group',
  required: true,
  values: ['13-15', '16-18', '19-21'],
  order: 1,
}
```

### Camp

Main camp configuration

```typescript
interface Camp {
  id: string
  name: string
  slug: string // URL-friendly identifier
  description?: string
  dates: {
    start: Date
    end: Date
  }
  location?: string
  maxParticipants?: number
  minAge?: number
  maxAge?: number
  registrationOpen: boolean
  selfServiceEnabled: boolean
  selfServiceDeadline?: Date
  currency: string // 'USD', 'EUR', etc.
  totalCost?: number
  paymentRequired: boolean
  paymentDeadline?: Date
  paymentProcessor?: 'stripe' | 'paypal' | 'custom'
  groupingDimensions: GroupingDimension[]
  roomAssignmentType: 'pre_assigned' | 'on_site' | 'mixed'
  imageUrl?: string
  organizerId: string
  staff: Array<{
    userId: string
    role: 'organizer' | 'staff'
  }>
  createdAt: Date
  updatedAt: Date
}
```

**Room Assignment Types:**

- `pre_assigned`: Rooms assigned before camp starts (e.g., summer camps)
- `on_site`: Rooms assigned during check-in (e.g., conferences)
- `mixed`: Some participants pre-assigned, some on-site

### CampParticipant

Participant registration with comprehensive state tracking

```typescript
interface CampParticipant {
  id: string
  campId: string
  userId?: string // Optional link to user account

  // Personal information
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth?: Date
    gender?: 'male' | 'female' | 'other'
    emergencyContact?: {
      name: string
      phone: string
      relationship: string
    }
    medicalInfo?: {
      allergies?: string[]
      medications?: string[]
      conditions?: string[]
      notes?: string
    }
  }

  // Grouping dimension values
  groupingValues: Record<string, string>
  // e.g., { "Age Group": "13-15", "Skill Level": "Beginner" }

  // Lifecycle state tracking
  states: {
    registration: {
      state: 'draft' | 'registered'
      timestamp: Date
      actorUid?: string
    }
    payment: {
      state: 'pending' | 'paid' | 'cancelled'
      timestamp: Date
      actorUid?: string
    }
    room: {
      state: 'unassigned' | 'assigned' | 'checked_in' | 'checked_out'
      timestamp: Date
      actorUid?: string
    }
    checkIn: {
      state: 'pending' | 'checked_in' | 'checked_out' | 'no_show'
      timestamp: Date
      actorUid?: string
    }
  }

  // Payment details with audit trail
  paymentDetails: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
    amount?: number
    currency?: string
    method?: string
    transactionId?: string
    processor?: 'stripe' | 'paypal' | 'custom'
    paidAt?: Date
    auditHistory: Array<{
      actorUid: string
      ts: Date
      note?: string
    }>
  }

  // Room assignment
  room?: {
    roomId: string
    tentative?: boolean // For overbooking scenarios
    assignedAt?: Date
    assignedBy?: string
  }

  // Check-in/out tracking
  checkIn?: {
    ts: Date
    actorUid: string
  }
  checkOut?: {
    ts: Date
    actorUid: string
  }

  notes?: string
  registeredAt: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}
```

### Room

Room with capacity, gender segregation, and overbooking rules

```typescript
interface Room {
  id: string
  campId: string
  name: string // e.g., "Cabin A", "Room 201"
  type: string // e.g., "cabin", "hotel room", "tent"
  capacity: number // Max occupancy
  gender?: 'male' | 'female' | null // null = mixed gender allowed
  overbookAllowed: boolean // Can exceed capacity?
  currentOccupancy: number // Current number of assignments
  floor?: string | number
  building?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}
```

**Gender Segregation:**

- `gender: 'male'` - Only male participants
- `gender: 'female'` - Only female participants
- `gender: null` - Mixed gender allowed

**Overbooking:**

- When `overbookAllowed: true`, room can exceed capacity
- Use `tentative: true` in room assignment to mark overbookings
- Staff must resolve overbookings before event

## Validation Schemas (Zod)

### Participant Registration

```typescript
import { participantRegistrationSchema } from '@/lib/validators'

const result = participantRegistrationSchema.safeParse({
  campId: 'camp123',
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  groupingValues: {
    'Age Group': '13-15',
    'Skill Level': 'Beginner',
  },
})

if (!result.success) {
  console.error(result.error.errors)
}
```

### Payment Update

```typescript
import { paymentUpdateSchema } from '@/lib/validators'

const payment = paymentUpdateSchema.parse({
  participantId: 'p123',
  amount: 299.99,
  currency: 'USD',
  processor: 'stripe',
  transactionId: 'txn_abc123',
  actorUid: 'user456',
  note: 'Payment received via Stripe webhook',
})
```

### State Transition Validation

```typescript
import { stateTransitionSchema } from '@/lib/validators'

const transition = stateTransitionSchema.parse({
  participantId: 'p123',
  from: 'paid',
  to: 'room_assigned',
  actorUid: 'staff789',
  metadata: {
    roomId: 'room456',
  },
})
```

## Branded Types

For stronger type safety, use branded types to prevent mixing IDs:

```typescript
type ParticipantId = string & { readonly brand: unique symbol }
type CampId = string & { readonly brand: unique symbol }
type RoomId = string & { readonly brand: unique symbol }
type UserId = string & { readonly brand: unique symbol }

// This prevents accidentally passing a participantId where a campId is expected
function getCamp(campId: CampId): Camp { ... }
function getParticipant(participantId: ParticipantId): CampParticipant { ... }

// TypeScript will error on this:
// getCamp(participantId) ❌
```

## Audit Trail

Every significant action is tracked with:

- **Actor UID**: Who performed the action
- **Timestamp**: When it occurred
- **Note**: Optional context

```typescript
// Payment audit entry
{
  actorUid: "user123",
  ts: new Date("2026-02-09T10:30:00Z"),
  note: "Payment confirmed via Stripe webhook"
}
```

Audit history is stored in:

- `CampParticipant.paymentDetails.auditHistory[]`
- `AuditLog` collection for comprehensive logging

## Best Practices

1. **Always validate transitions** with `isTransitionAllowed()` before updating state
2. **Record audit entries** for all state changes and payments
3. **Use Zod schemas** to validate inputs before database writes
4. **Check business rules** (isPaid, hasRoom) before allowing transitions
5. **Respect roomAssignmentType** when enforcing check-in rules
6. **Use branded types** in function signatures for type safety
