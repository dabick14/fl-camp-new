/**
 * Registration service for public self-service flow
 * Now uses Cloud Functions for secure server-side registration
 */
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase'
import type { Camp } from '@/models/index'

export interface RegistrationFormData {
  firstName: string
  lastName: string
  email?: string
  phone: string
  gender: 'male' | 'female' | 'other'
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  groupingValues: Record<string, string>
}

interface RegisterParticipantResult {
  success: boolean
  participantId?: string
  campId?: string
  message?: string
  paymentLink?: string
  error?:
    | 'camp_not_found'
    | 'camp_closed'
    | 'registration_closed'
    | 'deadline_passed'
    | 'duplicate_phone'
    | 'max_reached'
    | 'invalid_recaptcha'
    | 'internal_error'
}

function convertCampTimestamps(data: any): Camp {
  return {
    id: data.id,
    ...data,
    dates: {
      start: data.dates?.start?.toDate?.() || new Date(data.dates?.start),
      end: data.dates?.end?.toDate?.() || new Date(data.dates?.end),
    },
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    selfServiceDeadline: data.selfServiceDeadline?.toDate?.()
      ? data.selfServiceDeadline.toDate()
      : data.selfServiceDeadline
        ? new Date(data.selfServiceDeadline)
        : undefined,
    paymentDeadline: data.paymentDeadline?.toDate?.()
      ? data.paymentDeadline.toDate()
      : data.paymentDeadline
        ? new Date(data.paymentDeadline)
        : undefined,
  } as Camp
}

export async function getCampBySlug(slug: string): Promise<Camp | null> {
  const campsRef = collection(db, 'camps')
  const q = query(campsRef, where('slug', '==', slug), limit(1))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const docSnap = snapshot.docs[0]
  return convertCampTimestamps({ id: docSnap.id, ...docSnap.data() })
}

export async function registerParticipant(
  campSlug: string,
  formData: RegistrationFormData,
  recaptchaToken?: string,
): Promise<RegisterParticipantResult> {
  const registerFn = httpsCallable<
    {
      campSlug: string
      formData: RegistrationFormData
      recaptchaToken?: string
    },
    RegisterParticipantResult
  >(functions, 'registerParticipant')

  try {
    const result = await registerFn({ campSlug, formData, recaptchaToken })
    return result.data
  } catch (error: any) {
    console.error('Error calling registerParticipant function:', error)

    // Handle function errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error('Authentication required')
    } else if (error.code === 'functions/permission-denied') {
      throw new Error('Permission denied')
    } else if (error.code === 'functions/invalid-argument') {
      throw new Error(error.message || 'Invalid registration data')
    }

    throw new Error('Registration failed. Please try again.')
  }
}
