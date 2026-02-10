# Test Users Guide

This document lists all available test users for the FL Camp App development environment.

## Test User Credentials

All test users use the same password: **`TestPassword123!`**

### 1. Super Admin

- **Email:** `superadmin@flcamp.com`
- **Password:** `TestPassword123!`
- **Access:** Full access to all camps and admin features
- **Roles:** `super_admin` (global)
- **Use Case:** Testing super admin features, user management, role assignment

### 2. Camp Admin

- **Email:** `admin@flcamp.com`
- **Password:** `TestPassword123!`
- **Access:** Admin rights for all camps (Summer, Winter, Spring)
- **Roles:**
  - `admin` in Summer Leadership Camp 2026
  - `admin` in Winter Sports & Faith Retreat 2026
  - `admin` in Spring Youth Conference 2026
- **Use Case:** Testing camp management features, room management, participant management

### 3. Treasurer

- **Email:** `treasurer@flcamp.com`
- **Password:** `TestPassword123!`
- **Access:** Financial management for Summer Leadership Camp 2026
- **Roles:**
  - `treasurer` in Summer Leadership Camp 2026
- **Use Case:** Testing payment management, financial reports, treasurer-specific features

### 4. Limited User (Viewer)

- **Email:** `limited@flcamp.com`
- **Password:** `TestPassword123!`
- **Access:** View-only access to Summer Leadership Camp 2026
- **Roles:**
  - `viewer` in Summer Leadership Camp 2026
- **Use Case:** Testing limited role access, UI restrictions for non-admin users

## Available Camps

All test users have access to these camps:

1. **Summer Leadership Camp 2026**
   - ID: `camp-summer-2026`
   - Dates: July 15-22, 2026
   - Cost: $499.99
   - Location: Mountain View Retreat Center, Colorado

2. **Winter Sports & Faith Retreat 2026**
   - ID: `camp-winter-2026`
   - Dates: December 26, 2026 - January 2, 2027
   - Cost: $699.99
   - Location: Alpine Lodge, Colorado

3. **Spring Youth Conference 2026**
   - ID: `camp-spring-2026`
   - Dates: April 3-5, 2026
   - Cost: $149.99
   - Location: Downtown Convention Center, Denver

## Testing Role-Based Features

### Super Admin Features

Sign in as `superadmin@flcamp.com`:

- ✅ View all camps
- ✅ View all users
- ✅ Grant/revoke roles
- ✅ Access admin panel
- ✅ View audit logs
- ✅ Manage all camp settings

### Camp Admin Features

Sign in as `admin@flcamp.com`:

- ✅ View camp details
- ✅ Manage participants
- ✅ Assign rooms
- ✅ Manage camp settings
- ✅ View payment status
- ❌ Cannot grant roles
- ❌ Cannot view other camps' details

### Treasurer Features

Sign in as `treasurer@flcamp.com`:

- ✅ View camp (Summer only)
- ✅ Manage payments
- ✅ Generate financial reports
- ✅ View participant payment status
- ❌ Cannot change room assignments
- ❌ Cannot delete participants
- ❌ Cannot access other camps

### Limited User Features

Sign in as `limited@flcamp.com`:

- ✅ View camp information
- ✅ View participants
- ❌ Cannot edit anything
- ❌ Cannot manage payments
- ❌ Cannot assign rooms

## Resetting Seed Data

To reset to fresh test data:

```bash
# Stop emulators
npm run emulators:stop

# Clear Firestore data (optional)
firebase emulators:start --only firestore

# In another terminal, run seed script
npx tsx scripts/seedData.ts

# Start all emulators
npm run emulators
```

## Debugging Tips

### Check User Roles in Firestore

1. Go to http://localhost:4000/firestore
2. Navigate to `users` collection
3. Click on a user document to see:
   - `globalRoles` array
   - `roles` object (campId → role mapping)
   - `campIds` array

### Check Auth in Firebase Console

1. Go to http://localhost:4000/auth
2. View all test users and their creation time
3. Use "Custom claims" to verify role assignments

### Test Token Exchange

After signing in:

1. Open DevTools → Application → localStorage
2. Look for `fl_camp_custom_token` and `fl_camp_token_claims`
3. Decode token to verify claims include:
   - `uid`
   - `email`
   - `globalRoles`
   - `scopedRoles`
   - `iat` (issued at)
   - `exp` (expiration)

## Creating Additional Test Users

To create new test users, edit `scripts/seedData.ts`:

1. Add to `testAuthUsers` array:

```typescript
const testAuthUsers = [
  // ... existing users
  {
    email: 'newuser@flcamp.com',
    password: 'TestPassword123!',
    userId: 'user-new-001',
  },
]
```

2. Add to `users` array:

```typescript
const users: User[] = [
  // ... existing users
  {
    id: 'user-new-001',
    email: 'newuser@flcamp.com',
    firstName: 'New',
    lastName: 'User',
    globalRoles: [],
    roles: {
      'camp-summer-2026': 'viewer', // or 'admin', 'treasurer'
    },
    campIds: ['camp-summer-2026'],
    // ... other fields
  },
]
```

3. Run seed script:

```bash
npx tsx scripts/seedData.ts
```

## Troubleshooting

### Can't Sign In

- Ensure emulators are running: `npm run emulators`
- Check email matches exactly (case-sensitive)
- Verify password is `TestPassword123!`
- Clear browser cache and localStorage

### Claims Not Showing

- Refresh page after sign-in
- Check browser DevTools console for errors
- Verify Cloud Functions are running
- Check Firestore has user document with proper roles

### Role-Based Access Not Working

- Verify user roles in Firestore `users` collection
- Check security rules in `firestore.rules`
- Ensure Cloud Functions token exchange succeeded
- Verify token contains correct claims

## Next Steps

For production, you'll want to:

1. Remove test users from seed script
2. Use strong, unique passwords
3. Implement role management UI
4. Add user invitation system
5. Implement password reset flow
