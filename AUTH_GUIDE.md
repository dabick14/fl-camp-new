# Authentication & Authorization Guide

## Overview

The FL Camp App uses a two-tier authentication system:

1. **Firebase Authentication** - Handles user sign-in (email/password, phone, etc.)
2. **Custom JWT Tokens** - Contains role-based access control (RBAC) claims

This approach provides:

- Secure authentication via Firebase
- Flexible role-based authorization
- Fine-grained access control per camp
- Easy integration with Firestore security rules

## Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└─────┬───────┘
      │ 1. Sign in with email/password
      ▼
┌─────────────────┐
│ Firebase Auth   │
└─────┬───────────┘
      │ 2. Get Firebase ID Token
      ▼
┌─────────────────┐
│ Cloud Function  │ ──► 3. Fetch user roles from Firestore
│ exchangeToken() │
└─────┬───────────┘
      │ 4. Generate Custom JWT with claims
      ▼
┌─────────────────┐
│    Client       │ ──► 5. Store custom token + claims
│   useAuth()     │ ──► 6. Use claims for authorization
└─────────────────┘
```

## Role Structure

### Global Roles

Global roles apply across the entire application:

- `super_admin` - Full access to all camps and admin features
- `support` - Read-only access to help users (future)

### Scoped Roles

Scoped roles apply to specific camps:

- `admin` - Full management of a specific camp
- `treasurer` - Financial management for a specific camp
- `scoped_admin` - Limited admin rights for a specific camp (future)

### Example User Document

```typescript
{
  id: "user-123",
  email: "john@example.com",
  globalRoles: ["super_admin"], // Optional global roles
  roles: {
    "camp-summer-2024": "admin",
    "camp-winter-2024": "treasurer"
  },
  campIds: ["camp-summer-2024", "camp-winter-2024"]
}
```

## Custom JWT Claims

The custom JWT token contains:

```typescript
{
  uid: "user-123",
  email: "john@example.com",
  globalRoles: ["super_admin"],
  scopedRoles: {
    "camp-summer-2024": "admin",
    "camp-winter-2024": "treasurer"
  },
  iat: 1234567890,  // Issued at timestamp
  exp: 1234567890   // Expiration timestamp (7 days)
}
```

## Frontend Usage

### 1. Sign In Flow

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/firebase'
import { exchangeFirebaseToken } from '@/auth/customTokenService'

// Sign in with Firebase
const userCredential = await signInWithEmailAndPassword(auth, email, password)

// Exchange for custom token (happens automatically via useAuth hook)
const { customToken, claims } = await exchangeFirebaseToken()
```

### 2. Using the useAuth Hook

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const {
    user,              // Firebase user object
    customToken,       // Custom JWT string
    claims,            // Decoded claims
    loading,           // Loading state
    error,             // Error message
    isSuperAdmin,      // Quick check for super admin
    hasGlobalRole,     // Check for specific global role
    getScopedRole,     // Get role for specific camp
    hasScopedRole,     // Check role for specific camp
    canAccessCamp,     // Check if user can access camp
    refreshAuth,       // Manually refresh token
    signOut,           // Sign out user
  } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>

  return (
    <div>
      <p>Email: {user.email}</p>
      {isSuperAdmin && <p>You are a super admin!</p>}

      <CampList />
    </div>
  )
}
```

### 3. Protecting Routes

```typescript
import { RequireRole, RequireAuth } from '@/components/RequireRole'

// Require any authenticated user
<RequireAuth>
  <Dashboard />
</RequireAuth>

// Require super admin
<RequireRole globalRole="super_admin">
  <AdminPanel />
</RequireRole>

// Require camp admin
<RequireRole scopedRole="admin" campId="camp-123">
  <CampSettings campId="camp-123" />
</RequireRole>

// Require treasurer (can manage finances)
<RequireRole scopedRole="treasurer" campId="camp-123">
  <PaymentManagement campId="camp-123" />
</RequireRole>
```

### 4. Conditional UI Elements

```typescript
import { ShowForRole } from '@/components/RequireRole'

