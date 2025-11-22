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

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI
    }, {
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
    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: accessTokenStore.refreshToken
    }, {
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
  if (!accessTokenStore.accessToken) {
    return res.json({
      authorized: false,
      message: 'Not authorized. Visit /oauth/auth/ghl to authorize.'
    });
  }

  const isExpired = accessTokenStore.expiresAt && (Date.now() > accessTokenStore.expiresAt);

  res.json({
    authorized: true,
    locationId: accessTokenStore.locationId,
    companyId: accessTokenStore.companyId,
    userType: accessTokenStore.userType,
    expiresAt: new Date(accessTokenStore.expiresAt).toISOString(),
    isExpired: isExpired,
    hasRefreshToken: !!accessTokenStore.refreshToken
  });
});

module.exports = {
  router,
  getAccessToken,
  getLocationId: () => accessTokenStore.locationId
};
