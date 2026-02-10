/**
 * Custom token service for handling JWT token exchange
 * Works with Cloud Functions to manage authorization claims
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { auth } from '@/firebase'

export interface CustomClaims {
  uid: string
  email: string
  globalRoles: string[]
  scopedRoles: Record<string, string> // campId -> role
  exp?: number
  iat?: number
}

export interface TokenExchangeResponse {
  customToken: string
  claims: CustomClaims
  expiresIn: string
}

// Token storage keys
const CUSTOM_TOKEN_KEY = 'fl_camp_custom_token'
const TOKEN_CLAIMS_KEY = 'fl_camp_token_claims'
const TOKEN_EXPIRY_KEY = 'fl_camp_token_expiry'

/**
 * Exchange Firebase ID token for custom JWT with claims
 */
export async function exchangeFirebaseToken(): Promise<TokenExchangeResponse> {
  try {
    const functions = getFunctions()
    
    // Connect to emulator in development
    if (window.location.hostname === 'localhost') {
      try {
        connectFunctionsEmulator(functions, 'localhost', 5001)
      } catch (e) {
        // Already connected, ignore
      }
    }
    
    const exchangeToken = httpsCallable<void, TokenExchangeResponse>(
      functions,
      'exchangeToken',
    )

    // Call Cloud Function to exchange token
    const result = await exchangeToken()
    const { customToken, claims, expiresIn } = result.data

    // Store token and claims
    storeToken(customToken, claims, expiresIn)

    return result.data
  } catch (error: any) {
    console.error('Token exchange error:', error)

    // Handle specific errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error('Not authenticated. Please sign in again.')
    }
    if (error.code === 'functions/not-found') {
      throw new Error('User profile not found. Please complete registration.')
    }

    throw new Error('Failed to exchange authentication token')
  }
}

/**
 * Refresh the custom JWT token
 */
export async function refreshCustomToken(): Promise<TokenExchangeResponse> {
  try {
    const functions = getFunctions()
    const refreshToken = httpsCallable<void, TokenExchangeResponse>(
      functions,
      'refreshToken',
    )

    const result = await refreshToken()
    const { customToken, claims, expiresIn } = result.data

    // Update stored token
    storeToken(customToken, claims, expiresIn)

    return result.data
  } catch (error: any) {
    console.error('Token refresh error:', error)

    if (error.code === 'functions/unauthenticated') {
      // Token refresh failed, need to re-authenticate
      clearStoredToken()
      throw new Error('Session expired. Please sign in again.')
    }

    throw new Error('Failed to refresh authentication token')
  }
}

/**
 * Store token and claims in localStorage
 */
function storeToken(
  token: string,
  claims: CustomClaims,
  expiresIn: string,
): void {
  try {
    localStorage.setItem(CUSTOM_TOKEN_KEY, token)
    localStorage.setItem(TOKEN_CLAIMS_KEY, JSON.stringify(claims))

    // Calculate expiry timestamp
    const expiryMs = parseExpiryToMs(expiresIn)
    const expiryTimestamp = Date.now() + expiryMs
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString())
  } catch (error) {
    console.error('Failed to store token:', error)
  }
}

/**
 * Get stored custom token
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(CUSTOM_TOKEN_KEY)
}

/**
 * Get stored token claims
 */
export function getStoredClaims(): CustomClaims | null {
  try {
    const claimsJson = localStorage.getItem(TOKEN_CLAIMS_KEY)
    return claimsJson ? JSON.parse(claimsJson) : null
  } catch (error) {
    console.error('Failed to parse stored claims:', error)
    return null
  }
}

/**
 * Check if stored token is expired
 */
export function isTokenExpired(): boolean {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiryStr) return true

  const expiryTimestamp = parseInt(expiryStr, 10)
  const now = Date.now()

  // Consider expired if less than 5 minutes remaining
  const bufferMs = 5 * 60 * 1000
  return now >= expiryTimestamp - bufferMs
}

/**
 * Clear stored token and claims
 */
export function clearStoredToken(): void {
  localStorage.removeItem(CUSTOM_TOKEN_KEY)
  localStorage.removeItem(TOKEN_CLAIMS_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

/**
 * Auto-refresh token if needed
 * Returns true if token is valid or was refreshed successfully
 */
export async function ensureValidToken(): Promise<boolean> {
  try {
    // Check if user is signed in with Firebase
    const user = auth.currentUser
    if (!user) {
      clearStoredToken()
      return false
    }

    // Check if we have a stored token
    const storedToken = getStoredToken()
    if (!storedToken) {
      // No token, need to exchange
      await exchangeFirebaseToken()
      return true
    }

    // Check if token is expired
    if (isTokenExpired()) {
      await refreshCustomToken()
      return true
    }

    return true
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

/**
 * Helper to parse expiry duration to milliseconds
 */
function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([dhms])$/)
  if (!match) return 7 * 24 * 60 * 60 * 1000 // Default 7 days

  const value = parseInt(match[1], 10)
  const unit = match[2]

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000
    case 'h':
      return value * 60 * 60 * 1000
    case 'm':
      return value * 60 * 1000
    case 's':
      return value * 1000
    default:
      return 7 * 24 * 60 * 60 * 1000
  }
}

/**
 * Verify custom token with backend
 * Used for critical operations that need server-side verification
 */
export async function verifyToken(token: string): Promise<CustomClaims | null> {
  try {
    const functions = getFunctions()
    const verifyCustomToken = httpsCallable<
      { token: string },
      { valid: boolean; claims: CustomClaims }
    >(functions, 'verifyCustomToken')

    const result = await verifyCustomToken({ token })
    return result.data.valid ? result.data.claims : null
  } catch (error: any) {
    console.error('Token verification error:', error)
    return null
  }
}
