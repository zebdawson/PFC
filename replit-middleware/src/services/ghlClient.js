const axios = require('axios');
const logger = require('../utils/logger');

class GHLClient {
  constructor() {
    this.apiKey = process.env.GHL_API_KEY;
    this.locationId = process.env.GHL_LOCATION_ID;
    this.baseURL = 'https://services.leadconnectorhq.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      timeout: 10000
    });

    logger.info('GHL Client initialized', {
      locationId: this.locationId,
      tokenPrefix: this.apiKey?.substring(0, 8)
    });
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
        pipelineId: opportunityData.pipelineId || process.env.PFC_PIPELINE_ID,
        pipelineStageId: opportunityData.stageId || process.env.PFC_DEFAULT_STAGE,
        name: opportunityData.name,
        contactId: opportunityData.contactId,
        status: 'open',
        monetaryValue: opportunityData.monetaryValue || 0,
        customFields: opportunityData.customFields || {}
      };

      const response = await this.client.post('/opportunities', payload);
      logger.info('Opportunity created', {
        opportunityId: response.data.opportunity.id,
        name: opportunityData.name
      });

      return response.data.opportunity;
    } catch (error) {
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

module.exports = new GHLClient();