function CampCard({ campId }: { campId: string }) {
  const { getScopedRole } = useAuth()
  const role = getScopedRole(campId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Camp Name</CardTitle>
      </CardHeader>
      <CardContent>
        {role && <Badge>{role}</Badge>}

        <ShowForRole scopedRole="admin" campId={campId}>
          <Button>Delete Camp</Button>
        </ShowForRole>

        <ShowForRole scopedRole="treasurer" campId={campId}>
          <Button>View Finances</Button>
        </ShowForRole>
      </CardContent>
    </Card>
  )
}
```

## Backend (Cloud Functions)

### Available Functions

#### 1. exchangeToken

Exchange Firebase ID token for custom JWT with claims.

```typescript
// Called automatically by customTokenService
const functions = getFunctions()
const exchange = httpsCallable(functions, 'exchangeToken')
const result = await exchange()
```

#### 2. refreshToken

Refresh custom JWT token (fetches latest roles from Firestore).

```typescript
const refresh = httpsCallable(functions, 'refreshToken')
const result = await refresh()
```

#### 3. verifyCustomToken

Verify custom JWT is valid and not tampered with.

```typescript
const verify = httpsCallable(functions, 'verifyCustomToken')
const result = await verify({ token: customToken })
```

#### 4. grantRole

Admin function to grant roles to users (super_admin only).

```typescript
const grant = httpsCallable(functions, 'grantRole')

// Grant global role
await grant({
  userId: 'user-123',
  role: 'super_admin',
  isGlobal: true,
})

// Grant scoped role
await grant({
  userId: 'user-456',
  campId: 'camp-summer-2024',
  role: 'admin',
  isGlobal: false,
})
```

## Firestore Security Rules

Security rules use custom claims to enforce authorization:

### Example Rules

```javascript
// Check if user is super admin
function isSuperAdmin() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid))
    .data.globalRoles.hasAny(['super_admin']);
}

// Check if user has camp role
function hasCampRole(campId, role) {
  return get(/databases/$(database)/documents/users/$(request.auth.uid))
    .data.roles[campId] == role;
}

// Check if user can manage camp
function canManageCamp(campId) {
  return isSuperAdmin() || hasCampRole(campId, 'admin');
}

// Apply to collection
match /camps/{campId} {
  allow read: if true; // Public
  allow write: if canManageCamp(campId);
}
```

### Access Patterns

| Collection       | Read                | Create               | Update                        | Delete      |
| ---------------- | ------------------- | -------------------- | ----------------------------- | ----------- |
| **users**        | Self or super_admin | Super_admin          | Self (limited) or super_admin | Super_admin |
| **camps**        | Everyone            | Super_admin          | Camp admin                    | Camp admin  |
| **rooms**        | Camp staff          | Camp admin           | Camp admin                    | Camp admin  |
| **participants** | Everyone\*          | Authenticated        | Camp admin or treasurer       | Super_admin |
| **payments**     | Camp staff          | Treasurer/Admin      | Treasurer/Admin               | Super_admin |
| **auditLogs**    | Super_admin         | Cloud Functions only | Denied                        | Denied      |

\*In production, you may want to restrict participant read access

## Token Management

### Token Expiry

- Custom JWT tokens expire after 7 days
- Token is automatically refreshed when within 5 minutes of expiry
- `ensureValidToken()` handles auto-refresh transparently

### Token Storage

Tokens are stored in localStorage:

- `fl_camp_custom_token` - JWT string
- `fl_camp_token_claims` - Decoded claims (for quick access)
- `fl_camp_token_expiry` - Expiration timestamp

### Manual Token Refresh

```typescript
const { refreshAuth } = useAuth()

