/**
 * CampCreatePage - page for creating new camps
 */
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { createCamp } from '@/services/campService'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { CampCreateForm } from './CampCreateForm'
import type { Camp } from '@/models/index'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function CampCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (campData: Omit<Camp, 'id'>) => {
    try {
      const campId = await createCamp(campData)
      toast.success('Camp created successfully!')
      navigate(`/admin/camps/${campId}`)
    } catch (error: any) {
      console.error('Failed to create camp:', error)
      toast.error(error.message || 'Failed to create camp')
    }
  }

  if (!user) {
    return null
  }

  return (
    <>
      <AppHeader />
      <div className='p-6 max-w-4xl mx-auto'>
        <Button
          variant='ghost'
          onClick={() => navigate('/admin/camps')}
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Camps
        </Button>

        <div className='mb-6'>
          <h1 className='text-3xl font-bold'>Create New Camp</h1>
          <p className='text-gray-600 mt-1'>
            Set up a new camp with all the details
          </p>
        </div>

        <CampCreateForm onSubmit={handleSubmit} userId={user.uid} />
      </div>
    </>
  )
}
