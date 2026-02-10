/**
 * CampsPage - main page for viewing and managing camps
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getCampsForUser } from '@/services/campService'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { CampList } from './CampList'
import type { Camp } from '@/models/index'
import { Plus } from 'lucide-react'

export default function CampsPage() {
  const { user, isSuperAdmin, claims } = useAuth()
  const navigate = useNavigate()
  const [camps, setCamps] = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCamps = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const scopedRoles = claims?.scopedRoles || {}
        const campsData = await getCampsForUser(
          user.uid,
          isSuperAdmin,
          scopedRoles,
        )
        setCamps(campsData)
      } catch (err: any) {
        console.error('Failed to fetch camps:', err)
        setError(err.message || 'Failed to load camps')
      } finally {
        setLoading(false)
      }
    }

    fetchCamps()
  }, [user, isSuperAdmin, claims])

  if (error) {
    return (
      <>
        <AppHeader />
        <div className='p-6'>
          <div className='bg-red-50 border border-red-200 rounded p-4 text-red-700'>
            Error: {error}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <div className='p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Camp Management</h1>
            <p className='text-gray-600 mt-1'>Create and manage your camps</p>
          </div>
          <Button onClick={() => navigate('/admin/camps/new')}>
            <Plus className='mr-2 h-4 w-4' />
            Create Camp
          </Button>
        </div>

        <CampList camps={camps} loading={loading} />
      </div>
    </>
  )
}
