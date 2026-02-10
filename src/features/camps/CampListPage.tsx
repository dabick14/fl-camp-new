/**
 * Camp list page - shows all camps user has access to
 */
import { useState, useEffect } from 'react'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Camp } from '@/models/index'

export default function CampListPage() {
  const { user, canAccessCamp, getScopedRole, isSuperAdmin, claims } = useAuth()
  const navigate = useNavigate()
  const [camps, setCamps] = useState<Camp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const db = getFirestore()
        const campsRef = collection(db, 'camps')
        const snapshot = await getDocs(campsRef)

        const campsData: Camp[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          campsData.push({
            id: doc.id,
            ...data,
            dates: {
              start:
                data.dates?.start?.toDate?.() || new Date(data.dates?.start),
              end: data.dates?.end?.toDate?.() || new Date(data.dates?.end),
            },
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
          } as Camp)
        })

        setCamps(campsData)
        setLoading(false)
      } catch (err: any) {
        console.error('Failed to fetch camps:', err)
        setError(err.message || 'Failed to load camps')
        setLoading(false)
      }
    }

    if (user) {
      fetchCamps()
    }
  }, [user])

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className='p-6'>
          <h1 className='text-3xl font-bold mb-6'>Camps</h1>
          <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='bg-gray-100 rounded-lg h-64 animate-pulse'
              />
            ))}
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <AppHeader />
        <div className='p-6'>
          <h1 className='text-3xl font-bold mb-6'>Camps</h1>
          <div className='bg-red-50 border border-red-200 rounded p-4 text-red-700'>
            Error: {error}
          </div>
        </div>
      </>
    )
  }

  const accessibleCamps = camps.filter(
    (camp) => isSuperAdmin || canAccessCamp(camp.id),
  )
  return (
    <>
      <AppHeader />
      <div className='p-6'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold'>Camps</h1>
          <p className='text-gray-600 mt-1'>Manage and view your camps</p>
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800'>
            <p>
              <strong>Debug:</strong> isSuperAdmin=
              {isSuperAdmin ? 'true' : 'false'}, camps={camps.length},
              accessible={accessibleCamps.length}
            </p>
            <p>globalRoles: {claims?.globalRoles?.join(', ') || 'none'}</p>
          </div>
        )}

        {accessibleCamps.length === 0 ? (
          <Card>
            <CardContent className='pt-6'>
              <p className='text-gray-500 text-center py-8'>
                No camps available. Ask an administrator to assign you to a
                camp.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
            {accessibleCamps.map((camp) => {
              const role = getScopedRole(camp.id)
              const startDate = camp.dates.start
                ? new Date(camp.dates.start)
                : new Date()
              const endDate = camp.dates.end
                ? new Date(camp.dates.end)
                : new Date()

              return (
                <Card
                  key={camp.id}
                  className='hover:shadow-lg transition-shadow'
                >
                  <CardHeader>
                    <CardTitle className='line-clamp-2'>{camp.name}</CardTitle>
                    {role && <Badge>{role}</Badge>}
                    <CardDescription>
                      {startDate.toLocaleDateString()} -{' '}
                      {endDate.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {camp.description && (
                      <p className='text-sm text-gray-600 mb-4 line-clamp-3'>
                        {camp.description}
                      </p>
                    )}
                    <div className='space-y-2 mb-4'>
                      {camp.location && (
                        <p className='text-sm'>
                          <span className='font-semibold'>Location:</span>{' '}
                          {camp.location}
                        </p>
                      )}
                      {camp.totalCost && (
                        <p className='text-sm'>
                          <span className='font-semibold'>Cost:</span> $
                          {camp.totalCost}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => navigate(`/dashboard/${camp.id}`)}
                      className='w-full'
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
