# GoHighLevel OAuth 2.0 Setup Guide

This guide explains how to set up OAuth 2.0 authentication for the PFC Ticketing System with GoHighLevel.

## Why OAuth?

OAuth 2.0 provides:
- ✅ **Better Security**: Tokens expire and can be refreshed automatically
- ✅ **User-specific Access**: Each user authorizes their own account
- ✅ **Granular Permissions**: Request only the scopes you need
- ✅ **Multi-location Support**: Users can choose which location to authorize

## Current Authentication Status

The system supports **two authentication methods**:

1. **OAuth 2.0** (Recommended) - Secure, token-based authentication
2. **API Key** (Fallback) - Legacy method using static keys

If OAuth is not configured, the system automatically falls back to API key authentication.

## Setting Up OAuth

### Step 1: Create a GoHighLevel App

1. Go to [GoHighLevel Marketplace](https://marketplace.gohighlevel.com/apps)
2. Click **"Create App"** or select an existing app
3. Configure your app settings:
   - **App Name**: PFC Ticketing System
   - **App Description**: Job request tracking and management
   - **Redirect URI**: `https://pfc-ticketing.replit.app/oauth/callback`

### Step 2: Get Your OAuth Credentials

From your app's settings page, copy:
- **Client ID** (e.g., `65f3a1b2c4d5e6f7g8h9i0j1`)
- **Client Secret** (e.g., `a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6`)

### Step 3: Configure Environment Variables

Update your `.env` file with the OAuth credentials:

```env
# GoHighLevel OAuth Credentials
GHL_CLIENT_ID=your-actual-client-id
GHL_CLIENT_SECRET=your-actual-client-secret
GHL_REDIRECT_URI=https://pfc-ticketing.replit.app/oauth/callback
```

### Step 4: Restart the Server

After updating the `.env` file, restart your server:

```bash
npm restart
```

### Step 5: Authorize the App

1. Visit: `https://pfc-ticketing.replit.app/oauth/auth/ghl`
2. You'll be redirected to GoHighLevel to choose a location
3. Select the location you want to authorize
4. Click **"Authorize"**
5. You'll be redirected back with a success message

### Step 6: Verify Authorization

Check the OAuth status:

```bash
curl https://pfc-ticketing.replit.app/oauth/status
```

You should see:
```json
{
  "authMethod": "oauth",
  "authorized": true,
  "oauthAuthorized": true,
  "locationId": "your-location-id",
  "expiresAt": "2024-11-23T10:00:00.000Z",
  "hasRefreshToken": true
}
```

## Testing OAuth

Test the integration with:

```bash
# Test GHL connection
curl https://pfc-ticketing.replit.app/test/ghl

# Test creating an opportunity
curl https://pfc-ticketing.replit.app/test/create-opportunity
```

## Required OAuth Scopes

The app requests the following scopes:

- `contacts.readonly` - Read contact information
- `contacts.write` - Create and update contacts
- `opportunities.readonly` - Read opportunities (tickets)
- `opportunities.write` - Create and update opportunities
- `conversations/reports.readonly` - Read conversation reports
- `conversations/livechat.write` - Send messages via livechat

## Token Management

### Automatic Token Refresh

The system automatically refreshes OAuth tokens:
- Tokens are checked on every API request
- If a token expires within 5 minutes, it's automatically refreshed
- Refresh happens transparently without user intervention

### Token Storage

**⚠️ Important**: Currently, tokens are stored **in memory**. This means:
- Tokens are lost when the server restarts
- You'll need to re-authorize after each restart
- For production, implement persistent storage (database, Redis, etc.)

### Implementing Persistent Storage (Recommended)

To persist tokens across restarts, you can:

1. **Use a Database** (PostgreSQL, MongoDB, etc.)
   ```javascript
   // Store tokens in database after OAuth callback
   await db.tokens.upsert({
     locationId: locationId,
     accessToken: access_token,
     refreshToken: refresh_token,
     expiresAt: new Date(Date.now() + expires_in * 1000)
   });
   ```

2. **Use Redis** (Fast, in-memory cache)
   ```javascript
   await redis.setex(
     `oauth:${locationId}`,
     expires_in,
     JSON.stringify({ accessToken, refreshToken })
   );
   ```

3. **Use Environment Variables** (Simple, but less secure)
   ```env
   GHL_ACCESS_TOKEN=your-access-token
   GHL_REFRESH_TOKEN=your-refresh-token
   ```

## API Key Fallback

If OAuth is not configured, the system uses API key authentication:

```env
GHL_API_KEY=pit-your-api-key-here
GHL_LOCATION_ID=your-location-id
```

**Note**: API keys are being deprecated by GoHighLevel in favor of OAuth.

## Troubleshooting

### Error: "OAuth credentials not configured"

**Solution**: Update `.env` with valid `GHL_CLIENT_ID` and `GHL_CLIENT_SECRET`

### Error: "No access token available"

**Solution**: Complete the OAuth flow by visiting `/oauth/auth/ghl`

### Error: "401 Unauthorized"

**Possible causes**:
1. OAuth not completed - visit `/oauth/auth/ghl`
2. Server restarted and lost tokens - re-authorize
3. Token expired and refresh failed - re-authorize

**Solution**: Check `/oauth/status` and re-authorize if needed

### Error: "Redirect URI mismatch"

**Solution**: Ensure `GHL_REDIRECT_URI` matches exactly in:
1. Your `.env` file
2. Your GoHighLevel app settings

### Tokens Lost After Restart

**Cause**: Tokens are stored in memory
**Solution**: Implement persistent storage (see above)

## Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use HTTPS** for all OAuth redirects
3. ✅ **Rotate secrets** regularly
4. ✅ **Implement token encryption** if storing in database
5. ✅ **Log OAuth events** for audit trails
6. ✅ **Validate redirect URIs** strictly

## Migration from API Key to OAuth

If you're currently using API key authentication:

1. Keep `GHL_API_KEY` in `.env` during migration (for fallback)
2. Add OAuth credentials to `.env`
3. Restart server
4. Complete OAuth flow at `/oauth/auth/ghl`
5. Verify OAuth is working with `/oauth/status`
6. (Optional) Remove `GHL_API_KEY` once OAuth is stable

## API Reference

### OAuth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/oauth/auth/ghl` | GET | Start OAuth flow |
| `/oauth/callback` | GET | OAuth callback (automatic) |
| `/oauth/status` | GET | Check auth status |

### Example Responses

#### `/oauth/status` - Not Authorized

```json
{
  "authMethod": "api_key_fallback",
  "authorized": true,
  "oauthConfigured": false,
  "oauthAuthorized": false,
  "message": "Using API key authentication (OAuth not configured)",
  "apiKeyAvailable": true
}
```

#### `/oauth/status` - OAuth Authorized

```json
{
  "authMethod": "oauth",
  "authorized": true,
  "oauthAuthorized": true,
  "locationId": "7p8fgVVr84S9fxsJqMdA",
  "companyId": "abc123",
  "userType": "account",
  "expiresAt": "2024-11-23T10:00:00.000Z",
  "isExpired": false,
  "hasRefreshToken": true,
  "apiKeyAvailable": true
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the server logs for detailed error messages
3. Verify your GoHighLevel app configuration
4. Ensure all environment variables are set correctly

## References

- [GoHighLevel OAuth Documentation](https://highlevel.stoplight.io/docs/integrations/00d0c0ecaa369-overview)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [GoHighLevel Marketplace](https://marketplace.gohighlevel.com/)
