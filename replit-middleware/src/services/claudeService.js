const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    logger.info('Claude AI Service initialized');
  }

  /**
   * Analyze a job request ticket and determine department routing
   */
  async analyzeTicket(ticketData) {
    try {
      const prompt = this.buildAnalysisPrompt(ticketData);

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].text;
      logger.info('Claude API response received', {
        ticketId: ticketData.ticketNumber,
        responseLength: responseText.length
      });

      // Extract JSON from response
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        logger.warn('No JSON found in Claude response, using fallback');
        return this.getFallbackAnalysis();
      }

      const jsonText = jsonMatch[1] || jsonMatch[0];
      const analysis = JSON.parse(jsonText);

      // Validate and enrich the analysis
      return this.validateAnalysis(analysis, ticketData);

    } catch (error) {
      logger.error('Error analyzing ticket with Claude', {
        error: error.message,
        ticketData
      });
      // Return fallback analysis on error
      return this.getFallbackAnalysis();
    }
  }

  /**
   * Build the prompt for Claude analysis
   */
  buildAnalysisPrompt(ticketData) {
    return `You are an intelligent job request analyzer for PFC, a security and staffing company.

Analyze the following job request and determine:
1. Which departments need to be involved (Staffing, Logistics, Finance, Scheduling, ESOC)
2. What specific requirements each department needs to handle
3. Priority level (low, medium, high, urgent)
4. Estimated resources needed

IMPORTANT DEPARTMENT DEFINITIONS:
- **Staffing**: Personnel assignment, skills matching, certifications (ALWAYS needed for operational requests)
- **Logistics**: Transportation, equipment, setup, location coordination (job-dependent)
- **Finance**: Job codes, billing, quotes, hourly rates (ALWAYS needed)
- **Scheduling**: Calendar coordination, shift assignments, date management (ALWAYS needed)
- **ESOC** (Executive Security Operations Center): Security vulnerability assessments, geofencing for deployments, threat analysis (ONLY when security assessment or geofencing is required)

JOB REQUEST DETAILS:
${ticketData.clientName ? `Client: ${ticketData.clientName}` : ''}
${ticketData.companyName ? `Company: ${ticketData.companyName}` : ''}
${ticketData.jobType ? `Job Type: ${ticketData.jobType}` : ''}
Description: ${ticketData.description}
${ticketData.startDate ? `Start Date: ${ticketData.startDate}` : ''}
${ticketData.endDate ? `End Date: ${ticketData.endDate}` : ''}
${ticketData.location ? `Location: ${ticketData.location}` : ''}

Respond ONLY with valid JSON in this EXACT format (no additional text):

\`\`\`json
{
  "departments": {
    "staffing": {
      "required": true or false,
      "details": "specific requirements for staffing team",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedPersonnel": number or null,
      "skillsNeeded": ["skill1", "skill2"] or []
    },
    "logistics": {
      "required": true or false,
      "details": "specific logistics requirements",
      "priority": "low" | "medium" | "high" | "urgent",
      "equipmentNeeded": ["item1", "item2"] or [],
      "transportRequired": true or false
    },
    "finance": {
      "required": true or false,
      "details": "specific finance requirements",
      "priority": "low" | "medium" | "high" | "urgent",
      "estimatedBudget": number or null,
      "billingType": "hourly" | "fixed" | "tbd"
    },
    "scheduling": {
      "required": true or false,
      "details": "specific scheduling requirements",
      "priority": "low" | "medium" | "high" | "urgent",
      "shiftType": "day" | "night" | "split" | "tbd",
      "durationDays": number or null
    },
    "esoc": {
      "required": true or false,
      "details": "specific ESOC requirements (security assessment, geofencing, etc.)",
      "priority": "low" | "medium" | "high" | "urgent",
      "assessmentType": "vulnerability" | "geofencing" | "threat" | "none",
      "geofencingRequired": true or false
    }
  },
  "overallPriority": "low" | "medium" | "high" | "urgent",
  "summary": "brief 1-2 sentence summary of the request",
  "flags": ["any special considerations, warnings, or requirements"],
  "recommendedActions": ["suggested next steps for the team"],
  "estimatedCompletionDays": number or null
}
\`\`\`

Be specific about why each department is or isn't needed. Consider:
- Staffing is almost always needed for operational jobs
- Finance is almost always needed for billing/quotes
- Scheduling is almost always needed for date coordination
- ESOC is ONLY needed for security assessments or geofencing
- Logistics depends on location, equipment, or transport needs`;
  }

  /**
   * Validate and enrich the analysis
   */
  validateAnalysis(analysis, ticketData) {
    // Ensure all departments are present
    const departments = ['staffing', 'logistics', 'finance', 'scheduling', 'esoc'];
    for (const dept of departments) {
      if (!analysis.departments[dept]) {
        analysis.departments[dept] = {
          required: false,
          details: '',
          priority: 'medium'
        };
      }
    }

    // Ensure required fields
    if (!analysis.overallPriority) {
      analysis.overallPriority = 'medium';
    }

    if (!analysis.summary) {
      analysis.summary = `Job request from ${ticketData.clientName || 'client'}`;
    }

    if (!analysis.flags) {
      analysis.flags = [];
    }

    if (!analysis.recommendedActions) {
      analysis.recommendedActions = [];
    }

    // Add metadata
    analysis.analyzedAt = new Date().toISOString();
    analysis.ticketNumber = ticketData.ticketNumber;

    logger.info('Analysis validated and enriched', {
      ticketNumber: ticketData.ticketNumber,
      departmentsRequired: Object.keys(analysis.departments).filter(
        d => analysis.departments[d].required
      )
    });

    return analysis;
  }

  /**
   * Fallback analysis when AI fails
   */
  getFallbackAnalysis() {
    logger.warn('Using fallback analysis');

    return {
      departments: {
        staffing: {
          required: true,
          details: 'Manual review required - AI analysis unavailable',
          priority: 'medium'
        },
        logistics: {
          required: false,
          details: '',
          priority: 'medium'
        },
        finance: {
          required: true,
          details: 'Manual review required - AI analysis unavailable',
          priority: 'medium'
        },
        scheduling: {
          required: true,
          details: 'Manual review required - AI analysis unavailable',
          priority: 'medium'
        },
        esoc: {
          required: false,
          details: '',
          priority: 'medium'
        }
      },
      overallPriority: 'medium',
      summary: 'AI analysis failed - manual review required',
      flags: ['AI_ANALYSIS_FAILED', 'MANUAL_REVIEW_REQUIRED'],
      recommendedActions: ['Coordinator should review and manually assign departments'],
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Extract ticket data from various sources (email, SMS, web form, voice)
   */
  async extractTicketData(rawData, source) {
    try {
      const prompt = `Extract structured job request data from this ${source} message:

${source === 'email' ? `
From: ${rawData.from}
Subject: ${rawData.subject}
Body: ${rawData.body}
` : source === 'sms' ? `
From: ${rawData.from}
Message: ${rawData.message}
` : source === 'voice' ? `
Caller: ${rawData.caller}
Transcript: ${rawData.transcript}
` : rawData.formData}

Extract and return ONLY JSON:
\`\`\`json
{
  "clientName": "extracted name",
  "companyName": "extracted company or null",
  "jobType": "event staffing | security services | crowd management | traffic control | special project | emergency request | other",
  "description": "full description",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "location": "extracted location or null",
  "urgencyIndicators": ["urgent", "asap", "emergency"] or [],
  "estimatedPersonnel": number or null,
  "specialRequirements": ["requirement1", "requirement2"] or []
}
\`\`\``;

      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonText);
      }

      return null;
    } catch (error) {
      logger.error('Error extracting ticket data', { error: error.message, source });
      return null;
    }
  }
}

module.exports = new ClaudeService();
