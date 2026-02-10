/**
 * Sticky header showing participant name, state, and camp
 */
import { User, UserCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { CampParticipant, Camp } from '@/models/index'

interface ParticipantHeaderProps {
  participant: CampParticipant
  camp: Camp | null
  mainState: string
}

const stateConfig: Record<
  string,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  registered: { label: 'Registered', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  paid_unassigned: { label: 'Paid - No Room', variant: 'default' },
  room_assigned: { label: 'Room Assigned', variant: 'default' },
  checked_in: { label: 'Checked In', variant: 'default' },
  unknown: { label: 'Unknown', variant: 'secondary' },
}

export function ParticipantHeader({
  participant,
  camp,
  mainState,
}: ParticipantHeaderProps) {
  const fullName = `${participant.personalInfo.firstName} ${participant.personalInfo.lastName}`
  const gender = participant.personalInfo.gender
  const stateInfo = stateConfig[mainState] || stateConfig.unknown

  const GenderIcon = gender === 'male' ? User : UserCheck

  return (
    <div className='sticky top-0 z-10 bg-white border-b shadow-sm'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
              }`}
            >
              <GenderIcon
                className={`w-6 h-6 ${
                  gender === 'male' ? 'text-blue-600' : 'text-pink-600'
                }`}
              />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>{fullName}</h1>
              <p className='text-sm text-gray-600'>
                {camp?.name || 'Loading camp...'}
              </p>
            </div>
          </div>

          <Badge variant={stateInfo.variant} className='text-base px-4 py-2'>
            {stateInfo.label}
          </Badge>
        </div>
      </div>
    </div>
  )
}
