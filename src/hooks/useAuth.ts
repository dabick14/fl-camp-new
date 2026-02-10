/**
 * Custom authentication hook with role-based access control
 * Provides user info, custom claims, and role checking utilities
 */

import { useState, useEffect, useCallback } from 'react'
import { User } from 'firebase/auth'
import { auth } from '@/firebase'
import {
  refreshCustomToken,
  getStoredClaims,
  getStoredToken,
  clearStoredToken,
  ensureValidToken,
  type CustomClaims,
} from '@/auth/customTokenService'

export interface AuthState {
  user: User | null
  customToken: string | null
  claims: CustomClaims | null
  loading: boolean
  error: string | null
}

export interface UseAuthReturn extends AuthState {
  isSuperAdmin: boolean
  hasGlobalRole: (role: string) => boolean
  getScopedRole: (campId: string) => string | null
  hasScopedRole: (campId: string, role: string) => boolean
  canAccessCamp: (campId: string) => boolean
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Hook for accessing authentication state and authorization utilities
 *
 * @example
 * const { user, isSuperAdmin, getScopedRole } = useAuth()
 *
 * if (isSuperAdmin) {
 *   // Show admin panel
 * }
 *
 * const role = getScopedRole('camp-123')
 * if (role === 'admin') {
 *   // Show camp admin features
 * }
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    customToken: null,
    claims: null,
    loading: true,
    error: null,
  })

  // Initialize auth state on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // User signed in - ensure we have valid custom token
          await ensureValidToken()

          const customToken = getStoredToken()
          const claims = getStoredClaims()

          setState({
            user,
            customToken,
            claims,
            loading: false,
            error: null,
          })
        } catch (error: any) {
          console.error('Auth initialization error:', error)
          setState({
            user,
            customToken: null,
            claims: null,
            loading: false,
            error: error.message || 'Failed to initialize authentication',
          })
        }
      } else {
        // User signed out
        clearStoredToken()
        setState({
          user: null,
          customToken: null,
          claims: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  // Refresh authentication (re-exchange token)
  const refreshAuth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const result = await refreshCustomToken()

      setState((prev) => ({
        ...prev,
        customToken: result.customToken,
        claims: result.claims,
        loading: false,
      }))
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to refresh authentication',
      }))
      throw error
    }
  }, [])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await auth.signOut()
      clearStoredToken()
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [])

  // Check if user is super admin
  const isSuperAdmin =
    state.claims?.globalRoles?.includes('super_admin') ?? false

  // Check if user has a specific global role
  const hasGlobalRole = useCallback(
    (role: string): boolean => {
      return state.claims?.globalRoles?.includes(role) ?? false
    },
    [state.claims],
  )

  // Get user's role for a specific camp
  const getScopedRole = useCallback(
    (campId: string): string | null => {
      return state.claims?.scopedRoles?.[campId] ?? null
    },
    [state.claims],
  )

  // Check if user has a specific role for a camp
  const hasScopedRole = useCallback(
    (campId: string, role: string): boolean => {
      const userRole = getScopedRole(campId)
      return userRole === role
    },
    [getScopedRole],
  )

  // Check if user can access a camp (has any role for it)
  const canAccessCamp = useCallback(
    (campId: string): boolean => {
      // Super admin can access all camps
      if (isSuperAdmin) return true

      // Check if user has any scoped role for this camp
      return getScopedRole(campId) !== null
    },
    [isSuperAdmin, getScopedRole],
  )

  return {
    ...state,
    isSuperAdmin,
    hasGlobalRole,
    getScopedRole,
    hasScopedRole,
    canAccessCamp,
    refreshAuth,
    signOut,
  }
}
