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
app.get('/', (req, res) => {
  res.json({
    service: 'PFC Ticketing Middleware',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhooks: '/webhook/*',
      health: '/health',
      test: '/test'
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

// Test GHL connection
app.get('/test/ghl', async (req, res) => {
  try {
    const ghlClient = require('./services/ghlClient');
    const result = await ghlClient.testConnection();
    res.json({
      success: true,
      message: 'GHL connection successful',
      location: result.location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
