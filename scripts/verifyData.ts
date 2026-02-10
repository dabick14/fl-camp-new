/**
 * Quick script to verify seeded data in Firestore emulator
 */

import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  connectFirestoreEmulator,
  query,
  where,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'fl-camp-app',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
connectFirestoreEmulator(db, 'localhost', 8080)

async function verifyData() {
  console.log('🔍 Verifying seeded data...\n')

  try {
    // Check camps
    const campsSnapshot = await getDocs(collection(db, 'camps'))
    console.log(`✅ Found ${campsSnapshot.size} camps`)
    campsSnapshot.forEach((doc) => {
      const camp = doc.data()
      console.log(`   - ${camp.name} (${camp.slug})`)
    })

    // Check rooms
    const roomsSnapshot = await getDocs(collection(db, 'rooms'))
    console.log(`\n✅ Found ${roomsSnapshot.size} rooms`)
    const maleRooms = roomsSnapshot.docs.filter(
      (d) => d.data().gender === 'male',
    )
    const femaleRooms = roomsSnapshot.docs.filter(
      (d) => d.data().gender === 'female',
    )
    const mixedRooms = roomsSnapshot.docs.filter(
      (d) => d.data().gender === null,
    )
    console.log(`   - Male rooms: ${maleRooms.length}`)
    console.log(`   - Female rooms: ${femaleRooms.length}`)
    console.log(`   - Mixed rooms: ${mixedRooms.length}`)

    // Check participants by state
    const participantsSnapshot = await getDocs(collection(db, 'participants'))
    console.log(`\n✅ Found ${participantsSnapshot.size} participants`)

    const stateGroups: Record<string, number> = {}
    participantsSnapshot.forEach((doc) => {
      const p = doc.data()
      const state = p.states?.registration?.state || 'unknown'
      stateGroups[state] = (stateGroups[state] || 0) + 1
    })

    console.log('   State breakdown:')
    Object.entries(stateGroups)
      .sort(([, a], [, b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`   - ${state}: ${count}`)
      })

    // Check payment states
    const paymentStates: Record<string, number> = {}
    participantsSnapshot.forEach((doc) => {
      const p = doc.data()
      const state = p.paymentDetails?.status || 'unknown'
      paymentStates[state] = (paymentStates[state] || 0) + 1
    })

    console.log('\n   Payment status breakdown:')
    Object.entries(paymentStates)
      .sort(([, a], [, b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`   - ${state}: ${count}`)
      })

    // Check users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log(`\n✅ Found ${usersSnapshot.size} users`)
    usersSnapshot.forEach((doc) => {
      const user = doc.data()
      console.log(
        `   - ${user.email} (${Object.keys(user.roles || {}).length} roles)`,
      )
    })

    // Test a query
    console.log('\n🔎 Testing queries...')
    const summerCampParticipants = await getDocs(
      query(
        collection(db, 'participants'),
        where('campId', '==', 'camp-summer-2026'),
      ),
    )
    console.log(`✅ Summer camp participants: ${summerCampParticipants.size}`)

    const paidParticipants = await getDocs(
      query(
        collection(db, 'participants'),
        where('paymentDetails.status', '==', 'completed'),
      ),
    )
    console.log(`✅ Paid participants: ${paidParticipants.size}`)

    console.log('\n✨ All data verified successfully!')
    console.log('\n💡 View in Firestore UI: http://localhost:4000/firestore')
  } catch (error) {
    console.error('❌ Error verifying data:', error)
    process.exit(1)
  }
}

verifyData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
