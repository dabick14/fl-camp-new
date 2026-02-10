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
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found. Please complete registration.',
      )
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

    // Fetch latest user data
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found')
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
