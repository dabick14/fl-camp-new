/**
 * Participant list and state machine actions
 */
export default function ParticipantListPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6'>Participants</h1>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='bg-gray-100 border-b'>
            <th className='text-left p-4'>Name</th>
            <th className='text-left p-4'>Email</th>
            <th className='text-left p-4'>State</th>
            <th className='text-left p-4'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Participant rows will be rendered here */}
          <tr className='border-b hover:bg-gray-50'>
            <td colSpan={4} className='text-center p-4 text-gray-500'>
              No participants found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
