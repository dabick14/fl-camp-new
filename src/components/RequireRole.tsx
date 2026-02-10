/**
 * Role-based access control components
 * Protect routes and UI elements based on user roles
 */

import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export interface RequireRoleProps {
  /** Global role required (e.g., 'super_admin') */
  globalRole?: string
  /** Camp-scoped role required (e.g., 'admin', 'treasurer') */
  scopedRole?: string
  /** Camp ID for scoped role check */
  campId?: string
  /** Children to render if authorized */
  children: ReactNode
  /** Custom fallback component when not authorized */
  fallback?: ReactNode
  /** Redirect URL when not authorized (instead of showing fallback) */
  redirectTo?: string
}

/**
 * Require specific role to view content
 *
 * @example
 * // Require super admin
 * <RequireRole globalRole="super_admin">
 *   <AdminPanel />
 * </RequireRole>
 *
 * @example
 * // Require camp admin
 * <RequireRole scopedRole="admin" campId="camp-123">
 *   <CampSettings />
 * </RequireRole>
 */
export function RequireRole({
  globalRole,
  scopedRole,
  campId,
  children,
  fallback,
  redirectTo,
}: RequireRoleProps) {
  const {
    user,
    loading,
    isSuperAdmin,
    hasGlobalRole,
    hasScopedRole,
    getScopedRole,
  } = useAuth()

  // Loading state
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />
    }
    return <Navigate to='/login' replace />
  }

  // Check authorization
  let authorized = false

  if (globalRole) {
    // Check global role
    authorized = isSuperAdmin || hasGlobalRole(globalRole)
  } else if (scopedRole && campId) {
    // Check scoped role for specific camp
    authorized = isSuperAdmin || hasScopedRole(campId, scopedRole)
  } else {
    // No role specified, just require authentication
    authorized = true
  }

  // Authorized - render children
  if (authorized) {
    return <>{children}</>
  }

  // Not authorized - show fallback or redirect
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }

  if (fallback) {
    return <>{fallback}</>
  }

  // Default fallback
  return (
    <div className='container mx-auto px-4 py-8'>
      <Alert variant='destructive'>
        <AlertDescription>
          <div className='space-y-4'>
            <p className='font-semibold'>Access Denied</p>
            <p>
              You don't have permission to view this page.
              {globalRole && ` Required role: ${globalRole}`}
              {scopedRole &&
                campId &&
                ` Required role for this camp: ${scopedRole}`}
            </p>
            {campId && (
              <p className='text-sm text-muted-foreground'>
                Your role for this camp: {getScopedRole(campId) || 'None'}
              </p>
            )}
            <Button onClick={() => window.history.back()} variant='outline'>
              Go Back
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export interface RequireAuthProps {
  /** Children to render if authenticated */
  children: ReactNode
  /** Redirect URL when not authenticated */
  redirectTo?: string
}

/**
 * Require authentication (any logged-in user)
 *
 * @example
 * <RequireAuth>
 *   <Dashboard />
 * </RequireAuth>
 */
export function RequireAuth({
  children,
  redirectTo = '/login',
}: RequireAuthProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export interface ShowForRoleProps {
  /** Global role required */
  globalRole?: string
  /** Camp-scoped role required */
  scopedRole?: string
  /** Camp ID for scoped role check */
  campId?: string
  /** Children to render if authorized */
  children: ReactNode
  /** Fallback content when not authorized */
  fallback?: ReactNode
}

/**
 * Conditionally show content based on role (doesn't redirect)
 * Useful for hiding/showing UI elements
 *
 * @example
 * <ShowForRole scopedRole="admin" campId={campId}>
 *   <DeleteCampButton />
 * </ShowForRole>
 */
export function ShowForRole({
  globalRole,
  scopedRole,
  campId,
  children,
  fallback = null,
}: ShowForRoleProps) {
  const { isSuperAdmin, hasGlobalRole, hasScopedRole } = useAuth()

  let authorized = false

  if (globalRole) {
    authorized = isSuperAdmin || hasGlobalRole(globalRole)
  } else if (scopedRole && campId) {
    authorized = isSuperAdmin || hasScopedRole(campId, scopedRole)
  }

  return authorized ? <>{children}</> : <>{fallback}</>
}
