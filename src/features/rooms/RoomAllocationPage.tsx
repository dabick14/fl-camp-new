/**
 * Room allocation and auto-assignment screen
 */
export default function RoomAllocationPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6'>Room Allocation</h1>
      <div className='grid gap-6 grid-cols-1 lg:grid-cols-3'>
        {/* Room cards with assignment controls */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>Room 1</h3>
          <p className='text-gray-600 text-sm'>Capacity: 4</p>
          <p className='text-gray-600 text-sm'>Occupancy: 0</p>
        </div>
      </div>
    </div>
  )
}
