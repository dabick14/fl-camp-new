# Super Admin Access Fix

## Problem

Super admin was seeing "No camps available" message even though they should see all camps.

## Root Cause

The Cloud Functions token exchange was looking up users by Firebase Auth UID, but our Firestore user documents were created with custom IDs (e.g., `user-super-admin-001`). When users sign in, Firebase creates a different UID that doesn't match our document IDs.

## Solution

Updated Cloud Functions to:

1. First try looking up user by Firebase Auth UID
2. If not found, search Firestore for user by email address
3. Return globalRoles and other claims from the matched user document

This allows the token exchange to find the correct user document regardless of ID mismatch.

## What to Do Now

1. **Sign out** from the app (if logged in)
2. **Refresh the page** to clear any cached state
3. **Sign back in** as `superadmin@flcamp.com` with password `TestPassword123!`
4. You should now see all 3 camps!

## Technical Changes

### Changed Files

- `functions/src/index.ts` - Updated `exchangeToken` and `refreshToken` functions

### Key Changes

- Added email-based user lookup as fallback
- Both functions now support finding users by email if UID lookup fails
- All other logic remains the same

## Testing

After signing in as super admin:

- ✅ Should see 3 camps (Summer, Winter, Spring)
- ✅ Each camp should show "admin" or empty badge
- ✅ Debug info should show: `isSuperAdmin=true, camps=3, accessible=3`
- ✅ Header should show "Super Admin" badge

## Other Users

The fix also applies to all other users (admin, treasurer, limited), so they should all see their correct camps now.

---

No code changes needed on your end - just sign out and sign back in!
