/**
 * Public registration form for camp attendees
 */
import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Camp } from '@/models/index'
import type { RegistrationFormData } from '@/services/registration'

interface RegistrationFormProps {
  camp: Camp
  onSubmit: (data: RegistrationFormData) => Promise<void>
  loading?: boolean
}

export function RegistrationForm({
  camp,
  onSubmit,
  loading,
}: RegistrationFormProps) {
  const groupingDimensions = useMemo(
    () => [...camp.groupingDimensions].sort((a, b) => a.order - b.order),
    [camp.groupingDimensions],
  )

  const schema = useMemo(() => {
    const baseSchema = z.object({
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().min(1, 'Last name is required'),
      phone: z.string().min(7, 'Phone number is required'),
      gender: z.enum(['male', 'female', 'other']),
      emergencyContact: z
        .object({
          name: z.string().optional(),
          phone: z.string().optional(),
          relationship: z.string().optional(),
        })
        .optional(),
      groupingValues: z.record(z.string().min(1)).default({}),
    })

    return baseSchema.superRefine((data, ctx) => {
      groupingDimensions.forEach((dimension) => {
        if (!dimension.required) return
        const key = dimension.name
        if (!data.groupingValues?.[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['groupingValues', key],
            message: `${dimension.name} is required`,
          })
        }
      })
    })
  }, [groupingDimensions])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      gender: 'male',
      groupingValues: {},
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <Label htmlFor='firstName'>First Name</Label>
            <Input id='firstName' {...register('firstName')} />
            {errors.firstName && (
              <p className='text-sm text-red-600 mt-1'>
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='lastName'>Last Name</Label>
            <Input id='lastName' {...register('lastName')} />
            {errors.lastName && (
              <p className='text-sm text-red-600 mt-1'>
                {errors.lastName.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor='phone'>Phone</Label>
            <Input id='phone' {...register('phone')} />
            {errors.phone && (
              <p className='text-sm text-red-600 mt-1'>
                {errors.phone.message}
              </p>
            )}
          </div>
          <div>
            <Label>Gender</Label>
            <Controller
              control={control}
              name='gender'
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='male'>Male</SelectItem>
                    <SelectItem value='female'>Female</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {groupingDimensions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Camp Details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 md:grid-cols-2'>
            {groupingDimensions.map((dimension) => (
              <div key={dimension.name}>
                <Label>
                  {dimension.name}
                  {dimension.required && (
                    <span className='text-red-600'> *</span>
                  )}
                </Label>
                <Controller
                  control={control}
                  name={`groupingValues.${dimension.name}` as const}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${dimension.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {dimension.values.map((value) => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.groupingValues?.[dimension.name] && (
                  <p className='text-sm text-red-600 mt-1'>
                    {errors.groupingValues?.[dimension.name]?.message}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact (Optional)</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2'>
          <div>
            <Label htmlFor='emergencyName'>Name</Label>
            <Input id='emergencyName' {...register('emergencyContact.name')} />
          </div>
          <div>
            <Label htmlFor='emergencyPhone'>Phone</Label>
            <Input
              id='emergencyPhone'
              {...register('emergencyContact.phone')}
            />
          </div>
          <div className='md:col-span-2'>
            <Label htmlFor='emergencyRelationship'>Relationship</Label>
            <Input
              id='emergencyRelationship'
              {...register('emergencyContact.relationship')}
            />
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button type='submit' disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </div>
    </form>
  )
}
