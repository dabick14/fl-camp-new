/**
 * Room assignment card with warnings
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Home, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import type { CampParticipant } from '@/models/index'

interface RoomCardProps {
  participant: CampParticipant
}

export function RoomCard({ participant }: RoomCardProps) {
  const { room, states } = participant
  const isAssigned = states.room.state === 'assigned' && room

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center'>
            <Home className='w-5 h-5 mr-2' />
            Room Assignment
          </span>
          <Badge variant={isAssigned ? 'default' : 'secondary'}>
            {isAssigned ? 'Assigned' : 'Unassigned'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isAssigned ? (
          <>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-gray-600'>
                  Room ID
                </label>
                <p className='text-base font-mono'>{room.roomId}</p>
              </div>

              {room.assignedAt && (
                <div>
                  <label className='text-sm font-medium text-gray-600'>
                    Assigned At
                  </label>
                  <p className='text-sm'>
                    {format(room.assignedAt, 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}

              {room.tentative && (
                <div className='col-span-2'>
                  <Badge variant='outline' className='text-orange-600'>
                    Tentative Assignment
                  </Badge>
                </div>
              )}
            </div>

            {/* TODO: Add room details fetch and display capacity, occupancy */}
            {/* TODO: Add gender/type mismatch warning */}
          </>
        ) : (
          <div className='text-center py-6'>
            <Home className='w-12 h-12 mx-auto text-gray-300 mb-2' />
            <p className='text-gray-600'>No room assigned yet</p>
            {states.payment.state !== 'completed' && (
              <p className='text-sm text-gray-500 mt-1'>
                Payment must be confirmed before room assignment
              </p>
            )}
          </div>
        )}

        {/* Warning for unassigned after payment */}
        {!isAssigned && states.payment.state === 'completed' && (
          <div className='flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded'>
            <AlertTriangle className='w-5 h-5 text-orange-600 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-orange-900'>
                Action Required
              </p>
              <p className='text-sm text-orange-700'>
                Payment confirmed but no room assigned. Assign a room to
                proceed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
