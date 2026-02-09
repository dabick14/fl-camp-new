/**
 * Dashboard page - admin command center for camp management
 */
export default function DashboardPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6'>Dashboard</h1>
      <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
        {/* Stats cards will be rendered here */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-gray-500 text-sm font-semibold'>Participants</h3>
          <p className='text-3xl font-bold text-gray-900 mt-2'>0</p>
        </div>
      </div>
    </div>
  )
}
