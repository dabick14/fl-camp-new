import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Protected route wrapper that requires authentication
 * Redirects to /login if user is not authenticated
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  return <>{children}</>
}

interface CampAccessRouteProps {
  children: ReactNode
  campId?: string
  requiredRole?: string
}

/**
 * Route that checks camp-scoped access and role-based permissions
 */
export function CampAccessRoute({ children, campId }: CampAccessRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  // TODO: Implement role checking against Firebase custom claims
  // For now, just ensure authenticated
  if (!campId) {
    return <Navigate to='/admin/camps' replace />
  }

  return <>{children}</>
}
