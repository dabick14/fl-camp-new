import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Query,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore'
import { db } from '@/firebase'
import {
  Camp,
  CampParticipant,
  Room,
  User,
  AuditLog,
  PaymentTransaction,
} from '@models/index'

/**
 * Firestore collection references with type safety
 */
export const campRef = collection(db, 'camps') as CollectionReference<Camp>
export const participantRef = collection(
  db,
  'camp_participants',
) as CollectionReference<CampParticipant>
export const roomRef = collection(db, 'rooms') as CollectionReference<Room>
export const userRef = collection(db, 'users') as CollectionReference<User>
export const auditLogRef = collection(
  db,
  'audit_logs',
) as CollectionReference<AuditLog>
export const paymentRef = collection(
  db,
  'payments',
) as CollectionReference<PaymentTransaction>

/**
 * Generic document getter
 */
export async function getDocument<T>(
  ref: DocumentReference<T>,
): Promise<T | null> {
  try {
    const snapshot = await getDoc(ref)
    return snapshot.exists() ? snapshot.data() : null
  } catch (error) {
    console.error('Error fetching document:', error)
    throw error
  }
}

/**
 * Generic query executor
 */
export async function executeQuery<T>(q: Query<T>): Promise<T[]> {
  try {
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => doc.data())
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

/**
 * Fetch a single camp by ID
 */
export async function getCamp(campId: string): Promise<Camp | null> {
  return getDocument(doc(campRef, campId))
}

/**
 * Fetch a camp by slug (for self-service registration)
 */
export async function getCampBySlug(slug: string): Promise<Camp | null> {
  const q = query(campRef, where('slug', '==', slug), limit(1))
  const camps = await executeQuery(q)
  return camps[0] || null
}

/**
 * Fetch all camps for a user (via their roles)
 */
export async function getUserCamps(userId: string): Promise<Camp[]> {
  const q = query(
    campRef,
    where('staff', 'array-contains', { userId }),
    orderBy('startDate', 'desc'),
  )
  return executeQuery(q)
}

/**
 * Fetch participants for a camp
 */
export async function getCampParticipants(
  campId: string,
): Promise<CampParticipant[]> {
  const q = query(
    participantRef,
    where('campId', '==', campId),
    orderBy('createdAt', 'desc'),
  )
  return executeQuery(q)
}

/**
 * Fetch participants by state
 */
export async function getParticipantsByState(
  campId: string,
  state: string,
): Promise<CampParticipant[]> {
  const q = query(
    participantRef,
    where('campId', '==', campId),
    where('state', '==', state),
    orderBy('createdAt', 'desc'),
  )
  return executeQuery(q)
}

/**
 * Fetch rooms for a camp
 */
export async function getCampRooms(campId: string): Promise<Room[]> {
  const q = query(
    roomRef,
    where('campId', '==', campId),
    orderBy('name', 'asc'),
  )
  return executeQuery(q)
}

/**
 * Fetch user profile
 */
export async function getUser(userId: string): Promise<User | null> {
  return getDocument(doc(userRef, userId))
}

/**
 * Fetch audit logs for an entity
 */
export async function getAuditLogs(
  campId: string,
  entityId?: string,
): Promise<AuditLog[]> {
  let q: Query<AuditLog>

  if (entityId) {
    q = query(
      auditLogRef,
      where('campId', '==', campId),
      where('entityId', '==', entityId),
      orderBy('timestamp', 'desc'),
      limit(50),
    )
  } else {
    q = query(
      auditLogRef,
      where('campId', '==', campId),
      orderBy('timestamp', 'desc'),
      limit(100),
    )
  }

  return executeQuery(q)
}
