/**
 * Public self-service registration page
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { RegistrationForm } from './RegistrationForm'
import { SuccessView } from './SuccessView'
import { getCampBySlug, registerParticipant } from '@/services/registration'
import type { Camp } from '@/models/index'

export default function RegistrationPage() {
  const { slug } = useParams<{ slug: string }>()
  const [camp, setCamp] = useState<Camp | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
    participantId: string
    campId: string
    paymentLink?: string
  } | null>(null)

  useEffect(() => {
    const fetchCamp = async () => {
      if (!slug) {
        setError('Invalid registration link.')
        setLoading(false)
        return
      }

      try {
        const campData = await getCampBySlug(slug)
        if (!campData) {
          setError('Camp not found. Please check your link.')
        } else {
          setCamp(campData)
        }
      } catch (err: any) {
        console.error(err)
        setError('Failed to load camp details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCamp()
  }, [slug])

  const handleSubmit = async (formData: any) => {
    if (!slug) return
    setSubmitting(true)
    setError(null)

    try {
      const result = await registerParticipant(slug, formData)

      if (!result.success) {
        // Handle specific error codes with user-friendly messages
        const errorMessages: Record<string, string> = {
          camp_not_found: 'Camp not found. Please check your link.',
          camp_closed: 'This camp is no longer accepting registrations.',
          registration_closed:
            'Registration is currently closed for this camp.',
          deadline_passed: 'The registration deadline has passed.',
          duplicate_phone:
            'This phone number is already registered for this camp.',
          max_reached: 'This camp is full. Registration is closed.',
          invalid_recaptcha: 'Security verification failed. Please try again.',
          internal_error: 'An unexpected error occurred. Please try again.',
        }

        setError(
          errorMessages[result.error || 'internal_error'] ||
            result.message ||
            'Registration failed. Please try again.',
        )
        return
      }

      setSuccess({
        participantId: result.participantId!,
        campId: result.campId!,
        paymentLink: result.paymentLink,
      })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-2xl mx-auto'>
          <div className='h-48 bg-white rounded-lg shadow animate-pulse' />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardContent className='p-6 text-red-700'>{error}</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!camp) {
    return null
  }

  if (!camp.registrationOpen || !camp.selfServiceEnabled) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardContent className='p-6'>
              Registration is currently closed for this camp.
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (camp.selfServiceDeadline && camp.selfServiceDeadline < new Date()) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-2xl mx-auto'>
          <Card>
            <CardContent className='p-6'>
              Registration deadline has passed for this camp.
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-2xl mx-auto space-y-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h1 className='text-2xl font-bold'>{camp.name}</h1>
          <p className='text-gray-600 mt-1'>
            Please complete the form below to register.
          </p>
        </div>

        {success ? (
          <SuccessView
            camp={camp}
            participantId={success.participantId}
            paymentLink={success.paymentLink}
          />
        ) : (
          <RegistrationForm
            camp={camp}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        )}
      </div>
    </div>
  )
}
