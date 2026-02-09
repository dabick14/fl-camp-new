# Camp Management System – Project Index

## 📋 Quick Navigation

### Getting Started

1. **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** ← Start here! What's been created and next steps
2. **[README.md](README.md)** – Project overview, quick start, and feature list
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** – Code patterns and examples

### Deep Dive

- **[ARCHITECTURE.md](ARCHITECTURE.md)** – Detailed design patterns and implementation guide

---

## 📁 Project Structure

### Core Application

| Path              | Purpose                           |
| ----------------- | --------------------------------- |
| `src/App.tsx`     | Main router and route definitions |
| `src/main.tsx`    | React 18 entry point              |
| `src/firebase.ts` | Firebase SDK initialization       |
| `src/index.css`   | Global Tailwind styles            |

### Authentication

| Path                                | Purpose                                |
| ----------------------------------- | -------------------------------------- |
| `src/auth/authService.ts`           | Firebase Auth + JWT token management   |
| `src/hooks/useAuth.ts`              | React hook for auth state subscription |
| `src/components/AuthProvider.tsx`   | Auth initialization wrapper            |
| `src/components/ProtectedRoute.tsx` | Route protection component             |

### Features

| Path                                                | Purpose                   |
| --------------------------------------------------- | ------------------------- |
| `src/features/camps/CampListPage.tsx`               | Camp management interface |
| `src/features/participants/ParticipantListPage.tsx` | Participant management    |
| `src/features/rooms/RoomAllocationPage.tsx`         | Room assignment interface |
| `src/features/dashboard/DashboardPage.tsx`          | Admin dashboard           |
| `src/features/attendee/RegistrationPage.tsx`        | Self-service registration |

### Business Logic

| Path                      | Purpose                                |
| ------------------------- | -------------------------------------- |
| `src/lib/stateMachine.ts` | Participant state transitions & colors |
| `src/lib/validators.ts`   | Zod schemas for all forms              |
| `src/models/index.ts`     | TypeScript type definitions            |

### Data Layer

| Path                        | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `src/services/firebase.ts`  | Type-safe Firestore queries                |
| `src/services/apiClient.ts` | Axios with Firebase token injection        |
| `src/store/index.ts`        | Zustand stores (auth, camps, participants) |

### Utilities

| Path                            | Purpose                         |
| ------------------------------- | ------------------------------- |
| `src/utils/formatting.ts`       | Date, currency, text formatting |
| `src/utils/cn.ts`               | Tailwind class merge utility    |
| `src/components/PageLayout.tsx` | Standard page layout            |
| `src/components/LoginForm.tsx`  | Login form component            |

### Configuration

