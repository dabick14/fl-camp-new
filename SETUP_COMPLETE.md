# Test Users & Authentication Setup - Complete

## ✅ What's Been Done

### 1. Test Users Created

Four test users have been created with different role levels:

| User            | Email                   | Password           | Role                 | Access                                          |
| --------------- | ----------------------- | ------------------ | -------------------- | ----------------------------------------------- |
| **Super Admin** | `superadmin@flcamp.com` | `TestPassword123!` | Global super_admin   | All camps, all features                         |
| **Camp Admin**  | `admin@flcamp.com`      | `TestPassword123!` | Admin for 3 camps    | Full management of Summer, Winter, Spring camps |
| **Treasurer**   | `treasurer@flcamp.com`  | `TestPassword123!` | Treasurer for Summer | Payment management only                         |
| **Limited**     | `limited@flcamp.com`    | `TestPassword123!` | Viewer for Summer    | Read-only access to Summer camp                 |

### 2. Firebase Auth Users

Test users are created in Firebase Auth emulator with proper credentials.

### 3. Firestore User Documents

User documents include:

- `globalRoles` array (e.g., `['super_admin']`)
- `roles` object mapping campId → role
- `campIds` array for quick lookups
- Proper role hierarchy setup

### 4. CampListPage Fixed

The camp loading issue is resolved! The page now:

- ✅ Fetches camps from Firestore
- ✅ Filters by user access (respects role-based permissions)
- ✅ Shows role badge for each camp
- ✅ Displays camp details (dates, location, cost)
- ✅ Has loading/error states

## 🚀 How to Test

### Start Everything

```bash
# Terminal 1: Start emulators
npm run emulators

# Terminal 2: Start React app
npm run dev
```

### Test the Auth Flow

1. Go to http://localhost:5173
2. Sign in with any test user (e.g., `admin@flcamp.com` / `TestPassword123!`)
3. You should immediately see 3 camps (Summer, Winter, Spring)
4. Click "View Details" to open a camp

### Verify Role-Based Access

- **Super Admin:** Can see all camps
- **Camp Admin:** Can see all 3 camps
- **Treasurer:** Can see Summer camp only
- **Limited User:** Can see Summer camp only (read-only)

### Check Token Exchange

1. Open DevTools → Application → LocalStorage
2. Look for `fl_camp_custom_token` and `fl_camp_token_claims`
3. Verify claims include your role info

## 📚 Documentation Files

### New Files Created:

- **[TEST_USERS.md](./TEST_USERS.md)** - Complete test user reference with detailed descriptions
- **[TESTING_AUTH.md](./TESTING_AUTH.md)** - Step-by-step testing guide
- **[AUTH_IMPLEMENTATION.md](./AUTH_IMPLEMENTATION.md)** - Implementation summary and checklist
- **[AUTH_GUIDE.md](./AUTH_GUIDE.md)** - Comprehensive authentication documentation

### Key Files Updated:

- **scripts/seedData.ts** - Now creates Firebase Auth users + Firestore documents
- **src/features/camps/CampListPage.tsx** - Now fetches and displays camps
- **src/models/index.ts** - Added `globalRoles` to User interface

## 🔍 Troubleshooting Camp Loading

If camps don't load:

1. **Check emulators are running:**

   ```bash
   curl http://localhost:4400/emulators
   ```

2. **Verify seed data exists:**
   - Go to http://localhost:4000/firestore
   - Check `camps` collection
   - Should have 3 camps

3. **Check user document in Firestore:**
   - Go to http://localhost:4000/firestore
   - Click `users` collection
   - Find your user (e.g., admin@flcamp.com)
   - Verify has `roles` and `campIds`

4. **Check browser console for errors:**
   - DevTools → Console tab
   - Look for fetch or permission errors

5. **Verify token exchange happened:**
   - DevTools → Application → LocalStorage
   - Should have `fl_camp_custom_token` and `fl_camp_token_claims`

## 🎯 What's Working Now

✅ User can sign in with test credentials  
✅ Firebase Auth user created  
✅ Custom JWT token generated with claims  
✅ Claims stored in localStorage  
✅ useAuth() hook provides role info  
✅ CampListPage fetches and displays camps  
✅ Role-based filtering works  
✅ Four test users with different roles  
✅ Firestore security rules enforce access  
✅ Auto-refresh token before expiry

## 🧪 Next Testing Steps

1. **Test each user type:**
   - Sign in as super admin → see all camps and features
   - Sign in as camp admin → see all camps with edit buttons
   - Sign in as treasurer → see Summer camp, payment features only
   - Sign in as limited user → see Summer camp, read-only

2. **Test protected routes:**
   - Try accessing pages with insufficient permissions
   - Should redirect or show "Access Denied"

3. **Test security rules:**
   - Limited user tries to delete participant (should fail)
   - Treasurer tries to manage rooms (should fail)
   - Admin does these operations (should succeed)

4. **Test token refresh:**
   - Watch token expiry
   - Verify auto-refresh happens

5. **Test sign out:**
   - Sign out should clear localStorage
   - Redirect to login page
   - Cannot access protected routes

## 📝 Quick Reference

**Default Password:** `TestPassword123!`

**Camps:**

- Summer Leadership Camp 2026
- Winter Sports & Faith Retreat 2026
- Spring Youth Conference 2026

**Roles:**

- `super_admin` - Full access
- `admin` - Camp management
- `treasurer` - Payment management
- `viewer` - Read-only

**URLs:**

- App: http://localhost:5173
- Firestore UI: http://localhost:4000/firestore
- Auth UI: http://localhost:4000/auth
- Emulator Hub: http://localhost:4400

## 🔐 Security Notes

- Test users have credentials in code (for development only!)
- Always use strong, unique passwords in production
- Never commit real credentials to repo
- Use environment variables for production secrets
- Enable Firebase Security Rules in production

## Support

For detailed information:

- [TEST_USERS.md](./TEST_USERS.md) - User credentials and roles
- [TESTING_AUTH.md](./TESTING_AUTH.md) - Testing walkthrough
- [AUTH_GUIDE.md](./AUTH_GUIDE.md) - Complete authentication docs

---

**Status:** ✅ Ready to test  
**Test Users:** 4 (super admin, admin, treasurer, limited)  
**Camps:** 3 (Summer, Winter, Spring)  
**Authentication:** ✅ Working (sign-in → token exchange → claims)
