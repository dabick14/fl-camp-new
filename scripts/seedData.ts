/**
 * Seed script for Firebase Firestore emulator
 * Generates realistic sample data for testing and development
 */

// SET EMULATOR HOSTS BEFORE ANY IMPORTS
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'

import { initializeApp, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
// Remove these Firebase client SDK imports - we're using admin SDK
// import {
//   collection,
//   doc,
//   setDoc,
//   connectFirestoreEmulator,
// } from 'firebase/firestore'
import type {
  Camp,
  CampParticipant,
  Room,
  User,
  GroupingDimension,
  ParticipantState,
} from '../src/models/index'

// Initialize admin SDK for seeding
if (!getApps().length) {
  initializeApp({
    projectId: 'fl-camp-app',
  })
}

const auth = getAuth()
const db = getFirestore()

// Helper to remove undefined values and convert Dates to Timestamps
function prepareForFirestore<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return Timestamp.fromDate(obj) as any
  if (Array.isArray(obj)) return obj.map(prepareForFirestore) as T

  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = prepareForFirestore(value)
    }
  }
  return result
}

// Sample data generators
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

const buddyGroupDimension: GroupingDimension = {
  name: 'Buddy Group',
  required: false,
  values: ['Alpha', 'Beta', 'Gamma', 'Delta'],
  order: 3,
}

// Create sample camps
const camps: Camp[] = [
  {
    id: 'camp-summer-2026',
    name: 'Summer Leadership Camp 2026',
    slug: 'summer-leadership-2026',
    description:
      'A week-long leadership development program for teens and young adults',
    dates: {
      start: new Date('2026-07-15'),
      end: new Date('2026-07-22'),
    },
    location: 'Mountain View Retreat Center, Colorado',
    maxParticipants: 120,
    minAge: 13,
    maxAge: 21,
    registrationOpen: true,
    selfServiceEnabled: true,
    selfServiceDeadline: new Date('2026-07-01'),
    currency: 'USD',
    totalCost: 499.99,
    paymentRequired: true,
    paymentDeadline: new Date('2026-07-08'),
    paymentProcessor: 'stripe',
    groupingDimensions: [
      ageGroupDimension,
      skillLevelDimension,
      buddyGroupDimension,
    ],
    roomAssignmentType: 'on_site',
    imageUrl: 'https://example.com/summer-camp.jpg',
    organizerId: 'user-admin-001',
    staff: [
      { userId: 'user-admin-001', role: 'organizer' },
      { userId: 'user-staff-001', role: 'staff' },
      { userId: 'user-staff-002', role: 'staff' },
    ],
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'camp-winter-2026',
    name: 'Winter Sports & Faith Retreat 2026',
    slug: 'winter-retreat-2026',
    description: 'Ski, snowboard, and spiritual growth retreat',
    dates: {
      start: new Date('2026-12-20'),
      end: new Date('2026-12-27'),
    },
    location: 'Alpine Lodge, Utah',
    maxParticipants: 80,
    minAge: 16,
    maxAge: 25,
    registrationOpen: true,
    selfServiceEnabled: true,
    currency: 'USD',
    totalCost: 699.99,
    paymentRequired: true,
    paymentProcessor: 'stripe',
    groupingDimensions: [skillLevelDimension],
    roomAssignmentType: 'pre_assigned',
    organizerId: 'user-admin-001',
    staff: [{ userId: 'user-admin-001', role: 'organizer' }],
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'camp-spring-2026',
    name: 'Spring Youth Conference 2026',
    slug: 'spring-conference-2026',
    description: 'Three-day youth conference with workshops and activities',
    dates: {
      start: new Date('2026-04-10'),
      end: new Date('2026-04-12'),
    },
    location: 'City Convention Center',
    maxParticipants: 200,
    registrationOpen: true,
    selfServiceEnabled: true,
    currency: 'USD',
    totalCost: 149.99,
    paymentRequired: true,
    paymentProcessor: 'paypal',
    groupingDimensions: [ageGroupDimension],
    roomAssignmentType: 'mixed',
    organizerId: 'user-admin-001',
    staff: [
      { userId: 'user-admin-001', role: 'organizer' },
      { userId: 'user-staff-001', role: 'staff' },
    ],
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-02-01'),
  },
]

