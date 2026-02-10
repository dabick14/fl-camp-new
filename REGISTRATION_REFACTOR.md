# Registration Refactoring Summary

## Overview

Refactored public self-service registration from direct Firestore writes to secure server-side Cloud Function implementation with Paystack payment integration stub.

## Key Changes

### 1. Cloud Function: `registerParticipant`

**File:** `functions/src/index.ts` (lines 344-634)

**Features:**

- Server-side validation (camp exists, registration open, deadlines, max participants)
- Duplicate phone number check
- Participant creation with proper state machine initialization
- Paystack payment link generation (when configured)
- Optional reCAPTCHA v3 verification
- Audit logging
- Type-safe error handling

**Function Signature:**

```typescript
interface RegisterParticipantData {
  campSlug: string
  formData: {
    firstName: string
    lastName: string
    email?: string
    phone: string
    gender: 'male' | 'female' | 'other'
    emergencyContact?: { name?: string; phone?: string; relationship?: string }
    groupingValues: Record<string, string>
  }
  recaptchaToken?: string
}

interface RegisterParticipantResult {
  success: boolean
  participantId?: string
  campId?: string
  message?: string
  paymentLink?: string
  error?:
    | 'camp_not_found'
    | 'camp_closed'
    | 'registration_closed'
    | 'deadline_passed'
    | 'duplicate_phone'
    | 'max_reached'
    | 'invalid_recaptcha'
    | 'internal_error'
}
```

**Validation Flow:**

1. Validate required fields (firstName, lastName, phone)
2. Optional reCAPTCHA verification
3. Fetch camp by slug
4. Check registration is open and self-service enabled
5. Check deadline hasn't passed
6. Check for duplicate phone number
7. Check max participants limit
8. Create participant document in 'draft' state
9. Generate Paystack payment link (if configured)
10. Return result with participant ID and payment link

### 2. Frontend Service Updates

**File:** `src/services/registration.ts`

**Changes:**

- Removed direct Firestore write operations
- Added `httpsCallable` to invoke Cloud Function
- Updated return type to include `paymentLink` and error codes
- Improved error handling with specific error codes
- Removed client-side validation (now handled by server)

**New Implementation:**

```typescript
export async function registerParticipant(
  campSlug: string,
  formData: RegistrationFormData,
  recaptchaToken?: string,
): Promise<RegisterParticipantResult> {
  const functions = getFunctions()
  const registerFn = httpsCallable<...>(functions, 'registerParticipant')

  const result = await registerFn({ campSlug, formData, recaptchaToken })
  return result.data
}
```

### 3. Registration Page Updates

**File:** `src/features/registration/RegistrationPage.tsx`

**Changes:**

- Updated state to include `paymentLink`
- Added detailed error handling with user-friendly messages
- Error message mapping for all error codes
- Pass payment link to SuccessView

**Error Handling:**

```typescript
const errorMessages: Record<string, string> = {
  camp_not_found: 'Camp not found. Please check your link.',
  camp_closed: 'This camp is no longer accepting registrations.',
  registration_closed: 'Registration is currently closed for this camp.',
  deadline_passed: 'The registration deadline has passed.',
  duplicate_phone: 'This phone number is already registered for this camp.',
  max_reached: 'This camp is full. Registration is closed.',
  invalid_recaptcha: 'Security verification failed. Please try again.',
  internal_error: 'An unexpected error occurred. Please try again.',
}
```

### 4. Success View Updates

**File:** `src/features/registration/SuccessView.tsx`

**Changes:**

- Added `paymentLink` prop
- Redirect to Paystack payment page if link is available
- Fallback placeholder for manual payment setup

**Payment Handler:**

```typescript
const handlePayment = () => {
  if (paymentLink) {
    window.location.href = paymentLink // Redirect to Paystack
  } else {
    window.alert('Payment flow coming soon. This is a placeholder.')
  }
}
```

### 5. Firestore Security Rules

**File:** `firestore.rules`

**Critical Change:**

```diff
match /participants/{participantId} {
- allow create: if true;
+ allow create: if false; // Block direct writes - use Cloud Function
}
```

This ensures all participant creation goes through the validated Cloud Function, preventing:

