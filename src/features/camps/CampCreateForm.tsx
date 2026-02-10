/**
 * CampCreateForm - form for creating/editing camps
 */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { Camp } from '@/models/index'
import { useState } from 'react'

// Zod schema for camp validation
const campSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  minAge: z.number().min(1).optional(),
  maxAge: z.number().min(1).optional(),
  registrationOpen: z.boolean(),
  selfServiceEnabled: z.boolean(),
  selfServiceDeadline: z.string().optional(),
  currency: z.string().min(1).default('USD'),
  totalCost: z.number().min(0).optional(),
  paymentRequired: z.boolean(),
  paymentDeadline: z.string().optional(),
  paymentProcessor: z.enum(['stripe', 'paypal', 'custom']).optional(),
  roomAssignmentType: z.enum(['pre_assigned', 'on_site', 'mixed']),
  imageUrl: z.string().url().optional().or(z.literal('')),
  organizerId: z.string(),
})

type CampFormData = z.infer<typeof campSchema>

interface CampCreateFormProps {
  onSubmit: (data: Omit<Camp, 'id'>) => Promise<void>
  initialData?: Camp
  userId: string
}

export function CampCreateForm({
  onSubmit,
  initialData,
  userId,
}: CampCreateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CampFormData>({
    resolver: zodResolver(campSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          slug: initialData.slug,
          description: initialData.description || '',
          startDate: initialData.dates.start.toISOString().split('T')[0],
          endDate: initialData.dates.end.toISOString().split('T')[0],
          location: initialData.location || '',
          maxParticipants: initialData.maxParticipants,
          minAge: initialData.minAge,
          maxAge: initialData.maxAge,
          registrationOpen: initialData.registrationOpen,
          selfServiceEnabled: initialData.selfServiceEnabled,
          selfServiceDeadline: initialData.selfServiceDeadline
            ? initialData.selfServiceDeadline.toISOString().split('T')[0]
            : '',
          currency: initialData.currency || 'USD',
          totalCost: initialData.totalCost,
          paymentRequired: initialData.paymentRequired,
          paymentDeadline: initialData.paymentDeadline
            ? initialData.paymentDeadline.toISOString().split('T')[0]
            : '',
          paymentProcessor: initialData.paymentProcessor,
          roomAssignmentType: initialData.roomAssignmentType,
          imageUrl: initialData.imageUrl || '',
          organizerId: initialData.organizerId,
        }
      : {
          name: '',
          slug: '',
          description: '',
          startDate: '',
          endDate: '',
          location: '',
          currency: 'USD',
          registrationOpen: true,
          selfServiceEnabled: false,
          paymentRequired: false,
          roomAssignmentType: 'on_site' as const,
          organizerId: userId,
        },
  })

  const paymentRequired = watch('paymentRequired')
  const selfServiceEnabled = watch('selfServiceEnabled')

  const handleFormSubmit = async (data: CampFormData) => {
    setIsSubmitting(true)
    try {
      const campData: Omit<Camp, 'id'> = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        dates: {
          start: new Date(data.startDate),
          end: new Date(data.endDate),
        },
        location: data.location,
        maxParticipants: data.maxParticipants,
        minAge: data.minAge,
        maxAge: data.maxAge,
        registrationOpen: data.registrationOpen,
        selfServiceEnabled: data.selfServiceEnabled,
        selfServiceDeadline: data.selfServiceDeadline
          ? new Date(data.selfServiceDeadline)
          : undefined,
        currency: data.currency,
        totalCost: data.totalCost,
        paymentRequired: data.paymentRequired,
        paymentDeadline: data.paymentDeadline
          ? new Date(data.paymentDeadline)
          : undefined,
        paymentProcessor: data.paymentProcessor,
        groupingDimensions: initialData?.groupingDimensions || [],
        roomAssignmentType: data.roomAssignmentType,
        imageUrl: data.imageUrl || undefined,
        organizerId: data.organizerId,
        staff: initialData?.staff || [
          { userId: data.organizerId, role: 'organizer' },
        ],
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      await onSubmit(campData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit as any)}
      className='space-y-6'
    >
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='name'>Camp Name *</Label>
            <Input
              id='name'
              {...register('name')}
              placeholder='Summer Leadership Camp 2026'
            />
            {errors.name && (
              <p className='text-sm text-red-600 mt-1'>{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor='slug'>URL Slug *</Label>
            <Input
              id='slug'
              {...register('slug')}
              placeholder='summer-leadership-2026'
            />
            {errors.slug && (
              <p className='text-sm text-red-600 mt-1'>{errors.slug.message}</p>
            )}
            <p className='text-sm text-gray-500 mt-1'>
              Used in registration links (lowercase, hyphens only)
            </p>
          </div>

          <div>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              {...register('description')}
              placeholder='A week-long leadership development program...'
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor='imageUrl'>Image URL</Label>
            <Input
              id='imageUrl'
              {...register('imageUrl')}
              placeholder='https://example.com/image.jpg'
            />
            {errors.imageUrl && (
              <p className='text-sm text-red-600 mt-1'>
                {errors.imageUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dates & Location */}
      <Card>
        <CardHeader>
          <CardTitle>Dates & Location</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='startDate'>Start Date *</Label>
              <Input id='startDate' type='date' {...register('startDate')} />
              {errors.startDate && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor='endDate'>End Date *</Label>
              <Input id='endDate' type='date' {...register('endDate')} />
              {errors.endDate && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor='location'>Location</Label>
            <Input
              id='location'
              {...register('location')}
              placeholder='Mountain View Retreat Center, Colorado'
            />
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Participant Settings</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='maxParticipants'>Max Participants</Label>
              <Input
                id='maxParticipants'
                type='number'
                {...register('maxParticipants', { valueAsNumber: true })}
                placeholder='100'
              />
            </div>

            <div>
              <Label htmlFor='minAge'>Min Age</Label>
              <Input
                id='minAge'
                type='number'
                {...register('minAge', { valueAsNumber: true })}
                placeholder='13'
              />
            </div>

            <div>
              <Label htmlFor='maxAge'>Max Age</Label>
              <Input
                id='maxAge'
                type='number'
                {...register('maxAge', { valueAsNumber: true })}
                placeholder='21'
              />
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Switch
              id='registrationOpen'
              checked={watch('registrationOpen')}
              onCheckedChange={(checked) =>
                setValue('registrationOpen', checked)
              }
            />
            <Label htmlFor='registrationOpen'>Registration Open</Label>
          </div>

          <div className='flex items-center space-x-2'>
            <Switch
              id='selfServiceEnabled'
              checked={watch('selfServiceEnabled')}
              onCheckedChange={(checked) =>
                setValue('selfServiceEnabled', checked)
              }
            />
            <Label htmlFor='selfServiceEnabled'>
              Enable Self-Service Registration
            </Label>
          </div>

          {selfServiceEnabled && (
            <div>
              <Label htmlFor='selfServiceDeadline'>Self-Service Deadline</Label>
              <Input
                id='selfServiceDeadline'
                type='date'
                {...register('selfServiceDeadline')}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Switch
              id='paymentRequired'
              checked={watch('paymentRequired')}
              onCheckedChange={(checked) =>
                setValue('paymentRequired', checked)
              }
            />
            <Label htmlFor='paymentRequired'>Payment Required</Label>
          </div>

          {paymentRequired && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='totalCost'>Total Cost</Label>
                  <Input
                    id='totalCost'
                    type='number'
                    step='0.01'
                    {...register('totalCost', { valueAsNumber: true })}
                    placeholder='499.99'
                  />
                </div>

                <div>
                  <Label htmlFor='currency'>Currency</Label>
                  <Input
                    id='currency'
                    {...register('currency')}
                    placeholder='USD'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='paymentDeadline'>Payment Deadline</Label>
                <Input
                  id='paymentDeadline'
                  type='date'
                  {...register('paymentDeadline')}
                />
              </div>

              <div>
                <Label htmlFor='paymentProcessor'>Payment Processor</Label>
                <Select
                  value={watch('paymentProcessor') || ''}
                  onValueChange={(value: any) =>
                    setValue('paymentProcessor', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select processor' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='stripe'>Stripe</SelectItem>
                    <SelectItem value='paypal'>PayPal</SelectItem>
                    <SelectItem value='custom'>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Room Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Room Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor='roomAssignmentType'>Assignment Type *</Label>
            <Select
              value={watch('roomAssignmentType')}
              onValueChange={(value: any) =>
                setValue('roomAssignmentType', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='pre_assigned'>Pre-assigned</SelectItem>
                <SelectItem value='on_site'>On-site</SelectItem>
                <SelectItem value='mixed'>Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className='flex gap-4'>
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : initialData
              ? 'Update Camp'
              : 'Create Camp'}
        </Button>
      </div>
    </form>
  )
}
