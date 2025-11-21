const ghlClient = require('./ghlClient');
const claudeService = require('./claudeService');
const logger = require('../utils/logger');

class TicketService {
  /**
   * Create a complete ticket with AI analysis and department assignments
   */
  async createTicket(ticketData, source = 'unknown') {
    logger.info('Creating new ticket', { source, clientName: ticketData.clientName });

    try {
      // Step 1: Create or update contact in GHL
      const contact = await ghlClient.createContact({
        firstName: ticketData.clientName?.split(' ')[0] || 'Unknown',
        lastName: ticketData.clientName?.split(' ').slice(1).join(' ') || '',
        email: ticketData.email,
        phone: ticketData.phone,
        companyName: ticketData.companyName,
        tags: [`intake-${source}`, 'job-request']
      });

      // Step 2: Generate ticket number
      const ticketNumber = this.generateTicketNumber();
      ticketData.ticketNumber = ticketNumber;

      // Step 3: Analyze ticket with Claude AI
      logger.info('Analyzing ticket with Claude AI', { ticketNumber });
      const analysis = await claudeService.analyzeTicket(ticketData);

      // Step 4: Create opportunity in GHL
      const opportunity = await ghlClient.createOpportunity({
        name: `${ticketNumber} - ${ticketData.clientName} - ${ticketData.jobType || 'Job Request'}`,
        contactId: contact.id,
        customFields: {
          ticket_number: ticketNumber,
          job_type: ticketData.jobType,
          job_description: ticketData.description,
          priority: analysis.overallPriority,
          start_date: ticketData.startDate,
          end_date: ticketData.endDate,
          intake_channel: source,
          ai_analysis_summary: analysis.summary,
          ai_flags: analysis.flags.join(', '),
          created_date: new Date().toISOString()
        }
      });

      logger.info('Opportunity created', {
        opportunityId: opportunity.id,
        ticketNumber
      });

      // Step 5: Add detailed AI analysis as a note
      await ghlClient.addNote(
        opportunity.id,
        this.formatAnalysisNote(analysis)
      );

      // Step 6: Create department tasks
      const tasks = await this.createDepartmentTasks(
        opportunity.id,
        contact.id,
        ticketNumber,
        analysis
      );

      // Step 7: Send confirmation to client
      await this.sendClientConfirmation(contact.id, ticketNumber, ticketData);

      logger.info('Ticket creation complete', {
        ticketNumber,
        opportunityId: opportunity.id,
        tasksCreated: tasks.length
      });

      return {
        success: true,
        ticketNumber,
        opportunityId: opportunity.id,
        contactId: contact.id,
        analysis,
        tasks
      };

    } catch (error) {
      logger.error('Error creating ticket', {
        error: error.message,
        stack: error.stack,
        ticketData
      });

      throw error;
    }
  }

  /**
   * Create tasks for required departments
   */
  async createDepartmentTasks(opportunityId, contactId, ticketNumber, analysis) {
    const tasks = [];
    const departments = analysis.departments;

    // Department user ID mapping from env
    const deptUsers = {
      staffing: process.env.STAFFING_USER_ID,
      logistics: process.env.LOGISTICS_USER_ID,
      finance: process.env.FINANCE_USER_ID,
      scheduling: process.env.SCHEDULING_USER_ID,
      esoc: process.env.ESOC_USER_ID
    };

    for (const [deptName, deptData] of Object.entries(departments)) {
      if (deptData.required) {
        try {
          const dueDate = this.calculateDueDate(deptData.priority);

          const task = await ghlClient.createTask({
            title: `[${deptName.toUpperCase()}] Ticket ${ticketNumber}`,
            description: `${deptData.details}\n\nPriority: ${deptData.priority}\nTicket: ${ticketNumber}`,
            assignedTo: deptUsers[deptName],
            dueDate: dueDate,
            contactId: contactId,
            relatedTo: opportunityId
          });

          tasks.push({
            department: deptName,
            taskId: task.id,
            priority: deptData.priority
          });

          logger.info('Department task created', {
            department: deptName,
            taskId: task.id,
            ticketNumber
          });

        } catch (error) {
          logger.error('Error creating department task', {
            department: deptName,
            error: error.message,
            ticketNumber
          });
        }
      }
    }

    return tasks;
  }

  /**
   * Calculate due date based on priority
   */
  calculateDueDate(priority) {
    const now = new Date();
    let hoursToAdd;

    switch (priority) {
      case 'urgent':
        hoursToAdd = 2;
        break;
      case 'high':
        hoursToAdd = 4;
        break;
      case 'medium':
        hoursToAdd = 24;
        break;
      case 'low':
        hoursToAdd = 48;
        break;
      default:
        hoursToAdd = 24;
    }

    now.setHours(now.getHours() + hoursToAdd);
    return now.toISOString();
  }

  /**
   * Format AI analysis as a note
   */
  formatAnalysisNote(analysis) {
    let note = '🤖 AI TICKET ANALYSIS\n\n';
    note += `Summary: ${analysis.summary}\n\n`;
    note += `Overall Priority: ${analysis.overallPriority.toUpperCase()}\n\n`;

    note += 'DEPARTMENTS REQUIRED:\n';
    for (const [dept, data] of Object.entries(analysis.departments)) {
      if (data.required) {
        note += `\n✅ ${dept.toUpperCase()} (Priority: ${data.priority})\n`;
        note += `   ${data.details}\n`;
      }
    }

    if (analysis.flags && analysis.flags.length > 0) {
      note += `\n⚠️ FLAGS:\n`;
      analysis.flags.forEach(flag => {
        note += `   - ${flag}\n`;
      });
    }

    if (analysis.recommendedActions && analysis.recommendedActions.length > 0) {
      note += `\n📋 RECOMMENDED ACTIONS:\n`;
      analysis.recommendedActions.forEach(action => {
        note += `   - ${action}\n`;
      });
    }

    note += `\n---\nAnalyzed: ${analysis.analyzedAt}`;

    return note;
  }

  /**
   * Send confirmation to client
   */
  async sendClientConfirmation(contactId, ticketNumber, ticketData) {
    try {
      const message = `Thank you for contacting PFC! Your request has been received.

Ticket Number: ${ticketNumber}
Job Type: ${ticketData.jobType || 'General Request'}
${ticketData.startDate ? `Start Date: ${ticketData.startDate}` : ''}

We're reviewing your request and will respond within 4 business hours.

You can reference ticket #${ticketNumber} for any follow-up questions.

- PFC Team`;

      await ghlClient.sendSMS(contactId, message);

      logger.info('Client confirmation sent', { contactId, ticketNumber });
    } catch (error) {
      logger.error('Error sending client confirmation', {
        error: error.message,
        contactId,
        ticketNumber
      });
    }
  }

  /**
   * Generate unique ticket number
   */
  generateTicketNumber() {
    const prefix = 'PFC';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000; // 4-digit random

    return `${prefix}-${year}${month}${day}-${random}`;
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(opportunityId, status, note = null) {
    try {
      await ghlClient.updateOpportunity(opportunityId, {
        status: status
      });

      if (note) {
        await ghlClient.addNote(opportunityId, note);
      }

      logger.info('Ticket status updated', { opportunityId, status });
    } catch (error) {
      logger.error('Error updating ticket status', {
        error: error.message,
        opportunityId
      });
    }
  }
}

module.exports = new TicketService();
