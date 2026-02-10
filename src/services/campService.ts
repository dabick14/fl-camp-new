/**
 * Camp CRUD service
 */
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import type { Camp } from '@/models/index'

const db = getFirestore()

/**
 * Convert Firestore Timestamp to Date
 */
function convertTimestamps(data: any): any {
  if (!data) return data

  const result = { ...data }

  // Convert dates object
  if (result.dates) {
    result.dates = {
      start: result.dates.start?.toDate?.() || new Date(result.dates.start),
      end: result.dates.end?.toDate?.() || new Date(result.dates.end),
    }
  }

  // Convert other date fields
  if (result.createdAt) {
    result.createdAt =
      result.createdAt?.toDate?.() || new Date(result.createdAt)
  }
  if (result.updatedAt) {
    result.updatedAt =
      result.updatedAt?.toDate?.() || new Date(result.updatedAt)
  }
  if (result.selfServiceDeadline) {
    result.selfServiceDeadline =
      result.selfServiceDeadline?.toDate?.() ||
      new Date(result.selfServiceDeadline)
  }
  if (result.paymentDeadline) {
    result.paymentDeadline =
      result.paymentDeadline?.toDate?.() || new Date(result.paymentDeadline)
  }

  return result
}

/**
 * Convert Date to Firestore Timestamp for storage
 */
function prepareCampForFirestore(campData: any): any {
  const result = { ...campData }

  // Convert dates
  if (result.dates) {
    result.dates = {
      start:
        result.dates.start instanceof Date
          ? Timestamp.fromDate(result.dates.start)
          : result.dates.start,
      end:
        result.dates.end instanceof Date
          ? Timestamp.fromDate(result.dates.end)
          : result.dates.end,
    }
  }

  // Convert other date fields
  if (result.createdAt instanceof Date) {
    result.createdAt = Timestamp.fromDate(result.createdAt)
  }
  if (result.updatedAt instanceof Date) {
    result.updatedAt = Timestamp.fromDate(result.updatedAt)
  }
  if (result.selfServiceDeadline instanceof Date) {
    result.selfServiceDeadline = Timestamp.fromDate(result.selfServiceDeadline)
  }
  if (result.paymentDeadline instanceof Date) {
    result.paymentDeadline = Timestamp.fromDate(result.paymentDeadline)
  }

  return result
}

/**
 * Get all camps for a user (based on their roles)
 */
export async function getCampsForUser(
  userId: string,
  isSuperAdmin: boolean,
  scopedRoles: Record<string, string>,
): Promise<Camp[]> {
  try {
    const campsRef = collection(db, 'camps')

    // Super admin gets all camps
    if (isSuperAdmin) {
      const q = query(campsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      })) as Camp[]
    }

    // Regular users get camps they have access to
    const campIds = Object.keys(scopedRoles)
    if (campIds.length === 0) {
      return []
    }

    // Fetch all camps and filter by IDs (Firestore doesn't support 'in' with more than 10 items efficiently)
    const snapshot = await getDocs(campsRef)
    const camps = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...convertTimestamps(doc.data()),
      }))
      .filter((camp) => campIds.includes(camp.id)) as Camp[]

    return camps.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  } catch (error) {
    console.error('Error fetching camps:', error)
    throw error
  }
}

/**
 * Get a single camp by ID
 */
export async function getCamp(campId: string): Promise<Camp | null> {
  try {
    const campDoc = doc(db, 'camps', campId)
    const snapshot = await getDoc(campDoc)

    if (!snapshot.exists()) {
      return null
    }

    return {
      id: snapshot.id,
      ...convertTimestamps(snapshot.data()),
    } as Camp
  } catch (error) {
    console.error('Error fetching camp:', error)
    throw error
  }
}

/**
 * Create a new camp
 */
export async function createCamp(campData: Omit<Camp, 'id'>): Promise<string> {
  try {
    const now = new Date()
    const dataToSave = prepareCampForFirestore({
      ...campData,
      createdAt: now,
      updatedAt: now,
    })

    const campsRef = collection(db, 'camps')
    const docRef = await addDoc(campsRef, dataToSave)

    return docRef.id
  } catch (error) {
    console.error('Error creating camp:', error)
    throw error
  }
}

/**
 * Update an existing camp
 */
export async function updateCamp(
  campId: string,
  campData: Partial<Camp>,
): Promise<void> {
  try {
    const campDoc = doc(db, 'camps', campId)
    const dataToUpdate = prepareCampForFirestore({
      ...campData,
      updatedAt: new Date(),
    })

    await updateDoc(campDoc, dataToUpdate)
  } catch (error) {
    console.error('Error updating camp:', error)
    throw error
  }
}

/**
 * Delete a camp
 */
export async function deleteCamp(campId: string): Promise<void> {
  try {
    const campDoc = doc(db, 'camps', campId)
    await deleteDoc(campDoc)
  } catch (error) {
    console.error('Error deleting camp:', error)
    throw error
  }
}
