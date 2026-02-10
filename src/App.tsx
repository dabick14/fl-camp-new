import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LoginForm } from '@/components/LoginForm'

// Lazy load feature pages
import CampListPage from '@/features/camps/CampListPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import AttendeeRegistrationPage from '@/features/attendee/RegistrationPage'

/**
 * Login page (public)
 */
function LoginPage() {
  const { user } = useAuth()

  // If already logged in, redirect to camps
  if (user) {
    return <Navigate to='/camps' replace />
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <LoginForm />
    </div>
  )
}

/**
 * Main app with routing
 */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register/:slug' element={<AttendeeRegistrationPage />} />

        {/* Protected routes */}
        <Route
          path='/camps'
          element={
            <ProtectedRoute>
              <CampListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path='/dashboard/:campId'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect to camps or login */}
        <Route path='/' element={<Navigate to='/camps' replace />} />
        <Route path='*' element={<Navigate to='/camps' replace />} />
      </Routes>
    </Router>
  )
}
