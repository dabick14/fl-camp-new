/\*\*

- ARCHITECTURE & PATTERNS GUIDE
- Camp Management System – Firebase + React
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 1.  FIREBASE INITIALIZATION & CONFIGURATION
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/firebase.ts
-
- Features:
- - Modular SDK imports (Auth, Firestore, Functions)
- - Environment-based config from .env.local
- - Emulator support in development
- - Single point of truth for all Firebase services
-
- Usage:
- import { auth, db, functions } from '@/firebase'
- import { signInWithEmailAndPassword } from 'firebase/auth'
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 2.  AUTHENTICATION FLOW
- ═══════════════════════════════════════════════════════════════════════════
-
- Files:
- - src/auth/authService.ts – Core auth logic
- - src/hooks/useAuth.ts – React hooks for auth state
- - src/components/ProtectedRoute.tsx – Route protection
-
- Flow:
- 1.  User enters email/password
- 2.  Firebase Auth validates → returns Firebase user + idToken
- 3.  idToken sent to backend (/auth/signin)
- 4.  Backend verifies with Firebase Admin SDK
- 5.  Backend issues JWT tokens (access + refresh)
- 6.  Frontend stores in localStorage/sessionStorage
- 7.  API client injects JWT into Authorization header
-
- Token Lifecycle:
- - Firebase idToken: short-lived (1 hour), refreshed automatically
- - JWT access token: short-lived (15 min), issued by backend
- - JWT refresh token: long-lived (7 days), stored securely
-
- Authorization:
- - Role claims stored in Firebase custom token
- - Format: { role\_<campId>: 'admin|organizer|staff' }
- - Retrieved via getIdTokenResult(user)
- - useAuth() hook provides user + isAuthenticated
-
- Usage:
- // In components
- const { user, loading, isAuthenticated } = useAuth()
- if (loading) return <LoadingSpinner />
- if (!isAuthenticated) return <Navigate to="/login" />
-
- // Protected routes
- <ProtectedRoute>
-     <DashboardPage />
- </ProtectedRoute>
  */

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 3.  TYPE SAFETY & MODELS
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/models/index.ts
-
- Core Entities:
- - Camp: Camp configuration, metadata, staff list
- - CampParticipant: Participant with state machine + room assignment
- - Room: Room capacity, gender rules, overbooking config
- - User: Global user identity + multi-camp roles
- - AuditLog: All state/payment/assignment changes
- - PaymentTransaction: Payment processor records
-
- State Machine:
- draft → registered → payment_pending → paid → room_assigned → checked_in
- - cancellation/no-show paths
-
- Design Pattern:
- - All types exported from single source (models/index.ts)
- - Dates stored as Date objects (Firebase converts to Timestamp)
- - Nested objects flattened where needed (e.g., dimensionValues)
-
- Usage:
- import type { Camp, CampParticipant, User } from '@models/index'
-
- const camp: Camp = {
-     id: 'camp-123',
-     name: 'Summer Camp 2024',
-     ...
- }
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 4.  FIRESTORE QUERIES & SERVICE LAYER
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/services/firestore.ts
-
- Design:
- - Type-safe collection references
- - Generic query executor with error handling
- - Specific getter functions for common queries
- - Single responsibility per function
-
- Patterns:
-
- // Fetch single document
- const camp = await getCamp('camp-123')
-
- // Query by field
- const camps = await getCampBySlug('summer-2024')
- const participants = await getParticipantsByState('camp-123', 'paid')
-
- // Custom queries
- const q = query(
-     participantRef,
-     where('campId', '==', campId),
-     where('gender', '==', 'female'),
-     orderBy('registeredAt', 'desc')
- )
- const females = await executeQuery(q)
-
- Firestore Rules:
- - Rules must enforce camp-scoped access
- - Only staff/organizers can view their camp
- - Participants can view their own records
    \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 5.  API CLIENT & BACKEND INTEGRATION
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/services/apiClient.ts
-
- Features:
- - Axios instance with custom interceptors
- - Auto-inject Firebase idToken to every request
- - 401 handling (token expired, re-authenticate)
- - Configurable timeout (default 10s)
- - Base URL from environment
-
- Interceptors:
- Request: Fetch fresh idToken → add to Authorization header
- Response: Handle 401 (auth failure), 5xx (server errors)
-
- Usage:
- import apiClient from '@/services/apiClient'
-
- const response = await apiClient.post('/auth/signin', { idToken })
- const data = await apiClient.get('/camps')
-
- Backend Endpoints:
- POST /auth/signin
- POST /auth/signup
- POST /auth/refresh
- POST /auth/verify
- POST /webhooks/payment
- POST /webhooks/room-assignment
- GET /camps
- GET /camps/:id
- etc.
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 6.  STATE MANAGEMENT WITH ZUSTAND
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/store/index.ts
-
- Stores:
-
- 1.  AuthStore
-      - Current user (Firebase User object)
-      - ID token for display/logging
-      - isAuthenticated flag
-      Methods: setUser(), setIdToken(), clear()
-
- 2.  CampStore
-      - Map of camps by ID
-      - Selected camp for context
-      Methods: setCamps(), addCamp(), removeCamp(), setSelectedCamp()
-
- 3.  ParticipantStore
-      - Map of participants by ID
-      - Selected participant for detail view
-      Methods: setParticipants(), addParticipant(), updateParticipant()
-
- Design:
- - subscribeWithSelector: only re-render on selected state changes
- - Maps instead of arrays for O(1) lookup
- - Immutable updates (create new Map)
-
- Usage:
- // Subscribe to entire store
- const { user, isAuthenticated } = useAuthStore()
-
- // Subscribe to single field (efficient)
- const camps = useCampStore((state) => state.camps)
-
- // Use selector to avoid re-renders
- const selectedCamp = useCampStore(state =>
-     state.camps.get(state.selectedCampId)
- )
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 7.  VALIDATION WITH ZOD
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/lib/validators.ts
-
- Schemas:
- - emailSchema: RFC 5322 email validation
- - passwordSchema: Min 8 chars, uppercase, number
- - participantRegistrationSchema: Form validation
- - campCreationSchema: Camp creation validation
- - roomCreationSchema: Room creation validation
- - paymentSchema: Payment transaction validation
-
- Usage:
- import { participantRegistrationSchema } from '@/lib/validators'
-
- try {
-     const data = participantRegistrationSchema.parse(formData)
-     await createParticipant(data)
- } catch (error) {
-     if (error instanceof z.ZodError) {
-       const fieldErrors = error.flatten().fieldErrors
-       setErrors(fieldErrors)
-     }
- }
-
- Runtime Validation:
- - Client-side (form validation, UX)
- - Server-side (security, data integrity)
- - Both should use same schemas
    \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 8.  PARTICIPANT STATE MACHINE
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/lib/stateMachine.ts
-
- Valid Transitions:
- draft → registered (self-service or staff)
- registered → payment_pending (if payment required)
- payment_pending → paid (after webhook from processor)
- paid → room_assigned (staff action)
- room_assigned → checked_in (at event)
-
- Any → cancelled (cancel registration)
- room_assigned/checked_in → no_show (after event)
-
- Functions:
- - getAvailableTransitions(state): Find valid next states
- - isValidTransition(from, to): Validate transition
- - getStateColor(state): UI color for badge
-
- Implementation:
- Each transition recorded in AuditLog with:
-     - Actor (user ID)
-     - Timestamp
-     - Changed fields
-     - Optional reason (cancellation notes, etc.)
-
- Usage:
- const transitions = getAvailableTransitions(participant.state)
- transitions.forEach(t => {
-     <button onClick={() => transitionParticipant(t.to)}>
-       {t.label}
-     </button>
- })
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 9.  ROUTING & LAYOUT
- ═══════════════════════════════════════════════════════════════════════════
-
- Location: src/App.tsx
-
- Routes:
- /login – LoginPage (public)
- /register/:slug – AttendeeRegistrationPage (public)
- /camps – CampListPage (protected)
- /dashboard/:campId – DashboardPage (protected)
- / – Redirect to /camps
- -                             – Redirect to /camps
-
- Protected Routes:
- - Check user exists via useAuth()
- - Show loading spinner while checking
- - Redirect to /login if not authenticated
-
- Camp-Scoped Routes:
- - Verify user has role in campId
- - (TODO: Implement in ProtectedRoute)
    \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- 10. UTILITY FUNCTIONS
