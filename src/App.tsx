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
import CampsPage from '@/features/camps/CampsPage'
import CampCreatePage from '@/features/camps/CampCreatePage'
import { CampDetail } from '@/features/camps/CampDetail'
import DashboardPage from '@/features/dashboard/DashboardPage'
import AttendeeRegistrationPage from '@/features/attendee/RegistrationPage'

/**
 * Login page (public)
 */
function LoginPage() {
  const { user } = useAuth()

  // If already logged in, redirect to camps
  if (user) {
    return <Navigate to='/admin/camps' replace />
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

        {/* Protected routes - Camp Management */}
        <Route
          path='/admin/camps'
          element={
            <ProtectedRoute>
              <CampsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/camps/new'
          element={
            <ProtectedRoute>
              <CampCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin/camps/:campId'
          element={
            <ProtectedRoute>
              <CampDetail />
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

        {/* Catch-all: redirect to admin camps or login */}
        <Route path='/' element={<Navigate to='/admin/camps' replace />} />
        <Route path='*' element={<Navigate to='/admin/camps' replace />} />
      </Routes>
    </Router>
  )
}
