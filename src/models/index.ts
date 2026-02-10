/**
 * Core domain models for Camp Management System
 */

/**
 * Participant state machine transitions:
 * draft → registered → payment_pending → paid → paid_unassigned → room_assigned → checked_in → checked_out
 */
export type ParticipantState =
  | 'draft'
  | 'registered'
  | 'payment_pending'
  | 'paid'
  | 'paid_unassigned'
  | 'room_assigned'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'

// Branded types for stronger type safety
export type ParticipantId = string & { readonly brand: unique symbol }
export type CampId = string & { readonly brand: unique symbol }
export type RoomId = string & { readonly brand: unique symbol }
export type UserId = string & { readonly brand: unique symbol }

/**
 * User roles with camp-scoped access
 */
export type UserRole =
  | 'admin'
  | 'organizer'
  | 'staff'
  | 'parent'
  | 'participant'

/**
 * Grouping dimensions for flexible participant organization
 * (age, grade, gender, buddy system, etc.)
 */
export interface GroupingDimension {
  name: string
  required: boolean
  values: string[]
  order: number
}

/**
 * Room with capacity, gender segregation, and overbooking rules
 */
export interface Room {
  id: string
  campId: string
  name: string
  type: string
  capacity: number
  gender?: 'male' | 'female' | null
  overbookAllowed: boolean
  currentOccupancy: number
  floor?: string | number
  building?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Room assignment with tracking
 */
export interface RoomAssignment {
  id: string
  campId: string
  participantId: string
  roomId: string
  assignedAt: Date
  assignedBy: string // user ID
  autoAssigned: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Camp configuration and metadata
 */
export interface Camp {
  id: string
  name: string
  slug: string // for self-service registration links
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
  staff: {
    userId: string
    role: 'organizer' | 'staff'
  }[]
  createdAt: Date
  updatedAt: Date
}

/**
 * State tracking for different lifecycle phases
 */
export interface ParticipantStateTracking {
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

/**
 * Audit history entry
 */
export interface AuditEntry {
  actorUid: string
  ts: Date
  note?: string
}

/**
 * Camp participant with state machine tracking
 */
export interface CampParticipant {
  id: string
  campId: string
  userId?: string // optional, for parent registrations

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

  // Grouping dimension values (e.g., {"ageGroup": "13-15", "skillLevel": "beginner"})
  groupingValues: Record<string, string>

  // State machine tracking for each lifecycle phase
  states: ParticipantStateTracking

  // Payment tracking
  paymentDetails: {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
    amount?: number
    currency?: string
    method?: string
    transactionId?: string
    processor?: 'stripe' | 'paypal' | 'custom'
    paidAt?: Date
    auditHistory: AuditEntry[]
  }

  // Room assignment
  room?: {
    roomId: string
    tentative?: boolean // for overbooking scenarios
    assignedAt?: Date
    assignedBy?: string
  }

  // Check-in tracking
  checkIn?: {
    ts: Date
    actorUid: string
  }

  // Check-out tracking
  checkOut?: {
    ts: Date
    actorUid: string
  }

  // Additional notes
  notes?: string

  // Audit trail
  registeredAt: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

/**
 * Global user with multi-camp roles
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
  photoUrl?: string
  roles: Record<string, UserRole> // campId → role mapping
  campIds: string[] // camps user has access to
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Audit log entry for compliance and debugging
 */
export interface AuditLog {
  id: string
  campId: string
  entityType: 'camp' | 'participant' | 'room' | 'payment' | 'assignment'
  entityId: string
  action: 'create' | 'update' | 'delete' | 'state_change'
  changedFields?: Record<string, { old: any; new: any }>
  userId: string
  ipAddress?: string
  timestamp: Date
}

/**
 * Payment transaction record
 */
export interface PaymentTransaction {
  id: string
  campId: string
  participantId: string
  amount: number
  currency: string
  processor: string // 'stripe', 'paypal', 'custom'
  transactionId: string // processor's transaction ID
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  metadata?: Record<string, any>
  receiptUrl?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Webhook event for async processing
 */
export interface WebhookEvent {
  id: string
  type: 'payment.completed' | 'payment.failed' | 'participant.registered'
  campId: string
  payload: Record<string, any>
  processed: boolean
  processedAt?: Date
  error?: string
  createdAt: Date
}
