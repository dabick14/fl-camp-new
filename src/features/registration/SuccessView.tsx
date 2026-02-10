/**
 * Registration success view
 */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Camp } from '@/models/index'

interface SuccessViewProps {
  camp: Camp
  participantId: string
  paymentLink?: string
}

export function SuccessView({
  camp,
  participantId,
  paymentLink,
}: SuccessViewProps) {
  const showPayment = camp.paymentRequired

  const handlePayment = () => {
    if (paymentLink) {
      // Redirect to Paystack payment page
      window.location.href = paymentLink
    } else {
      window.alert('Payment flow coming soon. This is a placeholder.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Complete</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <p className='text-gray-700'>
          Thank you for registering. Your spot has been saved in draft status.
        </p>
        <p className='text-sm text-gray-600'>
          Your registration ID: <strong>{participantId}</strong>
        </p>

        {showPayment && (
          <div className='space-y-2'>
            <p className='text-sm text-gray-600'>
              Payment is required to confirm your registration.
            </p>
            <Button onClick={handlePayment}>
              {paymentLink ? 'Proceed to Payment' : 'Payment Coming Soon'}
            </Button>
          </div>
        )}

        {!showPayment && (
          <p className='text-sm text-gray-600'>
            No payment is required. You will receive further instructions soon.
          </p>
        )}

        <div className='border-t pt-4'>
          <p className='text-sm text-gray-600'>
            Next steps: save your registration ID and follow the camp updates. A
            status page and QR instructions will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
