/**
 * Dashboard page - admin command center for camp management
 */
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import type { CampParticipant } from '@/models/index'

export default function DashboardPage() {
  const { campId } = useParams<{ campId: string }>()
  const [participantCount, setParticipantCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParticipantCount = async () => {
      if (!campId) {
        setLoading(false)
        return
      }

      try {
        const db = getFirestore()
        const participantsRef = collection(db, 'participants')
        const q = query(participantsRef, where('campId', '==', campId))
        const snapshot = await getDocs(q)

        setParticipantCount(snapshot.size)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch participant count:', err)
        setLoading(false)
      }
    }

    fetchParticipantCount()
  }, [campId])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6'>Dashboard</h1>
      <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
        {/* Stats cards will be rendered here */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-gray-500 text-sm font-semibold'>Participants</h3>
          <p className='text-3xl font-bold text-gray-900 mt-2'>
            {loading ? '...' : participantCount}
          </p>
        </div>
      </div>
    </div>
  )
}
