# Camp Management System – Initial Project Setup

## Project Structure

```
fl-camp-new/
├── src/
│   ├── auth/
│   │   └── authService.ts              # Firebase + JWT auth logic
│   ├── components/
│   │   ├── AuthProvider.tsx            # Auth state wrapper
│   │   ├── ProtectedRoute.tsx          # Route protection + RBAC
│   │   ├── LoginForm.tsx               # Login UI
│   │   └── PageLayout.tsx              # Shared layout
│   ├── features/
│   │   ├── camps/
│   │   │   └── CampListPage.tsx        # Camp list/detail view
│   │   ├── participants/
│   │   │   └── ParticipantListPage.tsx # Participant list + state actions
│   │   ├── rooms/
│   │   │   └── RoomAllocationPage.tsx  # Room assignment UI
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx       # Admin command center
│   │   └── attendee/
│   │       └── RegistrationPage.tsx    # Self-service registration
│   ├── hooks/
│   │   └── useAuth.ts                  # Auth hooks
│   ├── lib/
│   │   ├── stateMachine.ts             # Participant state transitions
│   │   └── validators.ts               # Zod schemas (camps, participants, rooms, etc.)
│   ├── models/
│   │   └── index.ts                    # TypeScript interfaces (Camp, CampParticipant, Room, User, etc.)
│   ├── services/
│   │   ├── apiClient.ts                # Axios + Firebase token injection
│   │   └── firestore.ts                # Firestore queries (typed)
│   ├── store/
│   │   └── index.ts                    # Zustand stores (auth, camps, participants)
│   ├── utils/
│   │   ├── formatting.ts               # Date, currency, text formatting
│   │   └── cn.ts                       # Tailwind class merge
│   ├── firebase.ts                     # Firebase initialization
│   ├── App.tsx                         # Main router + routes
│   ├── main.tsx                        # React entry point
│   └── index.css                       # Tailwind + global styles
├── public/                             # Static assets
├── index.html                          # HTML template
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config
├── tsconfig.node.json                  # Node TS config (Vite)
├── vite.config.ts                      # Vite config
├── tailwind.config.js                  # Tailwind config
├── postcss.config.js                   # PostCSS config
├── .env.example                        # Environment vars template
├── .env.local.example                  # Local env template
└── .gitignore                          # Git ignore

```

## Key Features

### 1. **Firebase Integration (v10+)**

- Modular SDK imports for Auth, Firestore, Functions
- Custom token generation for JWT backend integration
- ID token injection into all API requests
- Local emulator support for development

### 2. **Authentication & Authorization**

- Email/password Firebase Auth
- Custom JWT backend for token management (refresh, verify)
- Role-based access control (RBAC) via custom claims in Firebase tokens
- Camp-scoped roles (organizer, staff, etc.)
- Protected routes with automatic redirect to login

### 3. **Participant State Machine**

- State transitions: `draft` → `registered` → `payment_pending` → `paid` → `room_assigned` → `checked_in`
- Color-coded state badges
- Audit trail on all state changes
- Extensible for workflows like cancellations and no-shows

### 4. **Type Safety**

- Full TypeScript models for all entities (Camp, CampParticipant, Room, User, etc.)
- Zod schemas for runtime validation
- Type-safe Firestore queries with mapped references

### 5. **Global State Management**

- Zustand stores for auth, camps, and participants
- Selectors for efficient subscriptions
- No re-render on unrelated state changes

### 6. **API Integration**

- Axios client with Firebase ID token auto-injection
- Typed Firestore queries with type-safe refs and getters
- Support for custom backend endpoints

### 7. **UI & Styling**

- Tailwind CSS with custom utilities
- shadcn-ready component structure (easily add shadcn/ui)
- Responsive layout helpers
- Class merge utility (clsx + twMerge)

### 8. **Routing**

- React Router v6 with protected routes
- Dynamic routes for self-service registration (slug-based)
- Camp-scoped dashboard access

### 9. **Development DX**

- Path aliases for clean imports (`@/models`, `@/services`, etc.)
- Vite for fast HMR
- ESLint + TypeScript strict mode
- Built-in emulator support

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in your Firebase credentials

# Run dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Required in `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_BASE_URL=http://localhost:3000  # Custom auth backend
```

## Next Steps

1. **Backend Integration**: Implement Node.js/Express auth endpoints:
   - `POST /auth/signin` – verify Firebase token → issue JWT
   - `POST /auth/signup` – create user → issue JWT
   - `POST /auth/refresh` – refresh access token
   - `POST /auth/verify` – verify access token

2. **Firestore Security Rules**: Implement camp-scoped access patterns
3. **Cloud Functions**: Set up webhooks for:
   - Payment processor (Stripe/PayPal) → update participant state
   - Auto-room assignment logic
   - Audit trail logging

4. **Feature Implementation**:
   - Camp creation/editing with grouping dimensions
   - Participant registration form with dynamic fields
   - Room allocation algorithm (gender segregation + overbooking)
   - Payment flow with processor integration
   - Admin dashboard with analytics

5. **UI Components**: Flesh out feature pages with shadcn/ui components
