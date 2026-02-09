/**
 * Core domain models for Camp Management System
 */

/**
 * Participant state machine transitions:
 * draft → registered → payment_pending → paid → room_assigned → checked_in
 */
export type ParticipantState =
  | 'draft'
  | 'registered'
  | 'payment_pending'
  | 'paid'
  | 'room_assigned'
  | 'checked_in'
  | 'cancelled'
  | 'no_show'

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
  id: string
  campId: string
  name: string
  type: 'select' | 'text' | 'number' | 'checkbox'
  required: boolean
  options?: string[] // for select type
  createdAt: Date
  updatedAt: Date
}

/**
 * Room with capacity, gender segregation, and overbooking rules
 */
export interface Room {
  id: string
  campId: string
  name: string
  capacity: number
  currentOccupancy: number
  allowOverbook: boolean
  overbookPercentage?: number // e.g., 110 means 10% overbooking allowed
  genderSegregated: boolean
  allowedGenders?: ('male' | 'female' | 'other')[]
  floor?: string | number
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
  startDate: Date
  endDate: Date
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
  paymentProcessor?: 'stripe' | 'paypal' | 'custom' // extensible
  groupingDimensions: string[] // array of GroupingDimension IDs
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
 * Camp participant with state machine tracking
 */
export interface CampParticipant {
  id: string
  campId: string
  userId?: string // optional, for parent registrations
  firstName: string
  lastName: string
  email: string
  phone?: string
  dateOfBirth?: Date
  gender?: 'male' | 'female' | 'other'
  state: ParticipantState
  stateChangedAt: Date
  stateChangedBy?: string // user ID

  // Grouping dimension values
  dimensionValues: Record<string, string | number | boolean>

  // Room assignment
  roomId?: string
  roomAssignedAt?: Date
  roomAssignedBy?: string

  // Payment tracking
  paymentStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  paymentAmount?: number
  paymentMethod?: string
  paymentIntentId?: string // Stripe, PayPal, etc.
  paymentDate?: Date

  // Metadata
  notes?: string
  registeredAt: Date
  checkedInAt?: Date

  // Audit trail
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
