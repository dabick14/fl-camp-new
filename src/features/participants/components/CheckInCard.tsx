/**
 * Check-in status card
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { CampParticipant } from '@/models/index'

interface CheckInCardProps {
  participant: CampParticipant
}

export function CheckInCard({ participant }: CheckInCardProps) {
  const { checkIn, states } = participant
  const isCheckedIn = states.checkIn.state === 'checked_in' && checkIn

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='text-base'>Check-in Status</span>
          <Badge variant={isCheckedIn ? 'default' : 'secondary'}>
            {isCheckedIn ? 'Checked In' : 'Pending'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCheckedIn ? (
          <div className='space-y-3'>
            <div className='flex items-center space-x-2 text-green-600'>
              <CheckCircle className='w-5 h-5' />
              <span className='font-medium'>Participant has checked in</span>
            </div>

            {checkIn.ts && (
              <div>
                <label className='text-sm text-gray-600'>Time</label>
                <p className='text-sm font-medium'>
                  {format(checkIn.ts, 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            )}

            {checkIn.actorUid && (
              <div>
                <label className='text-sm text-gray-600'>Checked in by</label>
                <p className='text-sm font-mono'>{checkIn.actorUid}</p>
              </div>
            )}
          </div>
        ) : (
          <div className='text-center py-4'>
            <Clock className='w-10 h-10 mx-auto text-gray-300 mb-2' />
            <p className='text-sm text-gray-600'>Not checked in yet</p>
            {states.room.state !== 'assigned' && (
              <p className='text-xs text-gray-500 mt-1'>
                Room must be assigned before check-in
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
