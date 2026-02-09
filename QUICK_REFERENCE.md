# QUICK REFERENCE & COMMON PATTERNS

## File Organization

### `/src/auth/`

Core authentication logic for Firebase + custom JWT backend

- `authService.ts` – Sign in/up, token management, role checking

### `/src/components/`

Reusable UI components and layouts

- `ProtectedRoute.tsx` – Route protection with role checks
- `AuthProvider.tsx` – Auth state initialization
- `LoginForm.tsx` – Login form component
- `PageLayout.tsx` – Standard page header + content layout

### `/src/features/`

Feature modules organized by domain

- `camps/` – Camp management (list, create, detail)
- `participants/` – Participant management (list, detail, state actions)
- `rooms/` – Room allocation and auto-assignment
- `dashboard/` – Admin command center and analytics
- `attendee/` – Self-service registration via public slug

### `/src/hooks/`

Custom React hooks

- `useAuth.ts` – Subscribe to auth state changes

### `/src/lib/`

Business logic and validation

- `stateMachine.ts` – Participant state transitions and colors
- `validators.ts` – Zod schemas for all forms and entities

### `/src/models/`

TypeScript type definitions for all entities

- `index.ts` – Camp, CampParticipant, Room, User, AuditLog, etc.

### `/src/services/`

Firebase and API integration layer

- `firestore.ts` – Type-safe Firestore queries
- `apiClient.ts` – Axios client with Firebase token injection

### `/src/store/`

Global state management with Zustand

- `index.ts` – AuthStore, CampStore, ParticipantStore

### `/src/utils/`

Utility functions

- `formatting.ts` – Date, currency, text formatting
- `cn.ts` – Tailwind class merge utility

---

## Common Patterns

### Add a New Page

1. Create feature folder: `src/features/newfeature/`
2. Create page component: `NewFeaturePage.tsx`
3. Add route in `src/App.tsx`:

```tsx
<Route
  path='/newfeature'
  element={
    <ProtectedRoute>
      <NewFeaturePage />
    </ProtectedRoute>
  }
/>
```

### Use Firestore Data

```tsx
import { getCampParticipants } from '@/services/firestore'
import { useParticipantStore } from '@/store'

export function ParticipantList({ campId }: { campId: string }) {
  const [participants, setParticipants] = useState<CampParticipant[]>([])

  useEffect(() => {
    getCampParticipants(campId).then(setParticipants)
  }, [campId])

  return <div>{/* render participants */}</div>
}
```

### Make API Call

```tsx
import apiClient from '@/services/apiClient'

// Automatically includes Firebase idToken in Authorization header
const response = await apiClient.post('/camps', {
  name: 'Summer Camp 2024',
  startDate: new Date('2024-06-01'),
})
```

### Validate Form Data

```tsx
import { participantRegistrationSchema } from '@/lib/validators'
import { z } from 'zod'

const handleSubmit = async (formData: unknown) => {
  try {
    const data = participantRegistrationSchema.parse(formData)
    await createParticipant(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors
      // Update form errors
    }
  }
}
```

### Check User Role

```tsx
import { hasRole } from '@/auth/authService'

const canDelete = await hasRole(campId, 'organizer')
if (canDelete) {
  // Show delete button
}
```

### Update Global State

```tsx
import { useCampStore } from '@/store'

// In component
const setCamps = useCampStore((state) => state.setCamps)
const camps = useCampStore((state) => state.camps)

// Update
setCamps(fetchedCamps)

// Get selected camp
const selectedCamp = camps.get(selectedCampId)
```

### Format Data for Display

```tsx
import { formatDate, formatCurrency, formatFullName } from '@/utils/formatting'

<p>{formatDate(participant.registeredAt)}</p>
<p>{formatCurrency(99.99, 'USD')}</p>
<p>{formatFullName(participant.firstName, participant.lastName)}</p>
```

### Show Participant State Badge

```tsx
import { getStateColor, type ParticipantState } from '@/lib/stateMachine'
import { cn } from '@/utils/cn'

;<span
  className={cn(
    'px-3 py-1 rounded-full text-sm font-medium',
    getStateColor(state),
  )}
>
  {state}
</span>
```

