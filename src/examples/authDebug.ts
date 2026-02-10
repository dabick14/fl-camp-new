/**
 * Authentication Debugging Helper
 * Run this in browser DevTools console to debug auth issues
 */

// Copy and paste this in your browser DevTools console after signing in

window.authDebug = {
  // Check local storage
  checkStorage: () => {
    console.log('📦 LocalStorage Contents:')
    const token = localStorage.getItem('fl_camp_custom_token')
    const claims = localStorage.getItem('fl_camp_token_claims')
    const expiry = localStorage.getItem('fl_camp_token_expiry')

    console.log('Token exists:', !!token)
    if (token) {
      console.log('Token (first 30 chars):', token.substring(0, 30) + '...')
    }

    console.log('\nClaims:', claims ? JSON.parse(claims) : 'NOT FOUND')

    if (expiry) {
      const expiryTime = new Date(parseInt(expiry))
      const now = new Date()
      const remaining = Math.round((expiryTime - now) / 1000 / 60)
      console.log('Expiry:', expiryTime.toLocaleString())
      console.log('Minutes remaining:', remaining)
    } else {
      console.log('Expiry: NOT FOUND')
    }
  },

  // Decode JWT
  decodeToken: (token) => {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        console.error('Invalid token format')
        return null
      }

      const decoded = JSON.parse(atob(parts[1]))
      console.log('📋 Decoded Token:')
      console.log(decoded)
      return decoded
    } catch (e) {
      console.error('Failed to decode token:', e)
      return null
    }
  },

  // Check Firebase Auth user
  checkFirebaseUser: async () => {
    try {
      const { getAuth } =
        await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js')
      const auth = getAuth()
      console.log('🔐 Firebase Auth User:')
      console.log(auth.currentUser)
      return auth.currentUser
    } catch (e) {
      console.error('Failed to check Firebase user:', e)
    }
  },

  // Test Firestore access
  checkFirestore: async () => {
    try {
      const { getFirestore, collection, getDocs } =
        await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js')
      const db = getFirestore()

      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(usersRef)

      console.log('📁 Firestore Users:')
      const users = []
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() })
      })
      console.table(users)
      return users
    } catch (e) {
      console.error('Failed to check Firestore:', e)
    }
  },

  // Test Cloud Function call
  testTokenExchange: async () => {
    try {
      const { getFunctions, httpsCallable } =
        await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-functions.js')
      const functions = getFunctions()

      const exchange = httpsCallable(functions, 'exchangeToken')
      const result = await exchange()

      console.log('✨ Token Exchange Result:')
      console.log(result.data)
      return result.data
    } catch (e) {
      console.error('Token exchange failed:', e)
    }
  },

  // Full diagnostic
  fullDiagnostic: async () => {
    console.log('='.repeat(50))
    console.log('🔍 FULL AUTHENTICATION DIAGNOSTIC')
    console.log('='.repeat(50))

    console.log('\n1. Checking LocalStorage...')
    window.authDebug.checkStorage()

    console.log('\n2. Checking Firebase Auth User...')
    const firebaseUser = await window.authDebug.checkFirebaseUser()

    console.log('\n3. Decoding stored token...')
    const token = localStorage.getItem('fl_camp_custom_token')
    if (token) {
      const decoded = window.authDebug.decodeToken(token)

      if (decoded) {
        console.log('\n4. Checking claims...')
        console.log('- UID:', decoded.uid)
        console.log('- Email:', decoded.email)
        console.log('- Global Roles:', decoded.globalRoles)
        console.log('- Scoped Roles:', decoded.scopedRoles)
        console.log(
          '- Valid:',
          decoded.exp * 1000 > Date.now() ? 'YES' : 'EXPIRED',
        )
      }
    }

    console.log('\n5. Checking Firestore access...')
    const users = await window.authDebug.checkFirestore()

    console.log('\n' + '='.repeat(50))
    console.log('✅ Diagnostic complete!')
    console.log('='.repeat(50))
  },

  // Quick health check
  healthCheck: () => {
    console.clear()
    const token = localStorage.getItem('fl_camp_custom_token')
    const claims = localStorage.getItem('fl_camp_token_claims')

    if (!token || !claims) {
      console.error('❌ Missing token or claims in localStorage')
      return false
    }

    try {
      const claimsObj = JSON.parse(claims)
      const expiryStr = localStorage.getItem('fl_camp_token_expiry')
      const expiry = parseInt(expiryStr || '0')
      const now = Date.now()

      console.log('✅ Authentication Status: HEALTHY')
      console.log(`📧 User: ${claimsObj.email}`)
      console.log(`🆔 UID: ${claimsObj.uid}`)
      console.log(
        `⚙️  Global Roles: ${claimsObj.globalRoles.join(', ') || 'none'}`,
      )
      console.log(
        `📋 Camp Roles: ${Object.keys(claimsObj.scopedRoles).length} camps`,
      )

      if (expiry && expiry > now) {
        const remaining = Math.round((expiry - now) / 1000 / 60)
        console.log(`⏱️  Token expires in: ${remaining} minutes`)
      } else {
        console.warn('⚠️  Token expired!')
      }

      return true
    } catch (e) {
      console.error('❌ Failed to parse claims:', e)
      return false
    }
  },
}

// Run quick health check
console.log('📡 Authentication Debug Helper Loaded')
console.log('Available commands:')
console.log('  - authDebug.healthCheck()        // Quick status check')
console.log('  - authDebug.checkStorage()       // View localStorage')
console.log('  - authDebug.decodeToken(token)   // Decode JWT')
console.log('  - authDebug.checkFirebaseUser()  // Check Firebase Auth user')
console.log('  - authDebug.checkFirestore()     // Query Firestore users')
console.log('  - authDebug.testTokenExchange()  // Test token exchange')
console.log('  - authDebug.fullDiagnostic()     // Run full diagnostic')
console.log('')
console.log('Quick start: authDebug.healthCheck()')

// Auto-run health check
window.authDebug.healthCheck()
