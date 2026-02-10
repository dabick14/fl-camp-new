/**
 * Cloud Functions for FL Camp App
 * Handles authentication, authorization, and custom token generation
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as jwt from 'jsonwebtoken'

// Initialize Firebase Admin
admin.initializeApp()

const db = admin.firestore()

// ReCAPTCHA secret (optional - set in Firebase environment config)
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET

// Paystack secret key (stub - set in Firebase environment config)
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

// JWT secret - In production, use Firebase Secret Manager or environment variable
const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRY = '7d' // 7 days

/**
 * Custom claims structure for authorization
 */
interface CustomClaims {
  uid: string
  email: string
  globalRoles: string[] // ['super_admin', 'support', etc.]
  scopedRoles: Record<string, string> // { 'camp-123': 'admin', 'camp-456': 'treasurer' }
  exp?: number
  iat?: number
}

/**
 * HTTPS Callable Function: Exchange Firebase ID token for custom JWT
 *
 * Client calls this after Firebase Auth sign-in to get custom claims
 *
 * @param idToken - Firebase ID token from client
 * @returns Custom JWT with user claims
 */
export const exchangeToken = functions.https.onCall(async (data, context) => {
  try {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to exchange tokens',
      )
    }

    const uid = context.auth.uid
    const email = context.auth.token.email || ''

    // Fetch user document from Firestore
    // First try to get by UID
    let userDoc = await db.collection('users').doc(uid).get()

    // If not found by UID, try to find by email
    if (!userDoc.exists) {
      const emailQuery = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (emailQuery.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'User profile not found. Please complete registration.',
        )
      }

      userDoc = emailQuery.docs[0]
    }

    const userData = userDoc.data()!

    // Build custom claims
    const claims: CustomClaims = {
      uid,
      email,
      globalRoles: userData.globalRoles || [],
      scopedRoles: userData.roles || {}, // campId -> role mapping
    }

    // Generate custom JWT
    const customToken = jwt.sign(claims, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      issuer: 'fl-camp-app',
      audience: 'fl-camp-app',
    })

    // Log token exchange for audit
    await db.collection('auditLogs').add({
      type: 'token_exchange',
      userId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: context.rawRequest?.ip || 'unknown',
    })

    return {
      customToken,
      claims,
      expiresIn: JWT_EXPIRY,
    }
  } catch (error: any) {
    console.error('Token exchange error:', error)

    if (error instanceof functions.https.HttpsError) {
      throw error
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to exchange token',
      error.message,
    )
  }
})

/**
 * HTTPS Callable Function: Refresh custom JWT token
 *
 * @param customToken - Existing custom token (can be expired)
 * @returns New custom JWT with refreshed expiry
 */
export const refreshToken = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to refresh tokens',
      )
    }

    const uid = context.auth.uid
    const email = context.auth.token.email || ''

    // Fetch latest user data
    // First try by UID, then by email
    let userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      const emailQuery = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (emailQuery.empty) {
        throw new functions.https.HttpsError('not-found', 'User not found')
      }

      userDoc = emailQuery.docs[0]
    }

    const userData = userDoc.data()!

    // Generate new token with latest claims
    const claims: CustomClaims = {
      uid,
      email: context.auth.token.email || '',
      globalRoles: userData.globalRoles || [],
      scopedRoles: userData.roles || {},
    }

    const newToken = jwt.sign(claims, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      issuer: 'fl-camp-app',
      audience: 'fl-camp-app',
    })

    return {
      customToken: newToken,
      claims,
      expiresIn: JWT_EXPIRY,
    }
  } catch (error: any) {
    console.error('Token refresh error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to refresh token',
      error.message,
    )
  }
})

/**
 * HTTPS Callable Function: Verify custom JWT token
 * Used by backend to validate tokens in API requests
 *
 * @param token - Custom JWT to verify
 * @returns Decoded claims if valid
 */
export const verifyCustomToken = functions.https.onCall(
  async (data, context) => {
    const { token } = data

    if (!token) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Token is required',
      )
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'fl-camp-app',
        audience: 'fl-camp-app',
      }) as CustomClaims

      return {
        valid: true,
        claims: decoded,
      }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'Token has expired',
        )
      }
      if (error.name === 'JsonWebTokenError') {
        throw new functions.https.HttpsError('unauthenticated', 'Invalid token')
      }
      throw new functions.https.HttpsError(
        'internal',
        'Token verification failed',
      )
    }
  },
)