try {
  await refreshAuth()
  console.log('Token refreshed')
} catch (error) {
  console.error('Refresh failed:', error)
  // User may need to sign in again
}
```

## Error Handling

### Common Errors

#### 1. Unauthenticated

```typescript
// Error: User not signed in with Firebase
// Solution: Redirect to login page
```

#### 2. Not Found

```typescript
// Error: User profile not found in Firestore
// Solution: Ensure onUserCreate function ran or manually create profile
```

#### 3. Token Expired

```typescript
// Error: Custom JWT has expired
// Solution: Call refreshCustomToken() or ensureValidToken()
```

#### 4. Permission Denied

```typescript
// Error: User lacks required role for operation
// Solution: Check user roles and show appropriate error message
```

### Error Handling in Components

```typescript
function ProtectedComponent({ campId }: { campId: string }) {
  const { error, loading, canAccessCamp } = useAuth()

  if (loading) return <LoadingSpinner />

  if (error) {
    return <Alert variant="destructive">{error}</Alert>
  }

  if (!canAccessCamp(campId)) {
    return (
      <Alert variant="destructive">
        You don't have permission to access this camp.
      </Alert>
    )
  }

  return <CampDetails campId={campId} />
}
```

## Security Best Practices

### 1. Never Trust Client Claims

Always verify claims server-side using Firestore security rules.

### 2. Use HTTPS in Production

Custom tokens contain sensitive information. Always use HTTPS.

### 3. Rotate JWT Secret

In production, use Firebase Secret Manager to store JWT_SECRET and rotate periodically.

```bash
# Set secret
firebase functions:secrets:set JWT_SECRET

# Access in code
const JWT_SECRET = process.env.JWT_SECRET
```

### 4. Validate Token on Critical Operations

For sensitive operations (payments, deletions), call `verifyCustomToken` to ensure token hasn't been tampered with.

### 5. Implement Rate Limiting

Add rate limiting to token exchange and refresh endpoints to prevent abuse.

### 6. Monitor Audit Logs

Review audit logs regularly for suspicious activity:

```typescript
// Query audit logs
const logs = await db
  .collection('auditLogs')
  .where('type', '==', 'token_exchange')
  .where('timestamp', '>', yesterday)
  .get()
```

## Development vs Production

### Development (Emulators)

```typescript
// Use local emulator endpoints
const functions = getFunctions()
connectFunctionsEmulator(functions, 'localhost', 5001)

// JWT_SECRET can be hardcoded
const JWT_SECRET = 'dev-secret-key'
```

### Production

```typescript
// Use production endpoints (automatic)
const functions = getFunctions()

// Use Firebase Secret Manager
const JWT_SECRET = process.env.JWT_SECRET
```

## Testing

### Test Authentication Flow

```bash
# 1. Start emulators
npm run emulators

# 2. Sign in via UI
# Visit http://localhost:5173 and sign in

# 3. Check token in DevTools
localStorage.getItem('fl_camp_custom_token')

# 4. Decode token (jwt.io or code)
const claims = JSON.parse(
  atob(token.split('.')[1])
)
console.log(claims)
```

### Test Role-Based Access

```typescript
// Grant admin role
const grantRole = httpsCallable(functions, 'grantRole')
await grantRole({
  userId: 'test-user-id',
  campId: 'test-camp-id',
  role: 'admin',
  isGlobal: false,
})

// Verify access
const { canAccessCamp } = useAuth()
expect(canAccessCamp('test-camp-id')).toBe(true)
```

## Troubleshooting

### Issue: Token exchange fails

**Solution:** Check that:

1. User is signed in with Firebase Auth
2. User document exists in Firestore
3. Cloud Functions are running (`npm run emulators`)

### Issue: Security rules deny access

**Solution:**

1. Verify user has correct roles in Firestore
2. Check security rules syntax
3. Test rules in Firebase console

### Issue: Token expired immediately

**Solution:**

1. Check server/client time sync
2. Verify JWT_EXPIRY is set correctly
3. Check token expiry calculation in `parseExpiryToMs()`

## Next Steps

1. **Implement Password Reset** - Add forgot password flow
2. **Add Phone Authentication** - Support phone number sign-in
3. **Multi-Factor Authentication** - Enhance security with 2FA
4. **Session Management** - Track active sessions and allow revocation
5. **Role Hierarchy** - Implement role inheritance (admin > treasurer > viewer)

## Resources

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
