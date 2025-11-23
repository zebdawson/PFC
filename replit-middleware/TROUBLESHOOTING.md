# Troubleshooting Guide - GHL OAuth Authentication Issues

## Quick Diagnostic

**First, run the diagnostic script:**

```bash
cd replit-middleware
node diagnose-auth.js
```

This will automatically detect and report any configuration issues.

---

## Common Error: "The token does not have access to this location" (403)

### What This Means

This error occurs when your OAuth token is trying to access resources (like pipelines) that belong to a **different GoHighLevel location** than the one you authorized.

### Root Cause

GoHighLevel OAuth tokens are **location-specific**. When you authorize OAuth:
1. You select a specific GHL location
2. The token can ONLY access resources in that location
3. If you try to access a pipeline/contact/opportunity from a different location → 403 error

### How to Fix

#### Step 1: Verify Your OAuth Location

```bash
curl http://localhost:3000/oauth/status
```

Look for the `locationId` field. This is the location your OAuth token is authorized for.

#### Step 2: Verify Your Pipeline Configuration

Check your `.env` file:

```env
GHL_LOCATION_ID=7p8fgVVr84S9fxsJqMdA
PFC_PIPELINE_ID=EMd01MWjFA2f1qEuPwWU
```

#### Step 3: Check If Pipeline Belongs to Your Location

```bash
curl http://localhost:3000/test/pipelines
```

This returns all pipelines for your authorized location. **Verify that `PFC_PIPELINE_ID` appears in this list.**

#### Step 4: Fix the Mismatch

**If your pipeline ID is NOT in the list:**

1. Update `.env` with a pipeline ID from the list:
   ```env
   PFC_PIPELINE_ID=<correct-pipeline-id-from-list>
   PFC_DEFAULT_STAGE=<stage-id-from-that-pipeline>
   ```

2. Restart your server:
   ```bash
   npm restart
   ```

3. Test again:
   ```bash
   curl http://localhost:3000/test/create-opportunity
   ```

---

## Common Error: "OAuth credentials not configured"

### What This Means

Your OAuth Client ID and Secret are not properly set in the `.env` file.

### How to Fix

