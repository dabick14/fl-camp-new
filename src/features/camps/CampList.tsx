/**
 * CampList component - displays camps in a table/card view
 */
import { useNavigate } from 'react-router-dom'
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
import { Calendar, MapPin, Users, DollarSign } from 'lucide-react'

interface CampListProps {
  camps: Camp[]
  loading?: boolean
}

export function CampList({ camps, loading }: CampListProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='bg-gray-100 rounded-lg h-64 animate-pulse' />
        ))}
      </div>
    )
  }

  if (camps.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-gray-500 text-center py-8'>
            No camps found. Create your first camp to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
      {camps.map((camp) => {
        const startDate = camp.dates.start
        const endDate = camp.dates.end
        const isOpen = camp.registrationOpen

        return (
          <Card
            key={camp.id}
            className='hover:shadow-lg transition-shadow cursor-pointer'
            onClick={() => navigate(`/admin/camps/${camp.id}`)}
          >
            <CardHeader>
              <div className='flex items-start justify-between'>
                <CardTitle className='line-clamp-2 flex-1'>
                  {camp.name}
                </CardTitle>
                <Badge variant={isOpen ? 'default' : 'secondary'}>
                  {isOpen ? 'Open' : 'Closed'}
                </Badge>
              </div>
              <CardDescription className='flex items-center gap-1 mt-2'>
                <Calendar className='h-4 w-4' />
                {startDate.toLocaleDateString()} -{' '}
                {endDate.toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {camp.description && (
                <p className='text-sm text-gray-600 mb-4 line-clamp-2'>
                  {camp.description}
                </p>
              )}

              <div className='space-y-2 mb-4'>
                {camp.location && (
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <MapPin className='h-4 w-4' />
                    <span className='line-clamp-1'>{camp.location}</span>
                  </div>
                )}

                {camp.maxParticipants && (
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Users className='h-4 w-4' />
                    <span>Max {camp.maxParticipants} participants</span>
                  </div>
                )}

                {camp.totalCost && (
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <DollarSign className='h-4 w-4' />
                    <span>
                      {camp.currency} {camp.totalCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/admin/camps/${camp.id}`)
                }}
                className='w-full'
                size='sm'
              >
                Manage Camp
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
