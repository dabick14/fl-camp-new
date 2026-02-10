/**
 * Modal for assigning rooms to participants
 */
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Home, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { getAvailableRooms, assignRoom } from '@/services/participantService'
import type { CampParticipant } from '@/models/index'

interface AssignRoomModalProps {
  participant: CampParticipant
  onClose: () => void
  onSuccess: () => void
}

export function AssignRoomModal({
  participant,
  onClose,
  onSuccess,
}: AssignRoomModalProps) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const availableRooms = await getAvailableRooms(
          participant.campId,
          participant.personalInfo.gender,
        )
        setRooms(availableRooms)
      } catch (error) {
        console.error('Error fetching rooms:', error)
        toast.error('Failed to load available rooms')
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [participant.campId, participant.personalInfo.gender])

  const handleAssign = async () => {
    if (!selectedRoom || !user) return

    setSubmitting(true)
    try {
      await assignRoom(participant.id, selectedRoom, user.uid)
      onSuccess()
    } catch (error: any) {
      console.error('Error assigning room:', error)
      toast.error(error.message || 'Failed to assign room')
      setSubmitting(false)
    }
  }

  const getAvailableSpace = (room: any) => {
    return room.capacity - (room.currentOccupancy || 0)
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h2 className='text-xl font-bold'>Assign Room</h2>
            <p className='text-sm text-gray-600 mt-1'>
              {participant.personalInfo.firstName}{' '}
              {participant.personalInfo.lastName} •{' '}
              <span className='capitalize'>
                {participant.personalInfo.gender}
              </span>
            </p>
          </div>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X className='w-5 h-5' />
          </Button>
        </div>

        {/* Room List */}
        <div className='flex-1 overflow-y-auto p-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
            </div>
          ) : rooms.length === 0 ? (
            <div className='text-center py-12'>
              <Home className='w-12 h-12 mx-auto text-gray-300 mb-3' />
              <p className='text-gray-600'>No available rooms found</p>
              <p className='text-sm text-gray-500 mt-1'>
                All rooms for this gender may be at capacity
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {rooms.map((room) => {
                const availableSpace = getAvailableSpace(room)
                const isSelected = selectedRoom === room.id

                return (
                  <Card
                    key={room.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRoom(room.id)}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3'>
                          <Home className='w-5 h-5 text-gray-400' />
                          <div>
                            <h3 className='font-semibold'>
                              {room.name || `Room ${room.id}`}
                            </h3>
                            <div className='flex items-center space-x-2 mt-1'>
                              <Badge variant='outline' className='text-xs'>
                                <Users className='w-3 h-3 mr-1' />
                                {room.currentOccupancy || 0} / {room.capacity}
                              </Badge>
                              <Badge
                                variant='secondary'
                                className='text-xs capitalize'
                              >
                                {room.gender}
                              </Badge>
                              {room.type && (
                                <Badge variant='outline' className='text-xs'>
                                  {room.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {room.floor && (
                          <p className='text-sm text-gray-500 mt-2'>
                            Floor: {room.floor}
                          </p>
                        )}

                        {room.notes && (
                          <p className='text-sm text-gray-600 mt-2'>
                            {room.notes}
                          </p>
                        )}
                      </div>

                      <div className='text-right'>
                        <p className='text-sm font-medium text-gray-600'>
                          {availableSpace} available
                        </p>
                        {isSelected && (
                          <Badge variant='default' className='mt-1'>
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end space-x-3 p-6 border-t bg-gray-50'>
          <Button variant='outline' onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedRoom || submitting}>
            {submitting && <Loader2 className='w-4 h-4 mr-2 animate-spin' />}
            Assign Room
          </Button>
        </div>
      </div>
    </div>
  )
}
