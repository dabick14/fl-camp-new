import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    })
  } catch (e) {
    // Already connected or other error
  }

  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (e) {
    // Already connected or other error
  }

  try {
    connectFunctionsEmulator(functions, 'localhost', 5001)
  } catch (e) {
    // Already connected or other error
  }
}

export default app
