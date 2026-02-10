/**
 * Personal information card
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, User, AlertCircle } from 'lucide-react'
import type { CampParticipant, Camp } from '@/models/index'

interface PersonalInfoCardProps {
  participant: CampParticipant
  camp: Camp | null
}

export function PersonalInfoCard({ participant, camp }: PersonalInfoCardProps) {
  const { personalInfo, groupingValues } = participant

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium text-gray-600'>
              Full Name
            </label>
            <p className='text-base'>
              {personalInfo.firstName} {personalInfo.lastName}
            </p>
          </div>

          <div>
            <label className='text-sm font-medium text-gray-600'>Gender</label>
            <p className='text-base capitalize'>{personalInfo.gender}</p>
          </div>

          {personalInfo.phone && (
            <div>
              <label className='text-sm font-medium text-gray-600 flex items-center'>
                <Phone className='w-4 h-4 mr-1' />
                Phone
              </label>
              <p className='text-base'>{personalInfo.phone}</p>
            </div>
          )}

          {personalInfo.email && (
            <div>
              <label className='text-sm font-medium text-gray-600 flex items-center'>
                <Mail className='w-4 h-4 mr-1' />
                Email
              </label>
              <p className='text-base'>{personalInfo.email}</p>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        {personalInfo.emergencyContact && (
          <div className='pt-4 border-t'>
            <h4 className='font-medium mb-2 flex items-center'>
              <AlertCircle className='w-4 h-4 mr-2 text-orange-500' />
              Emergency Contact
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {personalInfo.emergencyContact.name && (
                <div>
                  <label className='text-sm text-gray-600'>Name</label>
                  <p className='text-base'>
                    {personalInfo.emergencyContact.name}
                  </p>
                </div>
              )}
              {personalInfo.emergencyContact.phone && (
                <div>
                  <label className='text-sm text-gray-600'>Phone</label>
                  <p className='text-base'>
                    {personalInfo.emergencyContact.phone}
                  </p>
                </div>
              )}
              {personalInfo.emergencyContact.relationship && (
                <div>
                  <label className='text-sm text-gray-600'>Relationship</label>
                  <p className='text-base'>
                    {personalInfo.emergencyContact.relationship}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grouping Values */}
        {Object.keys(groupingValues).length > 0 && (
          <div className='pt-4 border-t'>
            <h4 className='font-medium mb-2'>Group Assignments</h4>
            <div className='flex flex-wrap gap-2'>
              {Object.entries(groupingValues).map(([key, value]) => (
                <Badge key={key} variant='outline'>
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