/**
 * Firestore Trigger: Auto-create user document on first auth
 *
 * When a user signs up via Firebase Auth, create their user profile
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    await db.collection('users').doc(user.uid).set({
      id: user.uid,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: '',
      lastName: '',
      globalRoles: [], // No global roles by default
      roles: {}, // No scoped roles by default
      campIds: [],
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    console.log(`Created user profile for ${user.uid}`)
  } catch (error) {
    console.error('Error creating user profile:', error)
  }
})

/**
 * HTTPS Callable Function: Admin endpoint to grant roles
 * Only callable by super_admin users
 */
export const grantRole = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be authenticated',
    )
  }

  // Verify caller is super_admin
  const callerDoc = await db.collection('users').doc(context.auth.uid).get()
  const callerData = callerDoc.data()

  if (!callerData?.globalRoles?.includes('super_admin')) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only super_admin can grant roles',
    )
  }

  const { userId, campId, role, isGlobal } = data

  if (!userId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'userId and role are required',
    )
  }

  try {
    const userRef = db.collection('users').doc(userId)

    if (isGlobal) {
      // Grant global role
      await userRef.update({
        globalRoles: admin.firestore.FieldValue.arrayUnion(role),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } else {
      // Grant scoped role for specific camp
      if (!campId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'campId required for scoped roles',
        )
      }

      await userRef.update({
        [`roles.${campId}`]: role,
        campIds: admin.firestore.FieldValue.arrayUnion(campId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    // Audit log
    await db.collection('auditLogs').add({
      type: 'role_granted',
      adminId: context.auth.uid,
      userId,
      campId: campId || null,
      role,
      isGlobal: isGlobal || false,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error granting role:', error)
    throw new functions.https.HttpsError('internal', 'Failed to grant role')
  }
})

/**
 * HTTPS Callable Function: Public self-service registration
 *
 * Handles camp participant registration with validation, duplicate checks, and payment integration
 *
 * @param campSlug - URL-friendly camp identifier
 * @param formData - Participant personal info and grouping values
 * @param recaptchaToken - Optional reCAPTCHA v3 token for bot prevention
 * @returns Registration result with participant ID and payment link
 */
interface RegisterParticipantData {
  campSlug: string
  formData: {
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
  recaptchaToken?: string
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

export const registerParticipant = functions.https.onCall(
  async (
    data: RegisterParticipantData,
    context,
  ): Promise<RegisterParticipantResult> => {
    try {
      const { campSlug, formData, recaptchaToken } = data

      // Validate required fields
      if (!campSlug || !formData) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'campSlug and formData are required',
        )
      }

      if (!formData.firstName || !formData.lastName || !formData.phone) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'firstName, lastName, and phone are required',
        )
      }

      // Optional: Verify reCAPTCHA token
      if (RECAPTCHA_SECRET && recaptchaToken) {
        const recaptchaValid = await verifyRecaptcha(recaptchaToken)
        if (!recaptchaValid) {
          return { success: false, error: 'invalid_recaptcha' }
        }
      }

      // 1. Fetch camp by slug
      const campsSnapshot = await db
        .collection('camps')
        .where('slug', '==', campSlug)
        .limit(1)
        .get()

      if (campsSnapshot.empty) {
        return {
          success: false,
          error: 'camp_not_found',
          message: 'Camp not found. Please check the link and try again.',
        }
      }

      const campDoc = campsSnapshot.docs[0]
      const camp = { id: campDoc.id, ...campDoc.data() } as any

      // 2. Validate camp is open for registration
      if (!camp.registrationOpen || !camp.selfServiceEnabled) {
        return {
          success: false,
          error: 'registration_closed',
          message: 'Registration is currently closed for this camp.',
        }
      }

      // Check self-service deadline
      if (
        camp.selfServiceDeadline &&
        camp.selfServiceDeadline.toDate() < new Date()
      ) {
        return {
          success: false,
          error: 'deadline_passed',
          message: 'Registration deadline has passed for this camp.',
        }
      }

      // 3. Check for duplicate phone number
      const duplicateQuery = await db
        .collection('participants')
        .where('campId', '==', camp.id)
        .where('personalInfo.phone', '==', formData.phone)
        .limit(1)
        .get()

      if (!duplicateQuery.empty) {
        return {
          success: false,
          error: 'duplicate_phone',
          message: 'This phone number is already registered for this camp.',
        }
      }

      // 4. Check max participants limit
      if (camp.maxParticipants) {
        const participantsSnapshot = await db
          .collection('participants')
          .where('campId', '==', camp.id)
          .get()

        if (participantsSnapshot.size >= camp.maxParticipants) {
          return {
            success: false,
            error: 'max_reached',
            message: 'This camp is full. Registration is closed.',
          }
        }
      }

      // 5. Create participant document
      const now = new Date()

      // Build emergency contact (only if at least one field has content)
      const hasEmergencyContact =
        (formData.emergencyContact?.name?.trim() || '') !== '' ||
        (formData.emergencyContact?.phone?.trim() || '') !== '' ||
        (formData.emergencyContact?.relationship?.trim() || '') !== ''

      const participant: any = {
        campId: camp.id,
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          gender: formData.gender,
          ...(formData.email && { email: formData.email }),
          ...(hasEmergencyContact && {
            emergencyContact: {
              name: formData.emergencyContact?.name || '',
              phone: formData.emergencyContact?.phone || '',
              relationship: formData.emergencyContact?.relationship || '',
            },
          }),
        },
        groupingValues: formData.groupingValues || {},
        states: {
          registration: { state: 'draft', timestamp: now },
          payment: { state: 'pending', timestamp: now },
          room: { state: 'unassigned', timestamp: now },
          checkIn: { state: 'pending', timestamp: now },
        },
        paymentDetails: {
          status: 'pending',
          amount: camp.totalCost || 0,
          currency: camp.currency || 'NGN',
          processor: camp.paymentProcessor || 'custom',
          auditHistory: [],
        },
        registeredAt: now,
        createdAt: now,
        updatedAt: now,
      }

      const participantRef = await db
        .collection('participants')
        .add(participant)

      // Update the document with its own ID
      await participantRef.update({ id: participantRef.id })

      // 6. Generate payment link (Paystack integration stub)
      let paymentLink: string | undefined

      if (
        camp.paymentOptions?.defaultMode === 'aggregator' &&
        camp.paymentOptions?.methods?.paystack &&
        PAYSTACK_SECRET_KEY
      ) {
        try {
          paymentLink = await initializePaystackPayment({
            email: formData.email || `${formData.phone}@placeholder.com`,
            amount: (camp.totalCost || 0) * 100, // Paystack uses kobo (NGN * 100)
            reference: `${camp.id}_${participantRef.id}_${Date.now()}`,
            currency: camp.currency || 'NGN',
            metadata: {
              campId: camp.id,
              campName: camp.name,
              participantId: participantRef.id,
              participantName: `${formData.firstName} ${formData.lastName}`,
              phone: formData.phone,
            },
          })
        } catch (paymentError) {
          console.error('Error initializing Paystack payment:', paymentError)
          // Continue without payment link - participant is created
        }
      }

      // 7. Audit log
      await db.collection('auditLogs').add({
        type: 'participant_registered',
        campId: camp.id,
        participantId: participantRef.id,
        method: 'self_service',
        timestamp: now,
      })

      return {
        success: true,
        participantId: participantRef.id,
        campId: camp.id,
        message: 'Registration successful!',
        paymentLink,
      }
    } catch (error: any) {
      console.error('Error in registerParticipant:', error)
      return {
        success: false,
        error: 'internal_error',
        message: 'An unexpected error occurred. Please try again.',
      }
    }
  },
)

/**
 * Helper: Verify reCAPTCHA v3 token
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET) return true // Skip if not configured

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
      },
    )

    const data = await response.json()
    return data.success && data.score >= 0.5 // Threshold for v3
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error)
    return false
  }
}

/**
 * Helper: Initialize Paystack payment (stub)
 * In production, use paystack-node SDK or direct API calls
 */
async function initializePaystackPayment(params: {
  email: string
  amount: number
  reference: string
  currency: string
  metadata: Record<string, any>
}): Promise<string> {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key not configured')
  }

  try {
    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
    )

    const data = await response.json()

    if (data.status && data.data?.authorization_url) {
      return data.data.authorization_url
    } else {
      throw new Error(data.message || 'Failed to initialize payment')
    }
  } catch (error) {
    console.error('Paystack initialization error:', error)
    throw error
  }
}
