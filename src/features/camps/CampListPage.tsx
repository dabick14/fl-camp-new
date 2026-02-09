/**
 * Camp list page - shows all camps user has access to
 */
export default function CampListPage() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6'>Camps</h1>
      <div className='grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'>
        {/* Camp cards will be rendered here */}
        <div className='bg-white rounded-lg shadow p-6 text-center text-gray-500'>
          Loading camps...
        </div>
      </div>
    </div>
  )
}
