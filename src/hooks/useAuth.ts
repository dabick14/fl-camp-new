import { useEffect, useState, useCallback } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { onAuthChanged, getCurrentUser } from '@/auth/authService'

export interface UseAuthReturn {
  user: FirebaseUser | null
  loading: boolean
  isAuthenticated: boolean
}

/**
 * Hook to subscribe to auth state changes
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChanged((authUser) => {
      setUser(authUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
  }
}

/**
 * Hook to get current user (without subscription)
 */
export function useCurrentUser(): FirebaseUser | null {
  return getCurrentUser()
}

/**
 * Hook to require authentication
 */
export function useRequireAuth(redirectTo?: string) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user && redirectTo) {
      window.location.href = redirectTo
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}
