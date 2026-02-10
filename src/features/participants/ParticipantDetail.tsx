/**
 * Participant Detail Page - State-driven admin operations
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { ParticipantHeader } from './components/ParticipantHeader'
import { PersonalInfoCard } from './components/PersonalInfoCard'
import { PaymentCard } from './components/PaymentCard'
import { RoomCard } from './components/RoomCard'
import { CheckInCard } from './components/CheckInCard'
import { AssignRoomModal } from './modals/AssignRoomModal'
import {
  subscribeToParticipant,
  updatePayment,
  checkInParticipant,
  undoCheckIn,
} from '@/services/participantService'
import { getCamp } from '@/services/campService'
import type { CampParticipant, Camp } from '@/models/index'

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, claims } = useAuth()

  const [participant, setParticipant] = useState<CampParticipant | null>(null)
  const [camp, setCamp] = useState<Camp | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)

  // Check if user has admin access for this camp
  const canManage = () => {
    if (!participant || !claims) return false

    const isSuperAdmin = claims.globalRoles?.includes('super_admin')
    const hasAdminRole = claims.scopedRoles?.[participant.campId] === 'admin'
    const hasOrganizerRole =
      claims.scopedRoles?.[participant.campId] === 'organizer'

    return isSuperAdmin || hasAdminRole || hasOrganizerRole
  }

  // Subscribe to real-time participant updates
  useEffect(() => {
    if (!id) {
      navigate('/admin/participants')
      return
    }

    const unsubscribe = subscribeToParticipant(id, async (data) => {
      setParticipant(data)

      if (data?.campId) {
        try {
          const campData = await getCamp(data.campId)
          setCamp(campData)
        } catch (error) {
          console.error('Error fetching camp:', error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [id, navigate])

  // Get current main state for action button
  const getMainState = (): string => {
    if (!participant) return 'unknown'

    const { payment, room, checkIn } = participant.states

    if (checkIn.state === 'checked_in') return 'checked_in'
    if (room.state === 'assigned') return 'room_assigned'
    if (payment.state === 'paid' && room.state === 'unassigned')
      return 'paid_unassigned'
    if (payment.state === 'paid') return 'paid'
    if (participant.states.registration.state === 'draft') return 'draft'

    return 'registered'
  }

  // Get primary action based on state
  const getPrimaryAction = () => {
    if (!canManage()) return null

    const mainState = getMainState()

    switch (mainState) {
      case 'draft':
      case 'registered':
        return {
          label: 'Confirm Payment',
          onClick: handleConfirmPayment,
          variant: 'default' as const,
        }
      case 'paid':
      case 'paid_unassigned':
        return {
          label: 'Assign Room',
          onClick: () => setShowRoomModal(true),
          variant: 'default' as const,
        }
      case 'room_assigned':
        return {
          label: 'Check In',
          onClick: handleCheckIn,
          variant: 'default' as const,
        }
      case 'checked_in':
        return {
          label: 'Undo Check-in',
          onClick: handleUndoCheckIn,
          variant: 'outline' as const,
        }
      default:
        return null
    }
  }

  const handleConfirmPayment = async () => {
    if (!participant || !user) return

    // TODO: Open payment confirmation modal with amount input
    // For now, simple confirmation
    const amount = camp?.totalCost || 0

    if (!window.confirm(`Confirm payment of ${amount} ${camp?.currency}?`)) {
      return
    }

    setActionLoading(true)
    try {
      await updatePayment(participant.id, {
        amount,
        method: 'manual',
        actorUid: user.uid,
      })

      toast.success('Payment confirmed successfully')
    } catch (error: any) {
      console.error('Error confirming payment:', error)
      toast.error(error.message || 'Failed to confirm payment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!participant || !user) return

    if (!window.confirm('Check in this participant?')) return

    setActionLoading(true)
    try {
      await checkInParticipant(participant.id, user.uid)
      toast.success('Participant checked in successfully')
    } catch (error: any) {
      console.error('Error checking in:', error)
      toast.error(error.message || 'Failed to check in participant')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUndoCheckIn = async () => {
    if (!participant || !user) return

    if (!window.confirm('Undo check-in for this participant?')) return

    setActionLoading(true)
    try {
      await undoCheckIn(participant.id, user.uid)
      toast.success('Check-in undone successfully')
    } catch (error: any) {
      console.error('Error undoing check-in:', error)
      toast.error(error.message || 'Failed to undo check-in')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
      </div>
    )
  }

  if (!participant) {
    return (
      <div className='max-w-4xl mx-auto p-6'>
        <Card className='p-6 text-center'>
          <p className='text-gray-600'>Participant not found</p>
          <Button
            onClick={() => navigate('/admin/participants')}
            className='mt-4'
          >
            Back to Participants
          </Button>
        </Card>
      </div>
    )
  }

  if (!canManage()) {
    return (
      <div className='max-w-4xl mx-auto p-6'>
        <Card className='p-6 text-center'>
          <p className='text-red-600'>
            You don't have permission to view this participant
          </p>
          <Button onClick={() => navigate('/admin/camps')} className='mt-4'>
            Back to Camps
          </Button>
        </Card>
      </div>
    )
  }

  const primaryAction = getPrimaryAction()

  return (
    <div className='min-h-screen bg-gray-50 pb-20'>
      {/* Sticky Header */}
      <ParticipantHeader
        participant={participant}
        camp={camp}
        mainState={getMainState()}
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {/* Back Button */}
        <Button variant='ghost' onClick={() => navigate(-1)} className='mb-4'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back
        </Button>

        {/* Main Content - Two Column Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Main Info */}
          <div className='lg:col-span-2 space-y-6'>
            <PersonalInfoCard participant={participant} camp={camp} />
            <PaymentCard participant={participant} camp={camp} />
            <RoomCard participant={participant} />
          </div>

          {/* Right Column - Status & Actions */}
          <div className='space-y-6'>
            {primaryAction && (
              <Card className='p-6'>
                <h3 className='font-semibold mb-4'>Primary Action</h3>
                <Button
                  onClick={primaryAction.onClick}
                  variant={primaryAction.variant}
                  className='w-full'
                  size='lg'
                  disabled={actionLoading}
                >
                  {actionLoading && (
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  )}
                  {primaryAction.label}
                </Button>
              </Card>
            )}

            <CheckInCard participant={participant} />
          </div>
        </div>
      </div>

      {/* Assign Room Modal */}
      {showRoomModal && participant && (
        <AssignRoomModal
          participant={participant}
          onClose={() => setShowRoomModal(false)}
          onSuccess={() => {
            setShowRoomModal(false)
            toast.success('Room assigned successfully')
          }}
        />
      )}
    </div>
  )
}
