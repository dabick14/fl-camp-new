# Quick Start Guide - Testing Authentication

This guide walks you through testing the authentication and authorization system.

## Prerequisites

Make sure emulators are running:

```bash
npm run emulators
```

You should see output like:

```
✔ Auth Emulator listening on http://localhost:9099
✔ Firestore Emulator listening on http://localhost:8080
✔ Cloud Functions emulator listening on http://localhost:5001
✔ Emulator Hub listening on localhost:4400
```

## Step 1: Start the React App

In another terminal:

```bash
npm run dev
```

The app should be available at http://localhost:5173

## Step 2: Sign In with Test User

1. Click "Sign in" or navigate to the login page
2. Enter one of the test users:
   - **Super Admin:** `superadmin@flcamp.com` / `TestPassword123!`
   - **Camp Admin:** `admin@flcamp.com` / `TestPassword123!`
   - **Treasurer:** `treasurer@flcamp.com` / `TestPassword123!`
   - **Limited User:** `limited@flcamp.com` / `TestPassword123!`

3. Click "Sign In"

## Step 3: Verify Token Exchange

After signing in, you should see the camps page. To verify the token was exchanged:

1. Open **DevTools** (F12)
2. Go to **Application** tab
3. Click **Local Storage** → **http://localhost:5173**
4. You should see:
   - `fl_camp_custom_token` - JWT string
   - `fl_camp_token_claims` - Claims object (copy the value to see it)

### Decode the Token

Copy the value of `fl_camp_token_claims` and paste into DevTools console to verify it contains:

```javascript
// Paste the claims string
JSON.parse('YOUR_CLAIMS_HERE')

// Should output something like:
{
  "uid": "user-super-admin-001",
  "email": "superadmin@flcamp.com",
  "globalRoles": ["super_admin"],
  "scopedRoles": {},
  "iat": 1707552000,
  "exp": 1708156800
}
```

## Step 4: Test Role-Based Access

### Super Admin Access

1. Sign in as `superadmin@flcamp.com`
2. You should have access to:
   - All camp management features
   - User management (if implemented)
   - Admin panel
   - All treasur features

### Camp Admin Access

1. Sign in as `admin@flcamp.com`
2. You should have access to:
   - All 3 camps (Summer, Winter, Spring)
   - Edit camp settings
   - Manage participants
   - Assign rooms
   - View payments

### Treasurer Access

1. Sign in as `treasurer@flcamp.com`
2. You should have limited access:
   - Summer camp only
   - View participants
   - Manage payments
   - Cannot delete participants
   - Cannot manage rooms

### Limited User Access

1. Sign in as `limited@flcamp.com`
2. You should see:
   - Summer camp info (read-only)
   - Cannot manage anything
   - Limited UI (edit buttons hidden)

## Step 5: Monitor Firestore Security Rules

To verify security rules are working:

1. Open DevTools **Console** tab
2. Try operations that should fail:
   - Limited user tries to edit camp (check console for permission denied error)
   - Non-admin tries to delete participant (should get permission error)

Security rules should block operations not allowed by the user's role.

## Step 6: Check Audit Logs

Super admin users can view token exchange audit logs in Firestore:

1. Go to http://localhost:4000/firestore
2. Navigate to `auditLogs` collection
3. You should see entries for:
   - `token_exchange` - when users sign in
   - `role_granted` - when roles are assigned

## Debugging Tips

### Token Exchange Failed?

Check Cloud Functions console output:

1. Look at terminal running `npm run emulators`
2. Search for errors from `exchangeToken` function
3. Verify user document exists in Firestore with correct roles

### Claims Not Updated?

If you change user roles in Firestore:

1. Sign out the user
2. Sign back in to trigger new token exchange
3. Or click "Refresh Token" button if implemented

### Still Stuck on Loading?

1. Check browser console for errors (DevTools → Console)
2. Verify Firestore has user document: http://localhost:4000/firestore
3. Verify camps exist in Firestore
4. Check that `customTokenService.ts` properly handles token exchange

### Clear Cache if Needed

```bash
# Clear localStorage
localStorage.clear()

# Or in app, you can:
// 1. Go to DevTools → Application → Clear Site Data
// 2. Sign out
// 3. Close browser
// 4. Restart app
```

## What's Working

✅ **Authentication:** Firebase Auth sign-in  
✅ **Token Exchange:** Custom JWT generation  
✅ **Role Storage:** Roles stored in Firestore  
✅ **Claims Management:** Claims in JWT token  
✅ **Security Rules:** Firestore rules enforce access control  
✅ **Auto Refresh:** Token auto-refreshes before expiry

## Possible Issues with Loading

If you're stuck on loading camp screen:

### 1. Check if customTokenService is properly integrated

- Verify `useAuth()` hook is being used
- Check `ensureValidToken()` is called on auth state change

### 2. Verify user document structure

- Go to http://localhost:4000/firestore
- Check `users` collection
- Verify user has:
  - `globalRoles` array
  - `roles` object
  - `campIds` array

### 3. Check Cloud Functions

- Verify `exchangeToken` function exists
- Check function logs in terminal

### 4. Verify Firestore has camp data

- Go to http://localhost:4000/firestore
- Check `camps` collection
- Should see 3 camps

## Next Steps

1. **Test Different Roles:** Try each test user to see how UI changes
2. **Try Protected Routes:** Implement route protection with `<RequireRole>`
3. **Test Conditional Rendering:** Use `<ShowForRole>` to hide/show elements
4. **Verify Security Rules:** Try operations that should be blocked
5. **Check Audit Logs:** See token exchanges in audit logs

## Files Reference

- **Authentication:** `src/hooks/useAuth.ts` - Auth state and utilities
- **Token Management:** `src/auth/customTokenService.ts` - Token exchange and refresh
- **Route Protection:** `src/components/RequireRole.tsx` - Authorization components
- **Cloud Functions:** `functions/src/index.ts` - Token exchange backend
- **Security Rules:** `firestore.rules` - Database access control
- **Test Users:** `TEST_USERS.md` - Detailed user credentials

## Support

For detailed information, see:

- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - Complete authentication documentation
- [AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md) - Implementation details
- [TEST_USERS.md](./TEST_USERS.md) - Test user reference
