# Core Data Models Implementation Summary

## ✅ Completed Implementation

### 1. ParticipantState Enum

**Location:** [src/models/index.ts](src/models/index.ts)

```typescript
type ParticipantState =
  | 'draft'
  | 'registered'
  | 'payment_pending'
  | 'paid'
  | 'paid_unassigned'
  | 'room_assigned'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
```

### 2. Core Interfaces

#### GroupingDimension

```typescript
interface GroupingDimension {
  name: string // Dimension name (e.g., "Age Group")
  required: boolean // Is this required during registration?
  values: string[] // Allowed values (e.g., ["13-15", "16-18"])
  order: number // Display order
}
```

#### Camp

```typescript
interface Camp {
  // ... (41 properties total)
  groupingDimensions: GroupingDimension[]
  roomAssignmentType: 'pre_assigned' | 'on_site' | 'mixed'
  dates: { start: Date; end: Date }
  // Full details in src/models/index.ts
}
```

#### CampParticipant

```typescript
interface CampParticipant {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    // ... emergency contact, medical info
  }
  groupingValues: Record<string, string>
  states: ParticipantStateTracking
  paymentDetails: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
    auditHistory: AuditEntry[]
    // ... transaction details
  }
  room?: {
    roomId: string
    tentative?: boolean
    // ...
  }
  // ... check-in/out tracking
}
```

#### Room

```typescript
interface Room {
  name: string
  type: string
  capacity: number
  gender?: 'male' | 'female' | null
  overbookAllowed: boolean
  currentOccupancy: number
  // ...
}
```

### 3. Zod Validation Schemas

**Location:** [src/lib/validators.ts](src/lib/validators.ts)

- `participantStateSchema` - Validates participant states
- `groupingDimensionSchema` - Validates grouping dimensions
- `personalInfoSchema` - Validates personal information
- `participantRegistrationSchema` - Full registration validation
- `paymentDetailsSchema` - Payment details validation
- `paymentUpdateSchema` - Payment update with audit trail
- `roomAssignmentSchema` - Room assignment validation
- `stateTransitionSchema` - State transition validation
- `campCreationSchema` - Camp creation validation
- `roomCreationSchema` - Room creation validation

### 4. State Machine Utilities

**Location:** [src/lib/stateMachine.ts](src/lib/stateMachine.ts)

#### Core Functions

**isTransitionAllowed(from, to, context?)**

```typescript
// Checks if a state transition is valid with business rules
isTransitionAllowed('paid', 'room_assigned', {
  isPaid: true,
  hasRoom: false,
}) // returns true
```

**Business Rules Enforced:**

- ✅ Cannot assign room unless `isPaid: true`
- ✅ Cannot check-in unless `room_assigned` (for `on_site` mode)
- ✅ Pre-assigned and mixed modes allow flexible check-in

**getAvailableTransitions(from, context?)**

```typescript
// Returns all valid transitions from current state
const transitions = getAvailableTransitions('paid', {
  isPaid: true,
  roomAssignmentType: 'on_site',
})
```

**Helper Functions:**

- `canAssignRoom(isPaid)` - Business rule for room assignment
- `canCheckIn(hasRoom, roomAssignmentType)` - Business rule for check-in
- `isValidTransition(from, to)` - Simple transition check
- `getStateColor(state)` - shadcn/ui color tokens for state badges
- `getStateLabel(state)` - Human-readable state labels

### 5. Branded Types for Type Safety

**Location:** [src/models/index.ts](src/models/index.ts)

```typescript
type ParticipantId = string & { readonly brand: unique symbol }
type CampId = string & { readonly brand: unique symbol }
type RoomId = string & { readonly brand: unique symbol }
type UserId = string & { readonly brand: unique symbol }
```

**Benefits:**

- Prevents mixing participant IDs with camp IDs
- Compile-time safety without runtime overhead
- Better IDE autocomplete and error messages

## Files Modified/Created

### Created

1. ✅ [src/lib/utils.ts](src/lib/utils.ts) - cn() utility for shadcn/ui
2. ✅ [MODELS_REFERENCE.md](MODELS_REFERENCE.md) - Comprehensive documentation

### Modified

1. ✅ [src/models/index.ts](src/models/index.ts) - Complete rewrite with new models
2. ✅ [src/lib/validators.ts](src/lib/validators.ts) - Added comprehensive Zod schemas
3. ✅ [src/lib/stateMachine.ts](src/lib/stateMachine.ts) - Enhanced with business rules

## State Transition Examples

### Example 1: Standard Flow

```
draft
  → registered (complete registration form)
  → payment_pending (request payment)
  → paid (payment webhook confirms)
  → room_assigned (staff assigns room - requires isPaid: true)
  → checked_in (participant arrives)
  → checked_out (participant leaves)
```

### Example 2: On-Site Assignment

```
draft
  → registered
  → payment_pending
  → paid
  → paid_unassigned (payment confirmed, no room yet)
  → checked_in (arrives at event - roomAssignmentType: 'pre_assigned')
  → room_assigned (assigned during event)
  → checked_out
```

### Example 3: Pre-Assigned Flow

```
draft
  → registered
  → payment_pending
  → paid (payment confirmed)
  → room_assigned (staff pre-assigns room)
  → checked_in (participant checks in with pre-assigned room)
  → checked_out
```

## Business Rules Summary

### Room Assignment Rules

1. **Cannot assign room unless participant is paid**
   - Enforced by: `isTransitionAllowed()` checks `isPaid: true`
   - Applies to: `paid → room_assigned` and `paid_unassigned → room_assigned`

2. **Gender segregation**
   - Room.gender can be `'male'`, `'female'`, or `null` (mixed)
   - Staff must respect gender when assigning rooms

3. **Overbooking**
   - When `Room.overbookAllowed: true`, can exceed capacity
   - Mark assignments as `tentative: true` for overbookings
   - Staff resolves before event

### Check-In Rules (by roomAssignmentType)

**on_site mode:**

- ❌ Cannot check-in unless `room_assigned`
- Enforced by: `canCheckIn()` business rule

**pre_assigned mode:**

- ✅ Can check-in without room assignment
- Rooms assigned before event

**mixed mode:**

- ✅ Flexible - allows both scenarios

## Validation Examples

### Validate Registration

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
  },
})

if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors)
}
```

### Validate State Transition

```typescript
import { stateTransitionSchema } from '@/lib/validators'
import { isTransitionAllowed } from '@/lib/stateMachine'

// 1. Validate input schema
const transition = stateTransitionSchema.parse({
  participantId: 'p123',
  from: 'paid',
  to: 'room_assigned',
  actorUid: 'staff456',
  metadata: { roomId: 'room789' },
})

// 2. Check business rules
const allowed = isTransitionAllowed(transition.from, transition.to, {
  isPaid: true,
  hasRoom: false,
})

if (!allowed) {
  throw new Error('Transition not allowed by business rules')
}

// 3. Proceed with state change
// ... update database
```

## Next Steps

The data models are now complete and ready for:

1. Firestore integration (write/read operations)
2. UI components (forms, tables, state badges)
3. Business logic implementation (state transitions, room assignment)
4. API endpoints (if needed for backend)

See [MODELS_REFERENCE.md](MODELS_REFERENCE.md) for detailed usage guide.