### Create Protected Route with Role Check

```tsx
<Route
  path='/dashboard/:campId'
  element={
    <ProtectedRoute requiredRole='organizer'>
      <DashboardPage />
    </ProtectedRoute>
  }
/>
```

### Subscribe to Auth Changes

```tsx
import { useAuth } from '@/hooks/useAuth'

export function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <p>Not logged in</p>

  return <p>Hello, {user?.email}</p>
}
```

### Set Up Real-time Firestore Listener

```tsx
import { onSnapshot, query, where } from 'firebase/firestore'
import { participantRef } from '@/services/firestore'

useEffect(() => {
  const q = query(participantRef, where('campId', '==', campId))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map((doc) => doc.data())
    setParticipants(participants)
  })

  return unsubscribe
}, [campId])
```

### Handle State Machine Transition

```tsx
import { getAvailableTransitions } from '@/lib/stateMachine'

const availableTransitions = getAvailableTransitions(participant.state)

{
  availableTransitions.map((transition) => (
    <button
      key={transition.to}
      onClick={() => changeParticipantState(participant.id, transition.to)}
    >
      {transition.label}
    </button>
  ))
}
```

---

## Environment Setup

### Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Fill in Firebase credentials in .env.local
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other vars ...

# Start dev server with HMR
npm run dev

# In another terminal, start emulators (if using Firebase Emulator Suite)
firebase emulators:start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
npm run preview  # Test production build locally
```

---

## Firebase Security Rules Template

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Camp-scoped access
    match /camps/{campId} {
      // Only staff/organizers can read/write
      allow read: if request.auth != null &&
                     request.auth.token[concat('role_', campId)] in ['admin', 'organizer', 'staff'];
      allow write: if request.auth != null &&
                      request.auth.token[concat('role_', campId)] in ['admin', 'organizer'];
    }

    // Participants scoped to camp
    match /camp_participants/{participantId} {
      allow read: if request.auth != null &&
                     (request.auth.uid == resource.data.userId ||
                      request.auth.token[concat('role_', resource.data.campId)] in ['admin', 'organizer', 'staff']);
      allow write: if request.auth != null &&
                      request.auth.token[concat('role_', resource.data.campId)] in ['admin', 'organizer'];
    }

    // Audit logs
    match /audit_logs/{logId} {
      allow read: if request.auth != null &&
                     request.auth.token[concat('role_', resource.data.campId)] in ['admin', 'organizer', 'staff'];
      allow write: if false; // Cloud Functions only
    }
  }
}
```

---

## TypeScript Path Aliases

All imports use aliases for clean code:

```tsx
// Instead of:
import { Camp } from '../../../models'

// Use:
import type { Camp } from '@models/index'
import { getCampParticipants } from '@services/firestore'
import { useAuth } from '@hooks/useAuth'
import { formatDate } from '@utils/formatting'
```

Available aliases:

- `@/*` – Anything in src/
- `@components/*` – src/components/
- `@features/*` – src/features/
- `@lib/*` – src/lib/
- `@models/*` – src/models/
- `@services/*` – src/services/
- `@hooks/*` – src/hooks/
- `@store/*` – src/store/
- `@utils/*` – src/utils/
- `@auth/*` – src/auth/

---

## Debugging Tips

### Check Auth State

```tsx
import { getCurrentUser } from '@/auth/authService'

console.log('Current user:', getCurrentUser())
```

### Inspect Zustand Store

```tsx
import { useAuthStore } from '@/store'

// In React DevTools, find the component and see the hook value
const state = useAuthStore()
console.log(state)
```

### Log API Calls

```tsx
// In apiClient.ts, uncomment request/response logging
this.client.interceptors.request.use((config) => {
  console.log('Request:', config.method?.toUpperCase(), config.url)
  return config
})
```

### Test Firestore Queries

```tsx
import { executeQuery, participantRef } from '@/services/firestore'
import { query, where } from 'firebase/firestore'

const q = query(participantRef, where('campId', '==', 'test-camp'))
const docs = await executeQuery(q)
console.log('Query result:', docs)
```
