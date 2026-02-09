import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '@/auth/authService'
import { useAuthStore } from '@/store'

/**
 * Login form component
 */
export function LoginForm() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const tokens = await signIn({ email, password })
      // Store tokens (in real app, would store in secure location)
      localStorage.setItem('idToken', tokens.idToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)

      // Redirect to camps page
      navigate('/camps')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow'>
      <h2 className='text-2xl font-bold mb-6 text-gray-800'>Sign In</h2>

      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Email
          </label>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
            disabled={loading}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Password
          </label>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none'
            disabled={loading}
          />
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition'
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className='mt-4 text-center text-sm text-gray-600'>
        Don't have an account?{' '}
        <a href='/signup' className='text-blue-600 hover:underline'>
          Sign up
        </a>
      </p>
    </div>
  )
}