// Create sample rooms for Summer Camp
const rooms: Room[] = [
  // Male cabins
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `room-cabin-male-${i + 1}`,
    campId: 'camp-summer-2026',
    name: `Male Cabin ${String.fromCharCode(65 + i)}`,
    type: 'cabin',
    capacity: 8,
    gender: 'male' as const,
    overbookAllowed: true,
    currentOccupancy: 0,
    floor: 1,
    building: 'North Lodge',
    ...(i === 0 ? { notes: 'Has air conditioning' } : {}),
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  })),
  // Female cabins
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `room-cabin-female-${i + 1}`,
    campId: 'camp-summer-2026',
    name: `Female Cabin ${String.fromCharCode(70 + i)}`,
    type: 'cabin',
    capacity: 8,
    gender: 'female' as const,
    overbookAllowed: true,
    currentOccupancy: 0,
    floor: 1,
    building: 'South Lodge',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  })),
  // Staff rooms
  {
    id: 'room-staff-1',
    campId: 'camp-summer-2026',
    name: 'Staff Room 1',
    type: 'private',
    capacity: 2,
    gender: null,
    overbookAllowed: false,
    currentOccupancy: 0,
    floor: 2,
    building: 'Main Building',
    notes: 'Reserved for organizers',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
  },
]

// Helper to create participants in different states
const createParticipant = (
  id: string,
  campId: string,
  firstName: string,
  lastName: string,
  email: string,
  gender: 'male' | 'female' | 'other',
  ageGroup: string,
  state: ParticipantState,
  roomId?: string,
): CampParticipant => {
  const now = new Date()
  const isPaid = [
    'paid',
    'paid_unassigned',
    'room_assigned',
    'checked_in',
    'checked_out',
  ].includes(state)
  const hasRoom = ['room_assigned', 'checked_in', 'checked_out'].includes(state)
  const isCheckedIn = ['checked_in', 'checked_out'].includes(state)
  const isCheckedOut = state === 'checked_out'

  return {
    id,
    campId,
    personalInfo: {
      firstName,
      lastName,
      email,
      phone: `+1-555-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')}`,
      dateOfBirth: new Date(
        2008,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      ),
      gender,
      emergencyContact: {
        name: `${firstName} Parent`,
        phone: `+1-555-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')}`,
        relationship: 'Parent',
      },
      medicalInfo: {
        allergies: Math.random() > 0.7 ? ['Peanuts'] : [],
        medications: [],
        conditions: [],
      },
    },
    groupingValues: {
      'Age Group': ageGroup,
      'Skill Level': ['Beginner', 'Intermediate', 'Advanced'][
        Math.floor(Math.random() * 3)
      ],
    },
    states: {
      registration: {
        state: state === 'draft' ? 'draft' : 'registered',
        timestamp: now,
        actorUid: 'user-self-service',
      },
      payment: {
        state: isPaid
          ? 'paid'
          : state === 'payment_pending'
            ? 'pending'
            : 'pending',
        timestamp: now,
        actorUid: isPaid ? 'webhook-stripe' : undefined,
      },
      room: {
        state: hasRoom
          ? isCheckedOut
            ? 'checked_out'
            : isCheckedIn
              ? 'checked_in'
              : 'assigned'
          : 'unassigned',
        timestamp: now,
        actorUid: hasRoom ? 'user-staff-001' : undefined,
      },
      checkIn: {
        state: isCheckedOut
          ? 'checked_out'
          : isCheckedIn
            ? 'checked_in'
            : 'pending',
        timestamp: now,
        actorUid: isCheckedIn ? 'user-staff-001' : undefined,
      },
    },
    paymentDetails: {
      status: isPaid
        ? 'completed'
        : state === 'payment_pending'
          ? 'pending'
          : 'pending',
      amount: isPaid ? 499.99 : undefined,
      currency: isPaid ? 'USD' : undefined,
      transactionId: isPaid ? `txn_${id}` : undefined,
      processor: isPaid ? 'stripe' : undefined,
      paidAt: isPaid ? now : undefined,
      auditHistory: [
        {
          actorUid: 'user-self-service',
          ts: now,
          note: 'Registration created',
        },
        ...(isPaid
          ? [
              {
                actorUid: 'webhook-stripe',
                ts: now,
                note: 'Payment confirmed',
              },
            ]
          : []),
      ],
    },
    room:
      hasRoom && roomId
        ? {
            roomId,
            assignedAt: now,
            assignedBy: 'user-staff-001',
          }
        : undefined,
    checkIn: isCheckedIn
      ? {
          ts: now,
          actorUid: 'user-staff-001',
        }
      : undefined,
    checkOut: isCheckedOut
      ? {
          ts: now,
          actorUid: 'user-staff-001',
        }
      : undefined,
    ...(state === 'cancelled'
      ? { notes: 'Cancelled due to scheduling conflict' }
      : {}),
    registeredAt: now,
    createdAt: now,
    updatedAt: now,
    createdBy: 'user-self-service',
  }
}