| Path                 | Purpose                        |
| -------------------- | ------------------------------ |
| `package.json`       | Dependencies and scripts       |
| `tsconfig.json`      | TypeScript configuration       |
| `vite.config.ts`     | Vite build configuration       |
| `tailwind.config.js` | Tailwind CSS configuration     |
| `postcss.config.js`  | PostCSS plugin configuration   |
| `.eslintrc.json`     | ESLint rules                   |
| `.env.local.example` | Environment variables template |

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials
```

### 3. Start Development

```bash
npm run dev
# Opens at http://localhost:5173
```

### 4. Build for Production

```bash
npm run build
npm run preview
```

---

## 📦 Key Technologies

| Technology   | Version | Purpose                              |
| ------------ | ------- | ------------------------------------ |
| React        | 18.2+   | UI framework                         |
| TypeScript   | 5.3+    | Type safety                          |
| Firebase     | 10.7+   | Backend (Auth, Firestore, Functions) |
| Zustand      | 4.4+    | Global state                         |
| Zod          | 3.22+   | Validation                           |
| Tailwind CSS | 3.4+    | Styling                              |
| Vite         | 5.0+    | Build tool                           |
| Axios        | 1.6+    | HTTP client                          |
| React Router | 6.20+   | Routing                              |

---

## 🎯 Implementation Phases

### Phase 1: Backend Setup (2-3 days)

- [ ] Create Node.js/Express authentication server
- [ ] Implement /auth/signin, /auth/signup, /auth/refresh endpoints
- [ ] Setup password hashing with bcrypt + pepper
- [ ] Firebase Admin SDK integration
- [ ] Custom claims for role-based access

### Phase 2: Authentication (1-2 days)

- [ ] Test Firebase ← → Backend ← → Frontend integration
- [ ] Implement login/signup flows
- [ ] Token refresh and persistence
- [ ] Password reset functionality

### Phase 3: Camp Management (2-3 days)

- [ ] CampListPage with real data
- [ ] CampCreatePage with validation
- [ ] Grouping dimensions CRUD
- [ ] Self-service registration slug

### Phase 4: Participant Management (3-4 days)

- [ ] ParticipantListPage with filtering
- [ ] ParticipantDetailPage
- [ ] Registration form with dynamic fields
- [ ] State machine actions UI

### Phase 5: Payment Integration (2-3 days)

- [ ] Stripe/PayPal SDK integration
- [ ] PaymentForm component
- [ ] Webhook handling for payment updates
- [ ] Invoice/receipt generation

### Phase 6: Room Assignment (2-3 days)

- [ ] Room allocation algorithm
- [ ] Manual and auto assignment UI
- [ ] Gender segregation enforcement
- [ ] Overbooking constraint handling

### Phase 7: Dashboard & Analytics (2-3 days)

- [ ] Statistics and KPI cards
- [ ] Reporting views with filtering
- [ ] Export to CSV/PDF
- [ ] Real-time Firestore subscriptions

### Phase 8: Deployment & Polish (2-3 days)

- [ ] Error handling and logging
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] CI/CD setup
- [ ] Firebase Hosting deployment

---

## 📚 Documentation Files

| File                 | Description                                |
| -------------------- | ------------------------------------------ |
| `README.md`          | Project overview, features, quick start    |
| `SETUP_COMPLETE.md`  | What's created, checklist, quick links     |
| `ARCHITECTURE.md`    | Deep dive on design patterns (10 sections) |
| `QUICK_REFERENCE.md` | Code examples, common patterns, debugging  |
| `INDEX.md`           | This file – project navigation             |

---

## 💡 Key Design Decisions

### Authentication

- Firebase Auth for user identity
- Custom JWT backend for additional claims
- Auto-token injection into API requests via axios interceptors
- Role-based access control (RBAC) via custom claims

### State Management

- Zustand for global state (simpler than Redux)
- Separate stores for auth, camps, participants
- Selector-based subscriptions to prevent unnecessary re-renders

### Firestore Data Layer

- Type-safe query builders in `services/firestore.ts`
- Typed collection references
- Specific getter functions for common queries
- Support for custom queries via executeQuery()

### Validation

- Zod schemas for runtime validation
- Same schemas on client and server
- Used in form submissions and API responses

### Routing

- React Router v6 with lazy loading capability
- Protected routes with auth checks
- Camp-scoped routes for role verification
- Slug-based self-service registration

---

## 🔐 Security Considerations

### Implemented

✅ Protected routes (redirect to /login if not authenticated)  
✅ Firebase ID token injection into API calls  
✅ RBAC via custom token claims  
✅ Type-safe Firestore queries

### To Implement

- [ ] Firestore security rules (camp-scoped access)
- [ ] Backend JWT verification and refresh
- [ ] HTTPS-only cookies for tokens
- [ ] CSRF protection
- [ ] Input sanitization
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging on all state changes

---

## 🛠 Development Tips

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Path Aliases

All imports use clean aliases:

```tsx
import { Camp } from '@models/index'
import { getCampParticipants } from '@services/firestore'
import { useAuth } from '@hooks/useAuth'
```

### Firebase Emulator

In development, the app connects to Firebase Emulator if available:

- Auth: http://localhost:9099
- Firestore: http://localhost:8080
- Functions: http://localhost:5001

### Zustand DevTools

Install Redux DevTools browser extension to inspect Zustand stores.

---

## 📖 External Resources

- [Firebase Documentation](https://firebase.google.com/docs/)
- [React Router v6](https://reactrouter.com/docs)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [Zod Schema Validation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

---

## ✅ What's Ready

✅ Complete TypeScript project scaffold  
✅ Firebase initialization and configuration  
✅ Authentication service (Firebase + JWT backend ready)  
✅ Protected routing with RBAC  
✅ Firestore data layer with type-safe queries  
✅ Zustand global state management  
✅ Form validation with Zod  
✅ API client with auto-token injection  
✅ Participant state machine logic  
✅ Tailwind CSS + utility functions  
✅ Development server with HMR  
✅ Comprehensive documentation

**Start implementing Phase 1 to establish the backend!** 🚀

---

## 📞 Support

For questions or issues:

1. Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for code examples
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for design patterns
3. Consult official docs (Firebase, React Router, Zustand, etc.)

---

**Project Setup: ✅ Complete**  
**Ready for Feature Development: ✅ Yes**  
**Documentation: ✅ Comprehensive**
