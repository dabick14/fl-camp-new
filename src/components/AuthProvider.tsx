import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { initializeAuthPersistence } from '@/auth/authService'

/**
 * App wrapper that initializes auth and manages global state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Initialize auth persistence on app load
    initializeAuthPersistence()
  }, [])

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
