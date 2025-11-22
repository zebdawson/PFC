const express = require('express');
const axios = require('axios');
const router = express.Router();
const logger = require('../utils/logger');

const CLIENT_ID = process.env.GHL_CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GHL_REDIRECT_URI || 'https://pfc-ticketing.replit.app/oauth/callback';

// Store for access tokens (in production, use a database)
let accessTokenStore = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  locationId: null
};

/**
 * Step 1: Initiate OAuth flow
 * Redirect user to GHL authorization page
 */
router.get('/auth/ghl', (req, res) => {
  // Check if OAuth credentials are configured
  if (!CLIENT_ID || !CLIENT_SECRET || CLIENT_ID === 'your-client-id-here') {
    logger.warn('OAuth credentials not configured');
    return res.status(400).send(`
      <html>
        <head><title>OAuth Not Configured</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
          <h1 style="color: #f44336;">⚠️ OAuth Not Configured</h1>
          <p>The GoHighLevel OAuth credentials are not configured in your environment variables.</p>

          <h2>To set up OAuth:</h2>
          <ol>
            <li>Go to <a href="https://marketplace.gohighlevel.com/apps" target="_blank">GoHighLevel Marketplace</a></li>
            <li>Create or select your app</li>
            <li>Copy your Client ID and Client Secret</li>
            <li>Update your .env file with:
              <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 10px 0;">
GHL_CLIENT_ID=your-client-id-here
GHL_CLIENT_SECRET=your-client-secret-here
GHL_REDIRECT_URI=${REDIRECT_URI}
              </pre>
            </li>
            <li>Restart the server</li>
          </ol>

          <h2>Alternative: Using API Key</h2>
          <p>If you prefer to use API key authentication (legacy method), the system will automatically fall back to using GHL_API_KEY if OAuth is not configured.</p>

          <p style="margin-top: 30px;">
            <a href="/" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">← Back to Home</a>
          </p>
        </body>
      </html>
    `);
  }

  const scopes = [
    'contacts.readonly',
    'contacts.write',
    'opportunities.readonly',
    'opportunities.write',
    'conversations/reports.readonly',
    'conversations/livechat.write'
  ].join(' ');

  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `client_id=${CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}`;

  logger.info('Redirecting to GHL authorization', { authUrl });
  res.redirect(authUrl);
});

/**
 * Step 2: OAuth callback
 * Exchange authorization code for access token
 */
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    logger.error('No authorization code received');
    return res.status(400).json({ error: 'No authorization code received' });
  }

  try {
    logger.info('Exchanging authorization code for access token');

    // Encode data as x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const {
      access_token,
      refresh_token,
      expires_in,
      locationId,
      companyId,
      userType
    } = response.data;

    // Store tokens
    accessTokenStore = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000),
      locationId: locationId,
      companyId: companyId,
      userType: userType
    };

    logger.info('OAuth authorization successful', {
      locationId,
      companyId,
      userType,
      expiresIn: expires_in
    });

    res.send(`
      <html>
        <head><title>Authorization Successful</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1 style="color: #4CAF50;">✓ Authorization Successful!</h1>
          <p>PFC Ticketing System is now connected to GoHighLevel.</p>
          <p><strong>Location ID:</strong> ${locationId}</p>
          <p><strong>User Type:</strong> ${userType}</p>
          <p>You can close this window and test the integration.</p>
          <hr style="margin: 30px 0;">
          <p><a href="/test/create-opportunity" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Test Integration</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('OAuth token exchange failed', {
      error: error.message,
      response: error.response?.data
    });

    res.status(500).json({
      error: 'Failed to exchange authorization code',
      details: error.response?.data
    });
  }
});

/**
 * Get current access token (with automatic refresh if needed)
 */
async function getAccessToken() {
  // Check if token exists
  if (!accessTokenStore.accessToken) {
    throw new Error('No access token available. Please authorize the app at /oauth/auth/ghl');
  }

  // Check if token is expired (refresh 5 minutes before expiry)
  const isExpired = accessTokenStore.expiresAt && (Date.now() > accessTokenStore.expiresAt - 300000);

  if (isExpired && accessTokenStore.refreshToken) {
    logger.info('Access token expired, refreshing...');
    await refreshAccessToken();
  }

  return accessTokenStore.accessToken;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
  try {
    // Encode data as x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', accessTokenStore.refreshToken);

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    accessTokenStore.accessToken = access_token;
    accessTokenStore.refreshToken = refresh_token || accessTokenStore.refreshToken;
    accessTokenStore.expiresAt = Date.now() + (expires_in * 1000);

    logger.info('Access token refreshed successfully');
  } catch (error) {
    logger.error('Failed to refresh access token', {
      error: error.message,
      response: error.response?.data
    });
    throw error;
  }
}

/**
 * Get current authorization status
 */
router.get('/status', (req, res) => {
  const hasApiKey = !!process.env.GHL_API_KEY;
  const hasOAuthConfig = !!(CLIENT_ID && CLIENT_SECRET && CLIENT_ID !== 'your-client-id-here');

  if (!accessTokenStore.accessToken) {
    return res.json({
      authMethod: hasApiKey ? 'api_key_fallback' : 'none',
      authorized: hasApiKey,
      oauthConfigured: hasOAuthConfig,
      oauthAuthorized: false,
      message: hasOAuthConfig
        ? 'OAuth configured but not authorized. Visit /oauth/auth/ghl to authorize.'
        : hasApiKey
          ? 'Using API key authentication (OAuth not configured)'
          : 'No authentication configured. Set up OAuth or API key.',
      apiKeyAvailable: hasApiKey
    });
  }

  const isExpired = accessTokenStore.expiresAt && (Date.now() > accessTokenStore.expiresAt);

  res.json({
    authMethod: 'oauth',
    authorized: true,
    oauthAuthorized: true,
    locationId: accessTokenStore.locationId,
    companyId: accessTokenStore.companyId,
    userType: accessTokenStore.userType,
    expiresAt: new Date(accessTokenStore.expiresAt).toISOString(),
    isExpired: isExpired,
    hasRefreshToken: !!accessTokenStore.refreshToken,
    apiKeyAvailable: hasApiKey
  });
});

module.exports = {
  router,
  getAccessToken,
  getLocationId: () => accessTokenStore.locationId
};
