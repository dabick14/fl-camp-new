import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  getIdTokenResult,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/firebase'
import apiClient from '@/services/apiClient'
import type { User } from '@models/index'

export interface AuthTokens {
  idToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpData extends AuthCredentials {
  firstName: string
  lastName: string
}

/**
 * Initialize auth persistence (LOCAL storage by default)
 */
export async function initializeAuthPersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence)
  } catch (error) {
    console.error('Failed to set auth persistence:', error)
  }
}

/**
 * Sign in with email and password
 * Exchanges Firebase ID token for backend JWT tokens
 */
export async function signIn(
  credentials: AuthCredentials,
): Promise<AuthTokens> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password,
    )

    const idToken = await userCredential.user.getIdToken()

    // TODO: Exchange Firebase token for JWT tokens from backend
    // For now, use Firebase token directly
    return {
      idToken,
      refreshToken: userCredential.user.refreshToken || '',
      expiresIn: 3600,
    }
  } catch (error) {
    console.error('Sign in failed:', error)
    throw error
  }
}

/**
 * Sign up new user
 */
export async function signUp(data: SignUpData): Promise<AuthTokens> {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password,
    )

    // Update profile with name
    await updateProfile(userCredential.user, {
      displayName: `${data.firstName} ${data.lastName}`,
    })

    const idToken = await userCredential.user.getIdToken()

    // TODO: Create user record in backend
    // For now, use Firebase token directly
    return {
      idToken,
      refreshToken: userCredential.user.refreshToken || '',
      expiresIn: 3600,
    }
  } catch (error) {
    console.error('Sign up failed:', error)
    throw error
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Sign out failed:', error)
    throw error
  }
}

/**
 * Get current user's ID token
 */
export async function getIdToken(): Promise<string | null> {
  try {
    return (await auth.currentUser?.getIdToken()) || null
  } catch (error) {
    console.error('Failed to get ID token:', error)
    return null
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get user's role claims from custom token
 */
export async function getUserRoles(): Promise<Record<string, string>> {
  try {
    const idTokenResult = await getIdTokenResult(auth.currentUser!)
    return idTokenResult.claims.roles || {}
  } catch (error) {
    console.error('Failed to get user roles:', error)
    return {}
  }
}

/**
 * Check if user has a specific role in a camp
 */
export async function hasRole(
  campId: string,
  requiredRole: string,
): Promise<boolean> {
  try {
    const roles = await getUserRoles()
    const campRole = roles[`role_${campId}`]

    // Simple hierarchy: admin > organizer > staff
    const hierarchy: Record<string, number> = {
      admin: 3,
      organizer: 2,
      staff: 1,
    }

    return (hierarchy[campRole] || 0) >= (hierarchy[requiredRole] || 0)
  } catch (error) {
    console.error('Failed to check role:', error)
    return false
  }
}