- ═══════════════════════════════════════════════════════════════════════════
-
- Formatting (src/utils/formatting.ts):
- - formatDate(): "Jan 15, 2024"
- - formatDateTime(): "Jan 15, 2024 14:30"
- - formatCurrency(): "$199.99"
- - formatFullName(): "John Doe"
- - truncate(): "Long text…"
- - getInitials(): "JD"
-
- CSS Utilities (src/utils/cn.ts):
- - cn(): Merge Tailwind classes safely
- - Removes conflicts, deduplicates
-
- Usage:
- import { formatCurrency, cn } from '@/utils'
-
- <p>{formatCurrency(99.99, 'USD')}</p>
- <button className={cn('px-4', 'px-6')}>Save</button>
  \*/

/\*\*

- ═══════════════════════════════════════════════════════════════════════════
- NEXT STEPS & IMPLEMENTATION GUIDE
- ═══════════════════════════════════════════════════════════════════════════
-
- Phase 1: Backend Setup
- [ ] Create Node.js/Express auth server
- [ ] Implement /auth/signin, /auth/signup, /auth/refresh endpoints
- [ ] Setup bcrypt + pepper for password hashing
- [ ] Create JWT token generation/verification
- [ ] Firebase Admin SDK integration for custom claims
- [ ] Setup Firestore security rules
-
- Phase 2: Authentication
- [ ] Implement LoginForm component with error handling
- [ ] Add SignUp page
- [ ] Test Firebase <-> Backend <-> Frontend flow
- [ ] Setup refresh token rotation
- [ ] Add "remember me" / persistent login
- [ ] Password reset flow
-
- Phase 3: Camp Management
- [ ] Flesh out CampListPage with real data
- [ ] Create CampCreatePage with form validation
- [ ] Implement grouping dimensions CRUD
- [ ] Create CampDetailPage with settings
- [ ] Setup camp slug for self-service registration
-
- Phase 4: Participant Management
- [ ] Design and implement ParticipantListPage
- [ ] Create ParticipantDetailPage
- [ ] Build state machine actions UI
- [ ] Implement registration form with grouping dimensions
- [ ] Setup audit trail display
-
- Phase 5: Payment Integration
- [ ] Integrate Stripe/PayPal SDK
- [ ] Create PaymentForm component
- [ ] Setup Cloud Function for payment webhooks
- [ ] Implement payment_pending → paid transition
- [ ] Create invoice/receipt generation
-
- Phase 6: Room Assignment
- [ ] Design room allocation algorithm
- [ ] Implement manual room assignment UI
- [ ] Setup auto-assignment Cloud Function
- [ ] Enforce gender segregation rules
- [ ] Handle overbooking constraints
-
- Phase 7: Dashboard & Analytics
- [ ] Build dashboard with stats (registered, paid, checked in)
- [ ] Create reporting views (by state, gender, grade, etc.)
- [ ] Implement export to CSV/PDF
- [ ] Setup real-time Firestore subscriptions
-
- Phase 8: Polish & Deployment
- [ ] Add comprehensive error handling
- [ ] Setup logging and monitoring
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Accessibility audit (a11y)
- [ ] Deploy to Firebase Hosting
- [ ] Setup CI/CD pipeline
      \*/
