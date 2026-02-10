# Testing Different User Roles

Now that you have a logout button, you can easily test each user role. Here's how:

## Quick Test Cycle

### 1. Sign In as Super Admin

- **Email:** `superadmin@flcamp.com`
- **Password:** `TestPassword123!`
- **What to look for:**
  - Badge shows "Super Admin" in header
  - See all 3 camps (Summer, Winter, Spring)
  - Each camp shows "admin" role badge
  - All admin features available

### 2. Sign Out

- Click "Sign Out" button in top-right header
- Should redirect to login page

### 3. Sign In as Camp Admin

- **Email:** `admin@flcamp.com`
- **Password:** `TestPassword123!`
- **What to look for:**
  - Header shows user email: admin@flcamp.com
  - See all 3 camps with "admin" badges
  - Admin features visible (edit buttons, etc.)

### 4. Sign Out & Test Treasurer

- **Email:** `treasurer@flcamp.com`
- **Password:** `TestPassword123!`
- **What to look for:**
  - Header shows "1 camp role(s)" (Summer only)
  - See only Summer camp
  - Limited to payment features
  - Edit buttons not visible

### 5. Sign Out & Test Limited User

- **Email:** `limited@flcamp.com`
- **Password:** `TestPassword123!`
- **What to look for:**
  - Header shows "1 camp role(s)"
  - See only Summer camp
  - Very limited/read-only access
  - Most UI controls hidden

## What the Header Shows

The `AppHeader` component displays:

- **User Email:** Your current email address
- **Super Admin Badge:** Shows only for super_admin role
- **Camp Roles Count:** "1 camp role(s)" for treasurer/limited user
- **Sign Out Button:** Logs you out and redirects to login

## How Logout Works

1. Click "Sign Out" button
2. `useAuth().signOut()` is called
3. Firebase Auth clears user session
4. localStorage is cleared (tokens deleted)
5. You're redirected to `/login` page
6. Next sign-in starts fresh with new token exchange

## Testing Tips

- **Fast Role Switching:** Sign out → change user → sign in
- **Token Verification:** After each sign-in, check DevTools → LocalStorage for new token
- **UI Changes:** Notice how some buttons appear/disappear based on role
- **Camp Filtering:** Treasurer/limited user see fewer camps

## Code Location

- **Header Component:** `src/components/AppHeader.tsx`
- **Camp List Page:** `src/features/camps/CampListPage.tsx` (now uses AppHeader)
- **Auth Hook:** `src/hooks/useAuth.ts` (provides role info and signOut)

---

**Now you're ready to test the full authentication flow!**
