import { z } from 'zod'

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address')

/**
 * Password validation schema (minimum 8 chars, 1 uppercase, 1 number)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Participant state enum schema
 */
export const participantStateSchema = z.enum([
  'draft',
  'registered',
  'payment_pending',
  'paid',
  'paid_unassigned',
  'room_assigned',
  'checked_in',
  'checked_out',
  'cancelled',
])

/**
 * Grouping dimension schema
 */
export const groupingDimensionSchema = z.object({
  name: z.string().min(1, 'Dimension name is required').max(100),
  required: z.boolean().default(false),
  values: z.array(z.string()).min(1, 'At least one value is required'),
  order: z.number().int().nonnegative(),
})

export type GroupingDimensionInput = z.infer<typeof groupingDimensionSchema>

/**
 * Personal info schema
 */
export const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: emailSchema,
  phone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  emergencyContact: z
    .object({
      name: z.string().min(1, 'Emergency contact name is required'),
      phone: z.string().min(1, 'Emergency contact phone is required'),
      relationship: z.string().min(1, 'Relationship is required'),
    })
    .optional(),
  medicalInfo: z
    .object({
      allergies: z.array(z.string()).optional(),
      medications: z.array(z.string()).optional(),
      conditions: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .optional(),
})

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>

/**
 * Participant registration form schema
 */
export const participantRegistrationSchema = z.object({
  campId: z.string().min(1, 'Camp ID is required'),
  personalInfo: personalInfoSchema,
  groupingValues: z.record(z.string(), z.string()),
})

export type ParticipantRegistrationInput = z.infer<
  typeof participantRegistrationSchema
>

/**
 * Payment details schema
 */
export const paymentDetailsSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
  amount: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(), // 'USD', 'EUR', etc.
  method: z.string().optional(),
  transactionId: z.string().optional(),
  processor: z.enum(['stripe', 'paypal', 'custom']).optional(),
  paidAt: z.date().optional(),
  auditHistory: z.array(
    z.object({
      actorUid: z.string(),
      ts: z.date(),
      note: z.string().optional(),
    }),
  ),
})

export type PaymentDetailsInput = z.infer<typeof paymentDetailsSchema>

/**
 * Payment update schema with validation
 */
export const paymentUpdateSchema = z.object({
  participantId: z.string(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  method: z.string().optional(),
  transactionId: z.string().optional(),
  processor: z.enum(['stripe', 'paypal', 'custom']),
  actorUid: z.string(),
  note: z.string().optional(),
})

export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>

/**
 * Room assignment schema
 */
export const roomAssignmentSchema = z.object({
  participantId: z.string(),
  roomId: z.string(),
  tentative: z.boolean().optional(),
  actorUid: z.string(),
})

export type RoomAssignmentInput = z.infer<typeof roomAssignmentSchema>

/**
 * State transition schema
 */
export const stateTransitionSchema = z.object({
  participantId: z.string(),
  from: participantStateSchema,
  to: participantStateSchema,
  actorUid: z.string(),
  note: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

export type StateTransitionInput = z.infer<typeof stateTransitionSchema>

/**
 * Camp creation schema
 */
export const campCreationSchema = z.object({
  name: z.string().min(1, 'Camp name is required').max(200),
  slug: z
    .string()
    .min(1)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase letters, numbers, and dashes',
    ),
  description: z.string().optional(),
  dates: z.object({
    start: z.date(),
    end: z.date(),
  }),
  location: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  minAge: z.number().int().nonnegative().optional(),
  maxAge: z.number().int().positive().optional(),
  currency: z.string().length(3), // 'USD', 'EUR', etc.
  totalCost: z.number().nonnegative().optional(),
  paymentRequired: z.boolean().default(false),
  roomAssignmentType: z.enum(['pre_assigned', 'on_site', 'mixed']),
  groupingDimensions: z.array(groupingDimensionSchema).default([]),
})

export type CampCreationInput = z.infer<typeof campCreationSchema>

/**
 * Room creation schema
 */
export const roomCreationSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  type: z.string().min(1, 'Room type is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  gender: z.enum(['male', 'female']).nullable().optional(),
  overbookAllowed: z.boolean().default(false),
  floor: z.union([z.string(), z.number()]).optional(),
  building: z.string().optional(),
  notes: z.string().optional(),
})

export type RoomCreationInput = z.infer<typeof roomCreationSchema>
