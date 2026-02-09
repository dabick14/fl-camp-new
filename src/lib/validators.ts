import { z } from 'zod'
import type { ParticipantState } from '@models/index'

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
 * Participant registration form schema
 */
export const participantRegistrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: emailSchema,
  phone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

export type ParticipantRegistrationInput = z.infer<
  typeof participantRegistrationSchema
>

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
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  minAge: z.number().int().nonnegative().optional(),
  maxAge: z.number().int().positive().optional(),
  currency: z.string().length(3), // 'USD', 'EUR', etc.
  totalCost: z.number().nonnegative().optional(),
  paymentRequired: z.boolean().default(false),
})

export type CampCreationInput = z.infer<typeof campCreationSchema>

/**
 * Room creation schema
 */
export const roomCreationSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().int().positive('Capacity must be positive'),
  genderSegregated: z.boolean().default(false),
  allowedGenders: z.array(z.enum(['male', 'female', 'other'])).optional(),
  allowOverbook: z.boolean().default(false),
  overbookPercentage: z.number().min(100).max(150).optional(),
  floor: z.union([z.string(), z.number()]).optional(),
})

export type RoomCreationInput = z.infer<typeof roomCreationSchema>

/**
 * Payment schema
 */
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  participantId: z.string(),
  campId: z.string(),
})

export type PaymentInput = z.infer<typeof paymentSchema>