1. Go to [GoHighLevel Marketplace](https://marketplace.gohighlevel.com/apps)
2. Create or select your app
3. Copy your **Client ID** and **Client Secret**
4. Update `.env`:
   ```env
   GHL_CLIENT_ID=your-actual-client-id
   GHL_CLIENT_SECRET=your-actual-client-secret
   GHL_REDIRECT_URI=https://your-app.replit.app/oauth/callback
   ```
5. Restart the server

---

## Common Error: "No access token available"

### What This Means

You have OAuth configured but haven't completed the authorization flow yet.

### How to Fix

1. Start your server:
   ```bash
   npm start
   ```

2. Visit the OAuth authorization URL:
   ```
   http://localhost:3000/oauth/auth/ghl
   ```

3. Select your GHL location and authorize

4. You should see "Authorization Successful!"

5. Verify:
   ```bash
   curl http://localhost:3000/oauth/status
   ```

---

## OAuth Scopes Issue

### Symptoms

- Can create contacts but not opportunities
- Can read but not write
- 403 errors on specific endpoints

### Fix

**We've updated the OAuth scopes in this fix.** To apply:

1. The scopes have been updated in `src/routes/oauth.js`
2. You need to **re-authorize** OAuth with the new scopes:

```bash
# Visit this URL to re-authorize:
http://localhost:3000/oauth/auth/ghl
```

**New scopes include:**
- `contacts.readonly` / `contacts.write`
- `opportunities.readonly` / `opportunities.write` (includes pipeline access)
- `conversations.readonly` / `conversations.write`
- `locations.readonly` ← New!

---

## Environment Variables Not Loading

### Symptoms

- You updated `.env` but changes aren't reflected
- Server still uses old pipeline IDs

### Fix

**After updating `.env`, you MUST restart the server:**

```bash
# Stop the server (Ctrl+C)
npm start
```

Environment variables are loaded once when the server starts. Changes to `.env` require a restart.

---

## Multiple Locations / Wrong Location

### Symptoms

- OAuth shows a different location than expected
- Pipelines list doesn't match what you see in GHL

### Fix

If you need to authorize a different location:

1. Visit the OAuth authorization URL again:
   ```
   http://localhost:3000/oauth/auth/ghl
   ```

2. **Select the correct location** this time

3. Complete authorization

4. Update `.env` with the new location ID:
   ```env
   GHL_LOCATION_ID=<new-location-id>
   ```

5. Fetch pipelines for this new location:
   ```bash
   node src/get-pipeline-info-oauth.js
   ```

6. Update `PFC_PIPELINE_ID` and `PFC_DEFAULT_STAGE` with values from the new location

---

## Token Expired

### Symptoms

- Was working, now getting 401 errors
- OAuth status shows `isExpired: true`

### Fix

The system should automatically refresh tokens, but if it fails:

1. Check OAuth status:
   ```bash
   curl http://localhost:3000/oauth/status
   ```

2. If expired and no refresh token, re-authorize:
   ```
   http://localhost:3000/oauth/auth/ghl
   ```

3. If you keep getting expiration issues, check that `GHL_CLIENT_SECRET` is correct

---

## API Key vs OAuth Confusion

### What's the Difference?

| Feature | API Key | OAuth |
|---------|---------|-------|
| Secure? | ⚠️ Less secure | ✅ More secure |
| Expires? | ❌ No | ✅ Yes (auto-refresh) |
| User-specific? | ❌ No | ✅ Yes |
| Location choice? | ❌ No | ✅ Yes |
| Recommended? | ❌ Legacy | ✅ Yes |

### Current Setup

The system supports **both** with automatic fallback:

1. **First**: Try OAuth (if configured and authorized)
2. **Fallback**: Use API key (if OAuth fails)

### To Use OAuth Only

Remove or comment out `GHL_API_KEY` from `.env`:

```env
# GHL_API_KEY=pit-your-key-here  # Commented out - using OAuth only
```

---

## Diagnostic Commands Cheat Sheet

```bash
# Check if server is running
curl http://localhost:3000/health

# Check OAuth status
curl http://localhost:3000/oauth/status

# Get available pipelines
curl http://localhost:3000/test/pipelines

# Test creating opportunity
curl http://localhost:3000/test/create-opportunity

# Run full diagnostic
node diagnose-auth.js

# Fetch pipeline info (detailed)
node src/get-pipeline-info-oauth.js
```

---

## The Fixes Applied

### 1. **Updated OAuth Scopes** (`src/routes/oauth.js`)
   - Added `locations.readonly`
   - Fixed conversation scopes
   - Note: Pipeline access is included in `opportunities.readonly` scope

   **Action Required:** Re-authorize OAuth to apply new scopes

### 2. **Enhanced Error Messages** (`src/services/ghlClient.js`)
   - 403 errors now provide clear location/pipeline mismatch details
   - Suggests running diagnostic script
   - Shows which location and pipeline are in conflict

### 3. **Diagnostic Script** (`diagnose-auth.js`)
   - Checks OAuth status
   - Fetches available pipelines
   - Compares with `.env` configuration
   - Identifies mismatches
   - Provides fix recommendations

---

## Step-by-Step Resolution for Your Specific Error

Based on your error:
```json
{
  "error": "Request failed with status code 403",
  "message": "The token does not have access to this location.",
  "pipelineId": "oE36ZIt1Ow9UVkuGz2GN"
}
```

### Resolution Steps:

1. **Run the diagnostic:**
   ```bash
   cd replit-middleware
   node diagnose-auth.js
   ```

2. **Re-authorize OAuth with new scopes:**
   ```bash
   # Start server if not running
   npm start

   # Visit (in browser):
   http://localhost:3000/oauth/auth/ghl
   ```

3. **Get correct pipeline IDs:**
   ```bash
   node src/get-pipeline-info-oauth.js
   ```

4. **Update `.env` with correct values:**
   ```env
   # Use the location ID from OAuth status
   GHL_LOCATION_ID=7p8fgVVr84S9fxsJqMdA

   # Use a pipeline ID from the list above
   PFC_PIPELINE_ID=EMd01MWjFA2f1qEuPwWU

   # Use a stage ID from that pipeline
   PFC_DEFAULT_STAGE=0e17f21a-e08a-4d05-8467-a02bccb2303c
   ```

5. **Restart server:**
   ```bash
   npm restart
   ```

6. **Test:**
   ```bash
   curl http://localhost:3000/test/create-opportunity
   ```

   Should return:
   ```json
   {
     "success": true,
     "message": "Opportunity created successfully!"
   }
   ```

---

## Still Having Issues?

1. ✅ Run the diagnostic script: `node diagnose-auth.js`
2. ✅ Check server logs for detailed error messages
3. ✅ Verify all environment variables are set
4. ✅ Ensure server was restarted after `.env` changes
5. ✅ Confirm OAuth is authorized for the correct location

If problems persist, check:
- GHL app configuration at https://marketplace.gohighlevel.com/apps
- Redirect URI matches exactly in both `.env` and GHL app settings
- You have the necessary permissions in your GHL account
