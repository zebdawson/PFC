const express = require('express');
const router = express.Router();
const ticketService = require('../services/ticketService');
const claudeService = require('../services/claudeService');
const logger = require('../utils/logger');

/**
 * Webhook: Email Intake
 * Triggered when email received at requests@pfc.com
 */
router.post('/email', async (req, res) => {
  try {
    logger.info('Email webhook received', { from: req.body.from });

    // Parse email data from GHL webhook
    const emailData = {
      from: req.body.from,
      subject: req.body.subject,
      body: req.body.body || req.body.text,
      attachments: req.body.attachments || []
    };

    // Extract structured data using AI
    const extractedData = await claudeService.extractTicketData(emailData, 'email');

    if (!extractedData) {
      logger.warn('Could not extract data from email, creating basic ticket');
    }

    // Prepare ticket data
    const ticketData = {
      clientName: extractedData?.clientName || emailData.from,
      email: emailData.from,
      companyName: extractedData?.companyName,
      jobType: extractedData?.jobType || 'Email Request',
      description: emailData.body,
      startDate: extractedData?.startDate,
      endDate: extractedData?.endDate,
      location: extractedData?.location,
      phone: null // Email doesn't have phone
    };

    // Create ticket
    const result = await ticketService.createTicket(ticketData, 'email');

    res.status(200).json({
      success: true,
      message: 'Ticket created from email',
      ticketNumber: result.ticketNumber,
      opportunityId: result.opportunityId
    });

  } catch (error) {
    logger.error('Error processing email webhook', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Webhook: SMS Intake
 * Triggered when SMS received
 */
router.post('/sms', async (req, res) => {
  try {
    logger.info('SMS webhook received', { from: req.body.from });

    const smsData = {
      from: req.body.from,
      message: req.body.message || req.body.body,
      contactId: req.body.contactId // If GHL provides this
    };

    // Extract structured data using AI
    const extractedData = await claudeService.extractTicketData(smsData, 'sms');

    // Prepare ticket data
    const ticketData = {
      clientName: extractedData?.clientName || 'SMS Contact',
      phone: smsData.from,
      companyName: extractedData?.companyName,
      jobType: extractedData?.jobType || 'SMS Request',
      description: smsData.message,
      startDate: extractedData?.startDate,
      endDate: extractedData?.endDate,
      location: extractedData?.location,
      email: null // SMS doesn't have email
    };

    // Create ticket
    const result = await ticketService.createTicket(ticketData, 'sms');

    res.status(200).json({
      success: true,
      message: 'Ticket created from SMS',
      ticketNumber: result.ticketNumber,
      opportunityId: result.opportunityId
    });

  } catch (error) {
    logger.error('Error processing SMS webhook', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Webhook: Web Form Submission
 * Triggered when client submits web form
 */
router.post('/webform', async (req, res) => {
  try {
    logger.info('Web form webhook received', { formId: req.body.formId });

    // GHL sends form data in various formats
    const formData = req.body.formData || req.body.data || req.body;

    // Prepare ticket data (form fields should match)
    const ticketData = {
      clientName: formData.client_name || formData.name,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.company_name || formData.company,
      jobType: formData.job_type,
      description: formData.job_description || formData.description,
      startDate: formData.start_date || formData.preferred_start_date,
      endDate: formData.end_date || formData.preferred_end_date,
      location: formData.location,
      estimatedPersonnel: formData.staff_needed,
      specialRequirements: formData.special_requirements
    };

    // Create ticket
    const result = await ticketService.createTicket(ticketData, 'webform');

    res.status(200).json({
      success: true,
      message: 'Ticket created from web form',
      ticketNumber: result.ticketNumber,
      opportunityId: result.opportunityId
    });

  } catch (error) {
    logger.error('Error processing web form webhook', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Webhook: Sage AI (Assistable) Voice Intake
 * Triggered when Sage AI call completes
 */
router.post('/sage', async (req, res) => {
  try {
    logger.info('Sage AI webhook received', { callId: req.body.callId });

    const voiceData = {
      caller: req.body.caller || req.body.from,
      transcript: req.body.transcript || req.body.transcription,
      duration: req.body.duration,
      recordingUrl: req.body.recordingUrl || req.body.recording_url,
      extractedData: req.body.extractedData // If Sage AI already extracted data
    };

    // If Sage AI provides structured data, use it; otherwise extract with Claude
    let ticketData;

    if (voiceData.extractedData) {
      // Use Sage AI's extracted data
      ticketData = {
        clientName: voiceData.extractedData.client_name,
        email: voiceData.extractedData.email,
        phone: voiceData.caller,
        companyName: voiceData.extractedData.company,
        jobType: voiceData.extractedData.job_type,
        description: voiceData.extractedData.description || voiceData.transcript,
        startDate: voiceData.extractedData.start_date,
        endDate: voiceData.extractedData.end_date,
        location: voiceData.extractedData.location
      };
    } else {
      // Extract from transcript using Claude
      const extractedData = await claudeService.extractTicketData(voiceData, 'voice');

      ticketData = {
        clientName: extractedData?.clientName || 'Phone Contact',
        phone: voiceData.caller,
        companyName: extractedData?.companyName,
        jobType: extractedData?.jobType || 'Phone Request',
        description: voiceData.transcript,
        startDate: extractedData?.startDate,
        endDate: extractedData?.endDate,
        location: extractedData?.location,
        email: null
      };
    }

    // Create ticket
    const result = await ticketService.createTicket(ticketData, 'sage-ai');

    // TODO: Attach call recording to opportunity if URL provided

    res.status(200).json({
      success: true,
      message: 'Ticket created from Sage AI call',
      ticketNumber: result.ticketNumber,
      opportunityId: result.opportunityId,
      // Optionally return response for Sage AI to speak
      sageResponse: `Got it! I've created ticket number ${result.ticketNumber}. Our team will contact you within 4 hours.`
    });

  } catch (error) {
    logger.error('Error processing Sage AI webhook', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
      sageResponse: "I'm sorry, there was an error creating your ticket. Please call our main line."
    });
  }
});

/**
 * Webhook: Manual Ticket Creation
 * For testing or manual entry from dashboard
 */
router.post('/manual', async (req, res) => {
  try {
    logger.info('Manual ticket creation', { user: req.body.userId });

    const ticketData = req.body.ticketData;

    // Validate required fields
    if (!ticketData.clientName || !ticketData.description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: clientName and description'
      });
    }

    // Create ticket
    const result = await ticketService.createTicket(ticketData, 'manual');

    res.status(200).json({
      success: true,
      message: 'Ticket created manually',
      ticketNumber: result.ticketNumber,
      opportunityId: result.opportunityId,
      analysis: result.analysis
    });

  } catch (error) {
    logger.error('Error creating manual ticket', {
      error: error.message,
      stack: error.stack,
      responseData: error.response?.data
    });

    // Check if it's a configuration error
    if (error.message.includes('400') || error.response?.status === 400) {
      const missingConfigs = [];
      if (!process.env.PFC_PIPELINE_ID) missingConfigs.push('PFC_PIPELINE_ID');
      if (!process.env.PFC_DEFAULT_STAGE) missingConfigs.push('PFC_DEFAULT_STAGE');

      if (missingConfigs.length > 0) {
        return res.status(500).json({
          success: false,
          error: 'Missing required configuration',
          details: `Please add these to Replit Secrets: ${missingConfigs.join(', ')}`,
          hint: 'Get Pipeline ID from: https://app.happypath.marketing/v2/location/7p8fgVVr84S9fxsJqMdA/opportunities/list → Click a stage → Copy Stage ID from URL',
          missingConfigs
        });
      }
    }

    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'Check server logs for more details'
    });
  }
});

/**
 * Test endpoint to verify webhook is working
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'PFC Ticketing Middleware',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
