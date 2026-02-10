# Deployment Guide - FL Camp App

## Cloud Functions Deployment

### Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Project initialized (`firebase init` already done)

### Environment Configuration

Before deploying, configure environment secrets for production:

```bash
# Set JWT secret (for custom token generation)
firebase functions:secrets:set JWT_SECRET

# Set Paystack secret key (for payment processing)
firebase functions:secrets:set PAYSTACK_SECRET_KEY

# Optional: Set reCAPTCHA secret (for bot prevention)
firebase functions:secrets:set RECAPTCHA_SECRET
```

Or use environment config (legacy method):

```bash
firebase functions:config:set \
  jwt.secret="your-jwt-secret-key-here" \
  paystack.secret="your-paystack-secret-key" \
  recaptcha.secret="your-recaptcha-secret"
```

### Deploy Functions

Deploy all functions:

```bash
firebase deploy --only functions
```

Deploy specific function:

```bash
firebase deploy --only functions:registerParticipant
firebase deploy --only functions:exchangeToken
firebase deploy --only functions:grantRole
```

### Deploy Firestore Rules

After updating security rules, deploy them:

```bash
firebase deploy --only firestore:rules
```

### Full Deployment

Deploy everything (hosting, functions, rules):

```bash
firebase deploy
```

## Local Development with Emulators

Run functions locally with emulators:

```bash
# In the root directory
npm run emulators

# Or explicitly
firebase emulators:start
```

The emulators will start:

- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099
- Emulator UI: http://localhost:4400

## Testing the Registration Function

You can test the `registerParticipant` function from the frontend or using curl:

```bash
# Using curl (after getting a Firebase ID token)
curl -X POST \
  https://us-central1-fl-camp-app.cloudfunctions.net/registerParticipant \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "campSlug": "summer-leadership-2026",
      "formData": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "08012345678",
        "gender": "male",
        "groupingValues": {
          "ageGroup": "13-15"
        }
      }
    }
  }'
```

## Paystack Integration Setup

1. Create a Paystack account: https://paystack.com
2. Get your Secret Key from Settings > API Keys & Webhooks
3. Set the secret in Firebase:
   ```bash
   firebase functions:secrets:set PAYSTACK_SECRET_KEY
   ```
4. Configure webhook URL in Paystack dashboard:
   - URL: `https://us-central1-fl-camp-app.cloudfunctions.net/paystackWebhook` (to be implemented)
   - Events: `charge.success`, `charge.failed`

## reCAPTCHA v3 Setup (Optional)

1. Register your site: https://www.google.com/recaptcha/admin
2. Choose reCAPTCHA v3
3. Get your Site Key and Secret Key
4. Add Site Key to frontend `.env`:
   ```
   VITE_RECAPTCHA_SITE_KEY=your-site-key
   ```
5. Set Secret in Firebase:
   ```bash
   firebase functions:secrets:set RECAPTCHA_SECRET
   ```

## Monitoring & Logs

View function logs:

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only registerParticipant

# Follow logs in real-time
firebase functions:log --follow
```

View logs in Firebase Console:

- https://console.firebase.google.com/project/fl-camp-app/functions/logs

## Troubleshooting

### Function deployment fails

- Check Node.js version matches `engines.node` in `functions/package.json`
- Run `npm install` in `functions/` directory
- Check for TypeScript errors: `cd functions && npm run build`

### Function times out

- Increase timeout in function config (default is 60s)
- Check for long-running operations or infinite loops

### Permission denied errors

- Verify Firestore rules are deployed
- Check that function has proper IAM permissions
- For Admin SDK operations, ensure service account has Firestore access

## Cost Optimization

- Functions are billed per invocation and compute time
- Free tier: 2M invocations/month, 400K GB-seconds/month
- Use Cloud Scheduler for cleanup tasks instead of always-on listeners
- Set appropriate timeout limits
- Consider caching frequently accessed data

## Security Best Practices

✅ Environment secrets stored in Firebase Secret Manager
✅ Firestore rules block direct participant writes
✅ Input validation in Cloud Functions
✅ reCAPTCHA for bot prevention
✅ Audit logging for all registrations
✅ Rate limiting (TODO: implement)

## Next Steps

- [ ] Implement Paystack webhook handler for payment confirmation
- [ ] Add rate limiting to registration endpoint
- [ ] Set up monitoring alerts for function errors
- [ ] Implement email notifications (SendGrid/Firebase Extensions)
- [ ] Add participant QR code generation
- [ ] Create admin dashboard for monitoring registrations
