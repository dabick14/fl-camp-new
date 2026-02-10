# Database Seeding Guide

## Quick Start

### 1. Start Firebase Emulators
```bash
npm run emulators
# Or with auto-import/export:
npm run emulators:seed
```

### 2. Seed the Database (in a new terminal)
```bash
npm run seed
```

## What Gets Seeded

### 3 Camps
- **Summer Leadership Camp 2026** (July 15-22)
  - 120 max participants
  - On-site room assignment
  - $499.99, payment required
  - Age groups, skill levels, buddy groups
  
- **Winter Sports & Faith Retreat 2026** (Dec 20-27)
  - 80 max participants
  - Pre-assigned rooms
  - $699.99, payment required
  
- **Spring Youth Conference 2026** (April 10-12)
  - 200 max participants
  - Mixed assignment mode
  - $149.99, payment required

### 11 Rooms (for Summer Camp)
- 5 Male cabins (8 capacity each)
- 5 Female cabins (8 capacity each)
- 1 Staff room (2 capacity)
- All allow overbooking except staff room

### 14 Participants (Various States)
Demonstrates the full participant lifecycle:

1. **Draft** (1 participant)
   - John Doe - incomplete registration

2. **Registered** (1 participant)
   - Jane Smith - registration complete, no payment

3. **Payment Pending** (2 participants)
   - Mike Johnson, Sarah Williams - awaiting payment

4. **Paid** (2 participants)
   - David Brown, Emily Davis - payment confirmed, no room yet

5. **Paid Unassigned** (2 participants)
   - Chris Miller, Ashley Wilson - paid but explicitly unassigned

6. **Room Assigned** (2 participants)
   - Ryan Moore (Male Cabin A)
   - Jessica Taylor (Female Cabin F)

7. **Checked In** (2 participants)
   - Kevin Anderson (Male Cabin B)
   - Amanda Thomas (Female Cabin G)

8. **Checked Out** (1 participant)
   - Brandon Jackson (Male Cabin C)

9. **Cancelled** (1 participant)
   - Michelle White - cancelled with note

### 3 Users
- **admin@flcamp.com** - Admin access to all camps
- **staff1@flcamp.com** - Staff for Summer & Spring camps
- **staff2@flcamp.com** - Staff for Summer camp only

## Sample Data Details

### Participant Data Includes:
- ✅ Personal info (name, email, phone, DOB, gender)
- ✅ Emergency contact information
- ✅ Medical info (random allergies for ~30% of participants)
- ✅ Grouping dimension values (age group, skill level)
- ✅ Complete state tracking (registration, payment, room, check-in)
- ✅ Payment audit history
- ✅ Room assignments (where applicable)
- ✅ Check-in/check-out timestamps

### Room Features:
- ✅ Gender segregation (male/female/mixed)
- ✅ Overbooking configuration
- ✅ Different room types (cabin, private)
- ✅ Building and floor assignments

## Accessing the Data

### Firestore Emulator UI
```
http://localhost:4000/firestore
```

Browse collections:
- `camps` - 3 camps
- `rooms` - 11 rooms
- `participants` - 14 participants in various states
- `users` - 3 users with different roles

### Auth Emulator UI
```
http://localhost:4000/auth
```

## Testing Different Scenarios

### Scenario 1: Room Assignment Workflow
```typescript
// Use participants in "paid" or "paid_unassigned" state
// participant-005 (David Brown) - male, paid
// participant-006 (Emily Davis) - female, paid

// Assign to rooms:
// room-cabin-male-1 (has capacity)
// room-cabin-female-1 (has capacity)
```

### Scenario 2: Check-In Process
```typescript
// Use participants in "room_assigned" state
// participant-009 (Ryan Moore) - already has room
// participant-010 (Jessica Taylor) - already has room

// Transition to "checked_in"
```

### Scenario 3: Payment Processing
```typescript
// Use participants in "payment_pending" state
// participant-003 (Mike Johnson)
// participant-004 (Sarah Williams)

// Simulate payment webhook to transition to "paid"
```

### Scenario 4: State Machine Validation
```typescript
// Test business rules:
// ❌ Cannot assign room to participant-003 (payment pending)
// ✅ Can assign room to participant-005 (paid)
// ❌ Cannot check-in participant-005 without room (on_site mode)
// ✅ Can check-in participant-009 (has room assigned)
```

## Re-seeding

To clear and re-seed:

1. Stop emulators (Ctrl+C)
2. Delete emulator data:
   ```bash
   rm -rf firebase-data
   ```
3. Restart emulators:
   ```bash
   npm run emulators
   ```
4. Run seed script:
   ```bash
   npm run seed
   ```

## Customizing Sample Data

Edit `scripts/seedData.ts` to:
- Add more participants
- Create additional camps
- Add more rooms
- Modify grouping dimensions
- Change participant states

## Firestore Collection Structure

```
/camps/{campId}
  - Camp document

/rooms/{roomId}
  - Room document
  - Query by: campId

/participants/{participantId}
  - CampParticipant document
  - Query by: campId, states.*, personalInfo.email

/users/{userId}
  - User document
  - Query by: email, campIds
```

## Tips

1. **Keep emulators running** while developing
2. **Use the Firestore UI** to inspect data structures
3. **Test state transitions** with the seeded participants
4. **Verify business rules** (can't assign room if not paid, etc.)
5. **Check validation** by trying to update with invalid data

## Next Steps

With seeded data, you can now:
1. Build UI components that display camps, participants, rooms
2. Test state transitions in the UI
3. Implement room assignment logic
4. Build check-in/check-out flows
5. Test payment webhooks
6. Validate business rules in real scenarios
