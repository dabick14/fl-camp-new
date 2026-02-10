/**
 * Payment status card with audit trail
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { CampParticipant, Camp } from '@/models/index'

interface PaymentCardProps {
  participant: CampParticipant
  camp: Camp | null
}

const statusIcons = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  failed: XCircle,
  refunded: XCircle,
}

const statusColors = {
  pending: 'text-yellow-600',
  processing: 'text-blue-600',
  completed: 'text-green-600',
  failed: 'text-red-600',
  refunded: 'text-gray-600',
}

export function PaymentCard({ participant, camp }: PaymentCardProps) {
  const { paymentDetails } = participant
  const StatusIcon = statusIcons[paymentDetails.status] || Clock

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span className='flex items-center'>
            <DollarSign className='w-5 h-5 mr-2' />
            Payment Status
          </span>
          <Badge
            variant={
              paymentDetails.status === 'completed' ? 'default' : 'secondary'
            }
          >
            {paymentDetails.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Payment Details */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div>
            <label className='text-sm font-medium text-gray-600'>Amount</label>
            <p className='text-lg font-semibold'>
              {paymentDetails.amount || camp?.totalCost || 0}{' '}
              {paymentDetails.currency || camp?.currency || 'NGN'}
            </p>
          </div>

          {paymentDetails.method && (
            <div>
              <label className='text-sm font-medium text-gray-600'>
                Method
              </label>
              <p className='text-base capitalize'>{paymentDetails.method}</p>
            </div>
          )}

          {paymentDetails.transactionId && (
            <div>
              <label className='text-sm font-medium text-gray-600'>
                Transaction ID
              </label>
              <p className='text-sm font-mono'>
                {paymentDetails.transactionId}
              </p>
            </div>
          )}

          {paymentDetails.paidAt && (
            <div>
              <label className='text-sm font-medium text-gray-600'>
                Paid At
              </label>
              <p className='text-sm'>
                {format(paymentDetails.paidAt, 'MMM d, yyyy HH:mm')}
              </p>
            </div>
          )}
        </div>

        {/* Audit History */}
        {paymentDetails.auditHistory &&
          paymentDetails.auditHistory.length > 0 && (
            <div className='pt-4 border-t'>
              <h4 className='font-medium mb-3'>Payment History</h4>
              <div className='space-y-2 max-h-48 overflow-y-auto'>
                {paymentDetails.auditHistory.map((entry, index) => (
                  <div
                    key={index}
                    className='flex items-start space-x-3 text-sm p-2 bg-gray-50 rounded'
                  >
                    <StatusIcon
                      className={`w-4 h-4 mt-0.5 ${statusColors[paymentDetails.status]}`}
                    />
                    <div className='flex-1'>
                      <p className='font-medium'>{entry.action}</p>
                      {entry.details && (
                        <p className='text-gray-600 text-xs'>
                          {entry.details.method &&
                            `Method: ${entry.details.method}`}
                          {entry.details.amount &&
                            ` • Amount: ${entry.details.amount}`}
                        </p>
                      )}
                      <p className='text-gray-500 text-xs'>
                        {format(entry.timestamp, 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Warning if payment pending */}
        {paymentDetails.status === 'pending' && (
          <div className='flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded'>
            <Clock className='w-5 h-5 text-yellow-600 mt-0.5' />
            <div>
              <p className='text-sm font-medium text-yellow-900'>
                Payment Pending
              </p>
              <p className='text-sm text-yellow-700'>
                Confirm payment to proceed with room assignment
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