// Sample participants in various states
const participants: CampParticipant[] = [
  // Draft participants
  createParticipant(
    'participant-001',
    'camp-summer-2026',
    'John',
    'Doe',
    'john.doe@example.com',
    'male',
    '16-18',
    'draft',
  ),
  // Registered participants
  createParticipant(
    'participant-002',
    'camp-summer-2026',
    'Jane',
    'Smith',
    'jane.smith@example.com',
    'female',
    '16-18',
    'registered',
  ),
  // Payment pending
  createParticipant(
    'participant-003',
    'camp-summer-2026',
    'Mike',
    'Johnson',
    'mike.johnson@example.com',
    'male',
    '13-15',
    'payment_pending',
  ),
  createParticipant(
    'participant-004',
    'camp-summer-2026',
    'Sarah',
    'Williams',
    'sarah.williams@example.com',
    'female',
    '13-15',
    'payment_pending',
  ),
  // Paid
  createParticipant(
    'participant-005',
    'camp-summer-2026',
    'David',
    'Brown',
    'david.brown@example.com',
    'male',
    '19-21',
    'paid',
  ),
  createParticipant(
    'participant-006',
    'camp-summer-2026',
    'Emily',
    'Davis',
    'emily.davis@example.com',
    'female',
    '19-21',
    'paid',
  ),
  // Paid but unassigned
  createParticipant(
    'participant-007',
    'camp-summer-2026',
    'Chris',
    'Miller',
    'chris.miller@example.com',
    'male',
    '16-18',
    'paid_unassigned',
  ),
  createParticipant(
    'participant-008',
    'camp-summer-2026',
    'Ashley',
    'Wilson',
    'ashley.wilson@example.com',
    'female',
    '16-18',
    'paid_unassigned',
  ),
  // Room assigned
  createParticipant(
    'participant-009',
    'camp-summer-2026',
    'Ryan',
    'Moore',
    'ryan.moore@example.com',
    'male',
    '13-15',
    'room_assigned',
    'room-cabin-male-1',
  ),
  createParticipant(
    'participant-010',
    'camp-summer-2026',
    'Jessica',
    'Taylor',
    'jessica.taylor@example.com',
    'female',
    '13-15',
    'room_assigned',
    'room-cabin-female-1',
  ),
  // Checked in
  createParticipant(
    'participant-011',
    'camp-summer-2026',
    'Kevin',
    'Anderson',
    'kevin.anderson@example.com',
    'male',
    '16-18',
    'checked_in',
    'room-cabin-male-2',
  ),
  createParticipant(
    'participant-012',
    'camp-summer-2026',
    'Amanda',
    'Thomas',
    'amanda.thomas@example.com',
    'female',
    '16-18',
    'checked_in',
    'room-cabin-female-2',
  ),
  // Checked out
  createParticipant(
    'participant-013',
    'camp-summer-2026',
    'Brandon',
    'Jackson',
    'brandon.jackson@example.com',
    'male',
    '19-21',
    'checked_out',
    'room-cabin-male-3',
  ),
  // Cancelled
  createParticipant(
    'participant-014',
    'camp-summer-2026',
    'Michelle',
    'White',
    'michelle.white@example.com',
    'female',
    '19-21',
    'cancelled',
  ),
]

// Sample users
const users: User[] = [
  {
    id: 'user-super-admin-001',
    email: 'superadmin@flcamp.com',
    firstName: 'Super',
    lastName: 'Admin',
    phoneNumber: '+1-555-0000',
    globalRoles: ['super_admin'],
    roles: {},
    campIds: ['camp-summer-2026', 'camp-winter-2026', 'camp-spring-2026'],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'user-camp-admin-001',
    email: 'admin@flcamp.com',
    firstName: 'Camp',
    lastName: 'Admin',
    phoneNumber: '+1-555-0001',
    globalRoles: [],
    roles: {
      'camp-summer-2026': 'admin',
      'camp-winter-2026': 'admin',
      'camp-spring-2026': 'admin',
    },
    campIds: ['camp-summer-2026', 'camp-winter-2026', 'camp-spring-2026'],
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'user-treasurer-001',
    email: 'treasurer@flcamp.com',
    firstName: 'Treasurer',
    lastName: 'User',
    phoneNumber: '+1-555-0002',
    globalRoles: [],
    roles: {
      'camp-summer-2026': 'admin',
    },
    campIds: ['camp-summer-2026'],
    isActive: true,
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-02-01'),
  },
  {
    id: 'user-limited-001',
    email: 'limited@flcamp.com',
    firstName: 'Limited',
    lastName: 'User',
    phoneNumber: '+1-555-0003',
    globalRoles: [],
    roles: {
      'camp-summer-2026': 'staff',
    },
    campIds: ['camp-summer-2026'],
    isActive: true,
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-02-01'),
  },
]