- Invalid data
- Duplicate registrations
- Exceeding max participants
- Registration after deadlines
- Bot spam

### 6. Paystack Integration (Stub)

**File:** `functions/src/index.ts` (lines 607-634)

**Helper Function:**

```typescript
async function initializePaystackPayment(params: {
  email: string
  amount: number // in kobo (NGN * 100)
  reference: string
  currency: string
  metadata: Record<string, any>
}): Promise<string>
```

**Features:**

- Direct API call to Paystack initialization endpoint
- Generates unique reference: `{campId}_{participantId}_{timestamp}`
- Includes metadata for reconciliation
- Returns authorization URL for payment
- Basic KYC (name, phone, email) - no BVN required per user preference

**Configuration Required:**

```bash
firebase functions:secrets:set PAYSTACK_SECRET_KEY
```

### 7. Optional reCAPTCHA v3

**File:** `functions/src/index.ts` (lines 589-606)

**Features:**

- Verifies token with Google API
- Score threshold: 0.5 (configurable)
- Graceful fallback if not configured
- Prevents bot spam

**Configuration:**

```bash
firebase functions:secrets:set RECAPTCHA_SECRET
```

## Security Improvements

### Before (Direct Firestore Writes)

❌ Client-side validation only
❌ Can bypass max participants check
❌ Can create duplicate registrations
❌ Can register after deadline
❌ No rate limiting
❌ Exposed to bot spam

### After (Cloud Function)

✅ Server-side validation
✅ Atomic max participants check
✅ Duplicate prevention via server query
✅ Deadline enforcement
✅ Optional reCAPTCHA
✅ Audit logging
✅ Firestore rules block direct writes

## Type Safety

All interfaces and types are properly defined:

- `RegisterParticipantData` - Function input
- `RegisterParticipantResult` - Function output
- `RegistrationFormData` - Frontend form data
- Error codes as union type for autocomplete

## Testing

### Local Testing (Emulators)

```bash
npm run emulators
```

Access registration at:

```
http://localhost:5173/register/summer-leadership-2026
```

### Production Deployment

```bash
firebase deploy --only functions:registerParticipant
firebase deploy --only firestore:rules
```

## Cost Considerations

**Cloud Functions Pricing:**

- Free tier: 2M invocations/month
- Expected usage: ~500 registrations/month = well within free tier
- Cost: $0/month for typical camp usage

**Paystack Fees:**

- 1.5% + NGN 100 per transaction (capped at NGN 2,000)
- Example: NGN 50,000 payment = NGN 750 fee
- Fees can be absorbed or passed to participant

## Next Steps

1. **Deploy to Production:**

   ```bash
   firebase deploy --only functions,firestore:rules
   ```

2. **Configure Paystack:**
   - Get secret key from Paystack dashboard
   - Set environment variable
   - Test with test mode keys first

3. **Implement Webhook Handler:**
   - Create `paystackWebhook` function
   - Update participant payment status on success
   - Handle failed payments

4. **Add Email Notifications:**
   - Registration confirmation
   - Payment receipt
   - Camp updates

5. **Implement Rate Limiting:**
   - Prevent abuse of registration endpoint
   - Use Firebase App Check or custom solution

6. **Add Monitoring:**
   - Set up alerts for function errors
   - Monitor registration success rate
   - Track payment completion rate

## Files Changed

- ✅ `functions/src/index.ts` - Added registerParticipant function
- ✅ `src/services/registration.ts` - Updated to call Cloud Function
- ✅ `src/features/registration/RegistrationPage.tsx` - Enhanced error handling
- ✅ `src/features/registration/SuccessView.tsx` - Added payment link support
- ✅ `firestore.rules` - Blocked direct participant creation
- ✅ `DEPLOYMENT.md` - Added deployment guide

## Testing Checklist

- [ ] Test registration with valid data
- [ ] Test duplicate phone number prevention
- [ ] Test max participants limit
- [ ] Test deadline enforcement
- [ ] Test Paystack payment link generation
- [ ] Test error handling for each error code
- [ ] Test reCAPTCHA verification (if enabled)
- [ ] Verify Firestore rules block direct writes
- [ ] Check audit logs are created
- [ ] Test payment redirect (with test mode)
