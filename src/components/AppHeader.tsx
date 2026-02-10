/**
 * App header with user info and logout button
 */
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'

export function AppHeader() {
  const { user, signOut, isSuperAdmin, claims } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className='border-b bg-white sticky top-0 z-50'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <h1 className='text-2xl font-bold text-gray-900'>FL Camp</h1>
        </div>

        <div className='flex items-center gap-4'>
          {user && (
            <>
              <div className='text-right'>
                <p className='text-sm font-medium text-gray-900'>
                  {user.email}
                </p>
                {isSuperAdmin && (
                  <Badge variant='destructive' className='mt-1'>
                    Super Admin
                  </Badge>
                )}
                {claims?.scopedRoles &&
                  Object.keys(claims.scopedRoles).length > 0 && (
                    <p className='text-xs text-gray-500 mt-1'>
                      {Object.keys(claims.scopedRoles).length} camp role(s)
                    </p>
                  )}
              </div>
              <Button onClick={handleLogout} variant='outline' size='sm'>
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
