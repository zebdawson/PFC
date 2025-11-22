require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');

const webhookRoutes = require('./routes/webhooks');
const { router: oauthRouter, getAccessToken, getLocationId } = require('./routes/oauth');
const ghlClient = require('./services/ghlClient');

// Configure GHL Client to use OAuth tokens
ghlClient.setOAuthFunctions(getAccessToken, getLocationId);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/', async (req, res) => {
  // Get authentication status
  let authStatus = 'unknown';
  let authMethod = 'none';
  const hasOAuthConfig = !!(process.env.GHL_CLIENT_ID &&
                           process.env.GHL_CLIENT_SECRET &&
                           process.env.GHL_CLIENT_ID !== 'your-client-id-here');
  const hasApiKey = !!process.env.GHL_API_KEY;

  try {
    const locationId = getLocationId();
    const token = await getAccessToken();
    if (token) {
      authStatus = 'oauth_active';
      authMethod = 'OAuth 2.0';
    }
  } catch (error) {
    if (hasApiKey) {
      authStatus = 'api_key_fallback';
      authMethod = 'API Key (Fallback)';
    } else {
      authStatus = 'not_configured';
      authMethod = 'Not Configured';
    }
  }

  res.json({
    service: 'PFC Ticketing Middleware',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    authentication: {
      status: authStatus,
      method: authMethod,
      oauthConfigured: hasOAuthConfig,
      apiKeyAvailable: hasApiKey
    },
    endpoints: {
      webhooks: '/webhook/*',
      health: '/health',
      oauth: '/oauth/*',
      test: '/test/*'
    },
    documentation: {
      oauthSetup: 'OAUTH_SETUP.md',
      readme: 'README.md'
    }
  });
});

// Mount OAuth routes
app.use('/oauth', oauthRouter);

// Mount webhook routes
app.use('/webhook', webhookRoutes);

// Global health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      ghlConfigured: !!process.env.GHL_API_KEY,
      claudeConfigured: !!process.env.ANTHROPIC_API_KEY
    }
  });
});

// Test GHL connection and optionally fetch pipelines
app.get('/test/ghl', async (req, res) => {
  try {
    const ghlClient = require('./services/ghlClient');
    const axios = require('axios');
    const fetchPipelines = req.query.pipelines === 'true';

    const result = await ghlClient.testConnection();

    const response = {
      success: true,
      message: 'GHL connection successful',
      location: result.location
    };

    // If pipelines=true query param, also fetch pipelines
    if (fetchPipelines) {
      try {
        const token = await getAccessToken();
        const locationId = getLocationId();

        const pipelinesRes = await axios.get('https://services.leadconnectorhq.com/opportunities/pipelines', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Version': '2021-07-28'
          },
          params: {
            locationId: locationId
          }
        });

        response.pipelines = pipelinesRes.data.pipelines;
        response.locationId = locationId;
      } catch (pipelineError) {
        response.pipelineError = {
          message: pipelineError.message,
          details: pipelineError.response?.data
        };
      }
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to list available pipelines
app.get('/test/pipelines', async (req, res) => {
  try {
    const ghlClient = require('./services/ghlClient');
    const axios = require('axios');

    // Get access token
    const token = await getAccessToken();
    const locationId = getLocationId();

    logger.info('Fetching pipelines for location', { locationId });

    // Fetch all pipelines for this location
    const response = await axios.get(`https://services.leadconnectorhq.com/opportunities/pipelines`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28'
      },
      params: {
        locationId: locationId
      }
    });

    res.json({
      success: true,
      locationId: locationId,
      pipelines: response.data.pipelines
    });
  } catch (error) {
    logger.error('Failed to fetch pipelines', {
      error: error.message,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Test creating a minimal opportunity to diagnose 400 errors
app.get('/test/create-opportunity', async (req, res) => {
  try {
    const ghlClient = require('./services/ghlClient');

    // First, create a test contact
    logger.info('Creating test contact...');
    const contact = await ghlClient.createContact({
      firstName: 'Test',
      lastName: 'Diagnostic',
      email: 'test-diagnostic@pfc.com',
      phone: '+15551234567',
      tags: ['test']
    });

    logger.info('Test contact created', { contactId: contact.id });

    // Now try to create a minimal opportunity
    logger.info('Attempting to create opportunity with config:', {
      pipelineId: process.env.PFC_PIPELINE_ID,
      stageId: process.env.PFC_DEFAULT_STAGE,
      contactId: contact.id
    });

    // DEBUG: Log all environment variables being used
    console.log({
      tokenPrefix: process.env.GHL_API_KEY?.slice(0, 6),
      locationId: process.env.GHL_LOCATION_ID,
      pipelineId: process.env.PFC_PIPELINE_ID,
      stageId: process.env.PFC_DEFAULT_STAGE
    });

    const opportunity = await ghlClient.createOpportunity({
      name: 'Test Diagnostic Opportunity',
      contactId: contact.id,
      monetaryValue: 0,
      customFields: {}
    });

    res.json({
      success: true,
      message: 'Opportunity created successfully!',
      contactId: contact.id,
      opportunityId: opportunity.id,
      pipelineId: opportunity.pipelineId,
      stageId: opportunity.pipelineStageId
    });

  } catch (error) {
    logger.error('Diagnostic test failed', {
      error: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data,
      config: {
        pipelineId: process.env.PFC_PIPELINE_ID,
        stageId: process.env.PFC_DEFAULT_STAGE,
        hasPipelineId: !!process.env.PFC_PIPELINE_ID,
        hasStageId: !!process.env.PFC_DEFAULT_STAGE
      }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    path: req.path
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 PFC Ticketing Middleware started`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    ghlConfigured: !!process.env.GHL_API_KEY,
    claudeConfigured: !!process.env.ANTHROPIC_API_KEY
  });

  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   PFC Job Request Tracking System                    ║
║   Middleware Service                                  ║
║                                                       ║
║   🌐 Server running on port ${PORT}                     ║
║   📡 Webhooks: http://localhost:${PORT}/webhook/*      ║
║   ❤️  Health: http://localhost:${PORT}/health          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

module.exports = app;
