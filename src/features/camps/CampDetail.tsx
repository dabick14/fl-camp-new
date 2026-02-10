/**
 * CampDetail - shows camp configuration and management options
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCamp } from '@/services/campService'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Camp } from '@/models/index'
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Settings,
  ArrowLeft,
} from 'lucide-react'

export function CampDetail() {
  const { campId } = useParams<{ campId: string }>()
  const navigate = useNavigate()
  const [camp, setCamp] = useState<Camp | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCamp = async () => {
      if (!campId) {
        setError('No camp ID provided')
        setLoading(false)
        return
      }

      try {
        const campData = await getCamp(campId)
        if (!campData) {
          setError('Camp not found')
        } else {
          setCamp(campData)
        }
      } catch (err: any) {
        console.error('Error fetching camp:', err)
        setError(err.message || 'Failed to load camp')
      } finally {
        setLoading(false)
      }
    }

    fetchCamp()
  }, [campId])

  if (loading) {
    return (
      <>
        <AppHeader />
        <div className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 bg-gray-200 rounded w-1/3'></div>
            <div className='h-64 bg-gray-200 rounded'></div>
          </div>
        </div>
      </>
    )
  }

  if (error || !camp) {
    return (
      <>
        <AppHeader />
        <div className='p-6'>
          <div className='bg-red-50 border border-red-200 rounded p-4 text-red-700'>
            {error || 'Camp not found'}
          </div>
          <Button onClick={() => navigate('/admin/camps')} className='mt-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Camps
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader />
      <div className='p-6 max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <Button
            variant='ghost'
            onClick={() => navigate('/admin/camps')}
            className='mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Camps
          </Button>

          <div className='flex items-start justify-between'>
            <div>
              <h1 className='text-3xl font-bold'>{camp.name}</h1>
              <p className='text-gray-600 mt-1'>{camp.slug}</p>
            </div>
            <Badge variant={camp.registrationOpen ? 'default' : 'secondary'}>
              {camp.registrationOpen
                ? 'Registration Open'
                : 'Registration Closed'}
            </Badge>
          </div>
        </div>

        {/* Overview */}
        <div className='grid gap-6 md:grid-cols-2 mb-6'>
          <Card>
            <CardHeader>
              <CardTitle>Camp Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {camp.description && (
                <p className='text-gray-700'>{camp.description}</p>
              )}

              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <Calendar className='h-4 w-4 text-gray-500' />
                  <span>
                    {camp.dates.start.toLocaleDateString()} -{' '}
                    {camp.dates.end.toLocaleDateString()}
                  </span>
                </div>

                {camp.location && (
                  <div className='flex items-center gap-2 text-sm'>
                    <MapPin className='h-4 w-4 text-gray-500' />
                    <span>{camp.location}</span>
                  </div>
                )}

                {camp.maxParticipants && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Users className='h-4 w-4 text-gray-500' />
                    <span>Max {camp.maxParticipants} participants</span>
                  </div>
                )}

                {camp.totalCost && (
                  <div className='flex items-center gap-2 text-sm'>
                    <DollarSign className='h-4 w-4 text-gray-500' />
                    <span>
                      {camp.currency} {camp.totalCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>
                  Self-Service Registration
                </span>
                <Badge
                  variant={camp.selfServiceEnabled ? 'default' : 'secondary'}
                >
                  {camp.selfServiceEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Payment Required</span>
                <Badge variant={camp.paymentRequired ? 'default' : 'secondary'}>
                  {camp.paymentRequired ? 'Yes' : 'No'}
                </Badge>
              </div>

              {camp.paymentProcessor && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>
                    Payment Processor
                  </span>
                  <span className='text-sm font-medium capitalize'>
                    {camp.paymentProcessor}
                  </span>
                </div>
              )}

              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Room Assignment</span>
                <span className='text-sm font-medium capitalize'>
                  {camp.roomAssignmentType.replace('_', ' ')}
                </span>
              </div>

              {camp.minAge && camp.maxAge && (
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-gray-600'>Age Range</span>
                  <span className='text-sm font-medium'>
                    {camp.minAge} - {camp.maxAge} years
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grouping Dimensions */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Grouping Dimensions</CardTitle>
            <CardDescription>
              Used to organize and categorize participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {camp.groupingDimensions.length > 0 ? (
              <div className='space-y-4'>
                {camp.groupingDimensions.map((dimension, index) => (
                  <div key={index} className='border-l-4 border-blue-500 pl-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <h4 className='font-semibold'>{dimension.name}</h4>
                      {dimension.required && (
                        <Badge variant='secondary' className='text-xs'>
                          Required
                        </Badge>
                      )}
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {dimension.values.map((value, vIndex) => (
                        <Badge key={vIndex} variant='outline'>
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-gray-500'>
                No grouping dimensions configured
              </p>
            )}
          </CardContent>
        </Card>

        {/* Rooms Stub */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Room Management</CardTitle>
            <CardDescription>
              Configure and assign rooms for participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-gray-500 mb-4'>
              Room management interface coming soon...
            </p>
            <Button variant='outline' disabled>
              <Settings className='mr-2 h-4 w-4' />
              Manage Rooms
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className='flex gap-4'>
          <Button onClick={() => navigate(`/dashboard/${camp.id}`)}>
            View Dashboard
          </Button>
          <Button variant='outline' disabled>
            Edit Camp
          </Button>
          <Button variant='outline' disabled>
            View Participants
          </Button>
        </div>
      </div>
    </>
  )
}
