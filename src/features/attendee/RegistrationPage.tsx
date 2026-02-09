/**
 * Self-service registration page for attendees
 * Accessible via public slug-based link
 */
export default function AttendeeRegistrationPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
      <div className='max-w-2xl mx-auto bg-white rounded-lg shadow p-8'>
        <h1 className='text-3xl font-bold mb-4'>Camp Registration</h1>
        <p className='text-gray-600'>
          Self-service registration form will be rendered here based on camp
          slug.
        </p>
      </div>
    </div>
  )
}
