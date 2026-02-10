/**
 * Example demonstrating authentication and authorization usage
 */

import { useAuth } from '@/hooks/useAuth'
import { RequireRole, RequireAuth, ShowForRole } from '@/components/RequireRole'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Example 1: Basic auth state
 */
export function UserProfile() {
  const { user, loading, error, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!user) return <div>Please sign in</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Email: {user.email}</p>
        <Button onClick={signOut}>Sign Out</Button>
      </CardContent>
    </Card>
  )
}

/**
 * Example 2: Super admin features
 */
export function AdminPanel() {
  const { isSuperAdmin } = useAuth()

  return (
    <RequireRole globalRole='super_admin'>
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Only super admins see this</p>
          {isSuperAdmin && <Button>Manage All Camps</Button>}
        </CardContent>
      </Card>
    </RequireRole>
  )
}

/**
 * Example 3: Camp-scoped permissions
 */
export function CampManagement({ campId }: { campId: string }) {
  const { getScopedRole, canAccessCamp } = useAuth()
  const role = getScopedRole(campId)

  if (!canAccessCamp(campId)) {
    return <div>You don't have access to this camp</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Camp Management
          {role && <Badge className='ml-2'>{role}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Only camp admins see this */}
        <ShowForRole scopedRole='admin' campId={campId}>
          <Button>Edit Camp</Button>
          <Button variant='destructive'>Delete Camp</Button>
        </ShowForRole>

        {/* Treasurers and admins see this */}
        <ShowForRole scopedRole='treasurer' campId={campId}>
          <Button>Manage Payments</Button>
        </ShowForRole>

        {/* Super admins see everything */}
        <ShowForRole globalRole='super_admin'>
          <Button>Super Admin Override</Button>
        </ShowForRole>
      </CardContent>
    </Card>
  )
}

/**
 * Example 4: Protected routes
 */
export function CampAdminRoute({ campId }: { campId: string }) {
  return (
    <RequireRole scopedRole='admin' campId={campId}>
      <div>
        <h1>Camp Admin Dashboard</h1>
        <p>This page requires camp admin role</p>
      </div>
    </RequireRole>
  )
}

/**
 * Example 5: Conditional rendering based on multiple roles
 */
export function PaymentPage({ campId }: { campId: string }) {
  const { isSuperAdmin, hasScopedRole } = useAuth()

  const canManagePayments =
    isSuperAdmin ||
    hasScopedRole(campId, 'admin') ||
    hasScopedRole(campId, 'treasurer')

  return (
    <RequireAuth>
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {canManagePayments ? (
            <div>
              <Button>Record Payment</Button>
              <Button>Export Report</Button>
            </div>
          ) : (
            <p>You don't have permission to manage payments</p>
          )}
        </CardContent>
      </Card>
    </RequireAuth>
  )
}

/**
 * Example 6: Using custom claims directly
 */
export function UserRolesDisplay() {
  const { claims, isSuperAdmin } = useAuth()

  if (!claims) return <div>No claims available</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Roles</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuperAdmin && (
          <Badge variant='destructive' className='mb-2'>
            Super Admin
          </Badge>
        )}

        <h3 className='font-semibold mt-4 mb-2'>Global Roles:</h3>
        <ul>
          {claims.globalRoles.map((role) => (
            <li key={role}>
              <Badge>{role}</Badge>
            </li>
          ))}
        </ul>

        <h3 className='font-semibold mt-4 mb-2'>Camp Roles:</h3>
        <ul>
          {Object.entries(claims.scopedRoles).map(([campId, role]) => (
            <li key={campId}>
              <Badge variant='outline'>{campId}</Badge>: {role}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/**
 * Example 7: Manual token refresh
 */
export function TokenManager() {
  const { refreshAuth, customToken, claims } = useAuth()

  const handleRefresh = async () => {
    try {
      await refreshAuth()
      alert('Token refreshed successfully')
    } catch (error) {
      alert('Failed to refresh token')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-sm text-muted-foreground mb-2'>
          Token: {customToken?.substring(0, 20)}...
        </p>
        <p className='text-sm text-muted-foreground mb-4'>
          Expires:{' '}
          {claims?.exp
            ? new Date(claims.exp * 1000).toLocaleString()
            : 'Unknown'}
        </p>
        <Button onClick={handleRefresh}>Refresh Token</Button>
      </CardContent>
    </Card>
  )
}