// Test users for Firebase Auth (password: TestPassword123!)
const testAuthUsers = [
  {
    email: 'superadmin@flcamp.com',
    password: 'TestPassword123!',
    userId: 'user-super-admin-001',
  },
  {
    email: 'admin@flcamp.com',
    password: 'TestPassword123!',
    userId: 'user-camp-admin-001',
  },
  {
    email: 'treasurer@flcamp.com',
    password: 'TestPassword123!',
    userId: 'user-treasurer-001',
  },
  {
    email: 'limited@flcamp.com',
    password: 'TestPassword123!',
    userId: 'user-limited-001',
  },
]

// Seed function
async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Create Firebase Auth users
    console.log('🔐 Creating Firebase Auth users...')
    for (const testUser of testAuthUsers) {
      try {
        await auth.createUser({
          uid: testUser.userId,
          email: testUser.email,
          password: testUser.password,
        })
        console.log(`  ✓ Created auth user: ${testUser.email}`)
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`  ⓘ Auth user already exists: ${testUser.email}`)
        } else {
          console.error(
            `  ✗ Failed to create auth user ${testUser.email}:`,
            error.message,
          )
        }
      }
    }

    // Seed camps
    console.log('\n📋 Seeding camps...')
    for (const camp of camps) {
      await db.collection('camps').doc(camp.id).set(prepareForFirestore(camp))
      console.log(`  ✓ Created camp: ${camp.name}`)
    }

    // Seed rooms
    console.log('\n🏠 Seeding rooms...')
    for (const room of rooms) {
      await db.collection('rooms').doc(room.id).set(prepareForFirestore(room))
      console.log(`  ✓ Created room: ${room.name}`)
    }

    // Seed participants
    console.log('\n👥 Seeding participants...')
    for (const participant of participants) {
      await db
        .collection('participants')
        .doc(participant.id)
        .set(prepareForFirestore(participant))
      console.log(
        `  ✓ Created participant: ${participant.personalInfo.firstName} ${participant.personalInfo.lastName}`,
      )
    }

    // Seed users
    console.log('\n🔑 Seeding users...')
    for (const user of users) {
      await db.collection('users').doc(user.id).set(prepareForFirestore(user))
      console.log(`  ✓ Created user: ${user.email}`)
    }

    console.log('\n✅ Database seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`  - ${camps.length} camps`)
    console.log(`  - ${rooms.length} rooms`)
    console.log(`  - ${participants.length} participants`)
    console.log(`  - ${users.length} users`)

    console.log('\n🔑 Test User Credentials (Password: TestPassword123!):')
    testAuthUsers.forEach((user) => {
      const userRole = users.find((u) => u.email === user.email)
      if (userRole?.globalRoles?.includes('super_admin')) {
        console.log(
          `  - ${user.email} (Super Admin - Full access to all camps)`,
        )
      } else {
        const campRoles = userRole?.roles ? Object.entries(userRole.roles) : []
        if (campRoles.length > 0) {
          const rolesStr = campRoles
            .map(([cid, role]) => `${cid}: ${role}`)
            .join(', ')
          console.log(`  - ${user.email} (${rolesStr})`)
        } else {
          console.log(`  - ${user.email} (No roles assigned)`)
        }
      }
    })

    console.log('\n🔍 Participant state breakdown:')
    const stateCounts = participants.reduce(
      (acc, p) => {
        const state = p.states.registration.state
        acc[state] = (acc[state] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    Object.entries(stateCounts).forEach(([state, count]) => {
      console.log(`  - ${state}: ${count}`)
    })

    console.log('\n💡 Access the data:')
    console.log('  - Firestore UI: http://localhost:4000/firestore')
    console.log('  - Auth UI: http://localhost:4000/auth')
    console.log('  - App UI: http://localhost:5173')
    console.log('\n')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seed
seedDatabase()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
