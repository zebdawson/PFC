const axios = require('axios');
const logger = require('../utils/logger');

// Import OAuth token getter (will be set after oauth module loads)
let getAccessToken = null;
let getLocationId = null;

class GHLClient {
  constructor() {
    this.baseURL = 'https://services.leadconnectorhq.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      timeout: 10000
    });

    // Add request interceptor to inject current access token
    this.client.interceptors.request.use(async (config) => {
      try {
        if (getAccessToken) {
          const token = await getAccessToken();
          config.headers['Authorization'] = `Bearer ${token}`;
          logger.info('OAuth token injected into request', {
            url: config.url,
            tokenPrefix: token?.substring(0, 20) + '...'
          });
        } else {
          // Fall back to API key authentication if OAuth not configured
          const apiKey = process.env.GHL_API_KEY;
          if (apiKey) {
            config.headers['Authorization'] = `Bearer ${apiKey}`;
            logger.info('API key injected into request (OAuth not configured)', {
              url: config.url
            });
          } else {
            logger.warn('No authentication available - neither OAuth nor API key configured');
          }
        }
      } catch (error) {
        logger.error('Could not get access token, falling back to API key', {
          error: error.message
        });

        // Fall back to API key if OAuth token retrieval fails
        const apiKey = process.env.GHL_API_KEY;
        if (apiKey) {
          config.headers['Authorization'] = `Bearer ${apiKey}`;
          logger.info('Using API key fallback due to OAuth error');
        }
      }
      return config;
    });

    logger.info('GHL Client initialized with OAuth');
  }

  get locationId() {
    return getLocationId ? getLocationId() : process.env.GHL_LOCATION_ID;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.client.get(`/locations/${this.locationId}`);
      logger.info('GHL API connection successful', {
        locationName: response.data.location?.name
      });
      return response.data;
    } catch (error) {
      logger.error('GHL API connection failed', {
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Create or update a contact
   */
  async createContact(contactData) {
    // Define payload outside try block so it's accessible in catch
    const payload = {
      locationId: this.locationId,
      firstName: contactData.firstName,
      lastName: contactData.lastName || '',
      email: contactData.email,
      phone: contactData.phone,
      companyName: contactData.companyName,
      tags: contactData.tags || []
    };

    try {

      // Check if contact exists first (by email or phone)
      let contact;
      if (contactData.email) {
        contact = await this.findContactByEmail(contactData.email);
      }

      // Also check by phone if email search didn't find anything
      if (!contact && contactData.phone) {
        contact = await this.findContactByPhone(contactData.phone);
      }

      if (contact) {
        // Update existing contact
        const response = await this.client.put(`/contacts/${contact.id}`, payload);
        logger.info('Contact updated', { contactId: contact.id, email: contactData.email });
        return response.data.contact;
      } else {
        // Create new contact
        const response = await this.client.post('/contacts', payload);
        logger.info('Contact created', { contactId: response.data.contact.id });
        return response.data.contact;
      }
    } catch (error) {
      // Check if it's a duplicate contact error
      if (error.response?.status === 400 &&
          error.response?.data?.message?.includes('duplicated contacts') &&
          error.response?.data?.meta?.contactId) {

        // GHL told us the duplicate contact ID - use it!
        const existingContactId = error.response.data.meta.contactId;
        logger.info('Contact already exists, updating instead', {
          contactId: existingContactId,
          matchingField: error.response.data.meta.matchingField
        });

        try {
          const response = await this.client.put(`/contacts/${existingContactId}`, payload);
          logger.info('Duplicate contact updated', { contactId: existingContactId });
          return response.data.contact;
        } catch (updateError) {
          logger.error('Error updating duplicate contact', {
            error: updateError.message,
            contactId: existingContactId
          });
          throw updateError;
        }
      }

      logger.error('Error creating/updating contact', {
        error: error.message,
        email: contactData.email
      });
      throw error;
    }
  }

  /**
   * Find contact by email
   */
  async findContactByEmail(email) {
    try {
      const response = await this.client.get('/contacts/search', {
        params: {
          locationId: this.locationId,
          email: email
        }
      });

      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }
      return null;
    } catch (error) {
      logger.error('Error finding contact by email', { error: error.message, email });
      return null;
    }
  }

  /**
   * Find contact by phone
   */
  async findContactByPhone(phone) {
    try {
      const response = await this.client.get('/contacts/search', {
        params: {
          locationId: this.locationId,
          phone: phone
        }
      });

      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }
      return null;
    } catch (error) {
      logger.error('Error finding contact by phone', { error: error.message, phone });
      return null;
    }
  }

  /**
   * Create an opportunity (ticket)
   */
  async createOpportunity(opportunityData) {
    try {
      const payload = {
        locationId: this.locationId,
        pipelineId: opportunityData.pipelineId || process.env.PFC_PIPELINE_ID,
        pipelineStageId: opportunityData.stageId || process.env.PFC_DEFAULT_STAGE,
        name: opportunityData.name,
        contactId: opportunityData.contactId,
        status: 'open',
        monetaryValue: opportunityData.monetaryValue || 0,
        customFields: opportunityData.customFields || {}
      };

      logger.info('Creating opportunity with payload', {
        locationId: payload.locationId,
        pipelineId: payload.pipelineId,
        pipelineStageId: payload.pipelineStageId,
        contactId: payload.contactId
      });

      const response = await this.client.post('/opportunities', payload);
      logger.info('Opportunity created', {
        opportunityId: response.data.opportunity.id,
        name: opportunityData.name
      });

      return response.data.opportunity;
    } catch (error) {
      // Enhanced error handling for common issues
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || error.message;

        if (errorMessage.includes('does not have access to this location')) {
          logger.error('Location/Pipeline mismatch detected', {
            error: errorMessage,
            currentLocationId: this.locationId,
            attemptedPipelineId: payload.pipelineId,
            hint: 'The pipeline ID may belong to a different location than the one authorized via OAuth'
          });

          const enhancedError = new Error(
            `OAuth Location Mismatch: The pipeline ID "${payload.pipelineId}" does not belong to location "${this.locationId}". ` +
            `Please verify that PFC_PIPELINE_ID matches a pipeline in your authorized GHL location. ` +
            `Run the diagnostic script to see available pipelines: node src/get-pipeline-info-oauth.js`
          );
          enhancedError.originalError = error;
          enhancedError.statusCode = 403;
          enhancedError.locationId = this.locationId;
          enhancedError.pipelineId = payload.pipelineId;
          throw enhancedError;
        }
      }

      logger.error('Error creating opportunity', {
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Update an opportunity
   */
  async updateOpportunity(opportunityId, updates) {
    try {
      const response = await this.client.put(`/opportunities/${opportunityId}`, updates);
      logger.info('Opportunity updated', { opportunityId });
      return response.data.opportunity;
    } catch (error) {
      logger.error('Error updating opportunity', {
        error: error.message,
        opportunityId
      });
      throw error;
    }
  }

  /**
   * Create a task
   */
  async createTask(taskData) {
    try {
      const payload = {
        title: taskData.title,
        body: taskData.description,
        assignedTo: taskData.assignedTo,
        dueDate: taskData.dueDate,
        contactId: taskData.contactId,
        relatedTo: taskData.relatedTo, // Opportunity ID
        completed: false
      };

      const response = await this.client.post('/contacts/tasks', payload);
      logger.info('Task created', {
        taskId: response.data.task.id,
        title: taskData.title,
        assignedTo: taskData.assignedTo
      });

      return response.data.task;
    } catch (error) {
      logger.error('Error creating task', {
        error: error.message,
        title: taskData.title
      });
      throw error;
    }
  }

  /**
   * Add note to opportunity
   */
  async addNote(opportunityId, noteText, userId = null) {
    try {
      const payload = {
        body: noteText,
        userId: userId
      };

      const response = await this.client.post(
        `/opportunities/${opportunityId}/notes`,
        payload
      );

      logger.info('Note added to opportunity', { opportunityId });
      return response.data.note;
    } catch (error) {
      logger.error('Error adding note', {
        error: error.message,
        opportunityId
      });
      throw error;
    }
  }

  /**
   * Send SMS
   */
  async sendSMS(contactId, message) {
    try {
      if (!process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
        logger.info('SMS notifications disabled');
        return null;
      }

      const payload = {
        type: 'SMS',
        contactId: contactId,
        message: message
      };

      const response = await this.client.post('/conversations/messages', payload);
      logger.info('SMS sent', { contactId });
      return response.data;
    } catch (error) {
      logger.error('Error sending SMS', {
        error: error.message,
        contactId
      });
      throw error;
    }
  }

  /**
   * Send Email
   */
  async sendEmail(contactId, subject, body) {
    try {
      if (!process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        logger.info('Email notifications disabled');
        return null;
      }

      const payload = {
        type: 'Email',
        contactId: contactId,
        subject: subject,
        body: body
      };

      const response = await this.client.post('/conversations/messages', payload);
      logger.info('Email sent', { contactId, subject });
      return response.data;
    } catch (error) {
      logger.error('Error sending email', {
        error: error.message,
        contactId
      });
      throw error;
    }
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunity(opportunityId) {
    try {
      const response = await this.client.get(`/opportunities/${opportunityId}`);
      return response.data.opportunity;
    } catch (error) {
      logger.error('Error getting opportunity', {
        error: error.message,
        opportunityId
      });
      throw error;
    }
  }

  /**
   * Get pipeline stages
   */
  async getPipelineStages(pipelineId) {
    try {
      const response = await this.client.get(`/opportunities/pipelines/${pipelineId}`);
      return response.data.pipeline.stages;
    } catch (error) {
      logger.error('Error getting pipeline stages', {
        error: error.message,
        pipelineId
      });
      throw error;
    }
  }
}

const ghlClient = new GHLClient();

// Allow OAuth module to set token getters
ghlClient.setOAuthFunctions = (tokenGetter, locationGetter) => {
  getAccessToken = tokenGetter;
  getLocationId = locationGetter;
  logger.info('OAuth functions configured for GHL Client');
};

module.exports = ghlClient;
