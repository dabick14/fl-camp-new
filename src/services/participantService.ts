/**
 * Participant service for CRUD operations and state transitions
 */
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,

  runTransaction,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { CampParticipant } from '@/models/index'

/**
 * Get participant by ID with real-time updates
 */
export function subscribeToParticipant(
  participantId: string,
  callback: (participant: CampParticipant | null) => void,
): () => void {
  const participantRef = doc(db, 'participants', participantId)

  const unsubscribe = onSnapshot(
    participantRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null)
        return
      }

      const data = snapshot.data()
      const participant = convertTimestamps({
        id: snapshot.id,
        ...data,
      }) as CampParticipant

      callback(participant)
    },
    (error) => {
      console.error('Error subscribing to participant:', error)
      callback(null)
    },
  )

  return unsubscribe
}

/**
 * Get participant by ID (one-time fetch)
 */
export async function getParticipant(
  participantId: string,
): Promise<CampParticipant | null> {
  const participantRef = doc(db, 'participants', participantId)
  const snapshot = await getDoc(participantRef)

  if (!snapshot.exists()) {
    return null
  }

  return convertTimestamps({
    id: snapshot.id,
    ...snapshot.data(),
  }) as CampParticipant
}

/**
 * Update participant payment status (with audit trail)
 */
export async function updatePayment(
  participantId: string,
  data: {
    amount: number
    method: string
    transactionId?: string
    actorUid: string
  },
): Promise<void> {
  const participantRef = doc(db, 'participants', participantId)

  await runTransaction(db, async (transaction) => {
    const participantDoc = await transaction.get(participantRef)

    if (!participantDoc.exists()) {
      throw new Error('Participant not found')
    }

    const participant = participantDoc.data()
    const now = new Date()

    // Update payment details
    const auditEntry = {
      timestamp: now,
      actorUid: data.actorUid,
      action: 'payment_confirmed',
      details: {
        amount: data.amount,
        method: data.method,
        transactionId: data.transactionId,
      },
    }

    transaction.update(participantRef, {
      'paymentDetails.status': 'completed',
      'paymentDetails.amount': data.amount,
      'paymentDetails.method': data.method,
      'paymentDetails.transactionId': data.transactionId,
      'paymentDetails.paidAt': now,
      'paymentDetails.auditHistory': [
        ...(participant.paymentDetails?.auditHistory || []),
        auditEntry,
      ],
      'states.payment.state': 'completed',
      'states.payment.timestamp': now,
      updatedAt: now,
      updatedBy: data.actorUid,
    })
  })
}

/**
 * Assign room to participant (with transaction)
 */
export async function assignRoom(
  participantId: string,
  roomId: string,
  actorUid: string,
): Promise<void> {
  const participantRef = doc(db, 'participants', participantId)
  const roomRef = doc(db, 'rooms', roomId)

  await runTransaction(db, async (transaction) => {
    const participantDoc = await transaction.get(participantRef)
    const roomDoc = await transaction.get(roomRef)

    if (!participantDoc.exists()) {
      throw new Error('Participant not found')
    }

    if (!roomDoc.exists()) {
      throw new Error('Room not found')
    }

    const participant = participantDoc.data()
    const room = roomDoc.data()

    // Validate room has capacity
    const currentOccupancy = room.currentOccupancy || 0
    if (currentOccupancy >= room.capacity) {
      throw new Error('Room is at full capacity')
    }

    const now = new Date()

    // Update participant
    transaction.update(participantRef, {
      room: {
        roomId,
        tentative: false,
        assignedAt: now,
        assignedBy: actorUid,
      },
      'states.room.state': 'assigned',
      'states.room.timestamp': now,
      updatedAt: now,
      updatedBy: actorUid,
    })

    // Update room occupancy
    transaction.update(roomRef, {
      currentOccupancy: currentOccupancy + 1,
      updatedAt: now,
    })
  })
}

/**
 * Unassign room from participant
 */
export async function unassignRoom(
  participantId: string,
  actorUid: string,
): Promise<void> {
  const participantRef = doc(db, 'participants', participantId)

  await runTransaction(db, async (transaction) => {
    const participantDoc = await transaction.get(participantRef)

    if (!participantDoc.exists()) {
      throw new Error('Participant not found')
    }

    const participant = participantDoc.data()

    if (!participant.room?.roomId) {
      throw new Error('Participant has no room assignment')
    }

    const roomRef = doc(db, 'rooms', participant.room.roomId)
    const roomDoc = await transaction.get(roomRef)

    if (roomDoc.exists()) {
      const room = roomDoc.data()
      transaction.update(roomRef, {
        currentOccupancy: Math.max(0, (room.currentOccupancy || 1) - 1),
        updatedAt: new Date(),
      })
    }

    const now = new Date()

    transaction.update(participantRef, {
      room: null,
      'states.room.state': 'unassigned',
      'states.room.timestamp': now,
      updatedAt: now,
      updatedBy: actorUid,
    })
  })
}

/**
 * Check in participant
 */
export async function checkInParticipant(
  participantId: string,
  actorUid: string,
): Promise<void> {
  const participantRef = doc(db, 'participants', participantId)
  const now = new Date()

  await updateDoc(participantRef, {
    checkIn: {
      ts: now,
      actorUid,
    },
    'states.checkIn.state': 'completed',
    'states.checkIn.timestamp': now,
    updatedAt: now,
    updatedBy: actorUid,
  })
}

/**
 * Undo check-in
 */
export async function undoCheckIn(
  participantId: string,
  actorUid: string,
): Promise<void> {
  const participantRef = doc(db, 'participants', participantId)
  const now = new Date()

  await updateDoc(participantRef, {
    checkIn: null,
    'states.checkIn.state': 'pending',
    'states.checkIn.timestamp': now,
    updatedAt: now,
    updatedBy: actorUid,
  })
}

/**
 * Get available rooms for a camp (filtered by gender if needed)
 */
export async function getAvailableRooms(
  campId: string,
  gender?: string,
): Promise<any[]> {
  let q = query(collection(db, 'rooms'), where('campId', '==', campId))

  if (gender) {
    q = query(q, where('gender', '==', gender))
  }

  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((room: any) => (room.currentOccupancy || 0) < room.capacity)
}

/**
 * Convert Firestore Timestamps to Dates
 */
function convertTimestamps(data: any): any {
  if (!data) return data

  const converted: any = { ...data }

  // Convert common timestamp fields
  const timestampFields = [
    'createdAt',
    'updatedAt',
    'registeredAt',
    'checkIn.ts',
    'checkOut.ts',
    'room.assignedAt',
    'paymentDetails.paidAt',
  ]

  timestampFields.forEach((field) => {
    const keys = field.split('.')
    let current = converted
    let parent = null
    let lastKey = ''

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return
      parent = current
      current = current[keys[i]]
      lastKey = keys[i + 1]
    }

    const finalKey = keys[keys.length - 1]
    if (current && current[finalKey]?.toDate) {
      current[finalKey] = current[finalKey].toDate()
    }
  })

  // Convert state timestamps
  if (converted.states) {
    Object.keys(converted.states).forEach((stateKey) => {
      if (converted.states[stateKey]?.timestamp?.toDate) {
        converted.states[stateKey].timestamp =
          converted.states[stateKey].timestamp.toDate()
      }
    })
  }

  // Convert audit history timestamps
  if (converted.paymentDetails?.auditHistory) {
    converted.paymentDetails.auditHistory =
      converted.paymentDetails.auditHistory.map((entry: any) => ({
        ...entry,
        timestamp: entry.timestamp?.toDate
          ? entry.timestamp.toDate()
          : entry.timestamp,
      }))
  }

  return converted
}
