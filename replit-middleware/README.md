# PFC Job Request Tracking System - Middleware

## Overview

This is the middleware service that powers PFC's job request tracking system. It connects **GoHighLevel (Follow-Up Pathway)** with **Claude AI** to provide intelligent ticket routing and automation.

### What This Does

1. **Receives requests** from multiple channels (email, SMS, web forms, Sage AI phone calls)
2. **Analyzes tickets** using Claude AI to determine required departments
3. **Creates opportunities** in GoHighLevel with proper routing
4. **Assigns tasks** to department teams automatically
5. **Sends notifications** to clients and team members

### Architecture

```
Client Request (Email/SMS/Form/Phone)
         ↓
    Webhook to Replit
         ↓
  Claude AI Analysis
         ↓
   GoHighLevel API
         ↓
 Opportunity + Tasks Created
         ↓
  Team Notifications Sent
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `GHL_API_KEY` - Your GoHighLevel API key (already configured)
- `GHL_LOCATION_ID` - Your GHL location ID (already configured)
- `ANTHROPIC_API_KEY` - Your Claude API key from Anthropic
- `PFC_PIPELINE_ID` - The pipeline ID for Job Requests in GHL
- Department user IDs (from GHL)

### 3. Test GHL Connection

```bash
npm test
```

This will verify your GHL API connection and create a test contact.

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3000` (or whatever PORT you set in .env)

---

## API Endpoints

### Health & Testing

**GET /** - Service information
```json
{
  "service": "PFC Ticketing Middleware",
  "status": "running",
  "version": "1.0.0"
}
```

**GET /health** - Health check with environment info
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "ghlConfigured": true,
  "claudeConfigured": true
}
```

**GET /test/ghl** - Test GHL API connection
```json
{
  "success": true,
  "message": "GHL connection successful",
  "location": { ... }
}
```

### Webhook Endpoints

#### POST /webhook/email
Receives email intake webhooks from GHL

**Request Body:**
```json
{
  "from": "client@example.com",
  "subject": "Job Request",
  "body": "We need 3 security personnel for Saturday..."
}
```

**Response:**
```json
{
  "success": true,
  "ticketNumber": "PFC-241121-1234",
  "opportunityId": "abc123"
}
```

#### POST /webhook/sms
Receives SMS intake webhooks from GHL

**Request Body:**
```json
{
  "from": "+15551234567",
  "message": "Need security for Miami event this weekend"
}
```

#### POST /webhook/webform
Receives web form submissions from GHL

**Request Body:**
```json
{
  "formData": {
    "client_name": "John Doe",
    "email": "john@example.com",
    "phone": "+15551234567",
    "job_type": "Event Staffing",
    "job_description": "Need 5 security personnel",
    "start_date": "2024-12-01",
    "end_date": "2024-12-01"
  }
}
```

#### POST /webhook/sage
Receives Sage AI (Assistable) voice call webhooks

**Request Body:**
```json
{
  "caller": "+15551234567",
  "transcript": "Hi, this is PFC Safeguards. We need 3 personnel for a weekend detail in Miami...",
  "recordingUrl": "https://...",
  "extractedData": {
    "client_name": "John Doe",
    "job_type": "Weekend Detail",
    "location": "Miami"
  }
}
```

**Response:**
```json
{
  "success": true,
  "ticketNumber": "PFC-241121-1234",
  "sageResponse": "Got it! I've created ticket number PFC-241121-1234. Our team will contact you within 4 hours."
}
```

#### POST /webhook/manual
Manual ticket creation (for testing or dashboard use)

**Request Body:**
```json
{
  "ticketData": {
    "clientName": "Test Client",
    "email": "test@example.com",
    "phone": "+15551234567",
    "companyName": "Test Company",
    "jobType": "Event Staffing",
    "description": "Test job request",
    "startDate": "2024-12-01",
    "endDate": "2024-12-01"
  }
}
```

---

## Configuration Guide

### Step 1: Get Your GHL API Key

✅ **Already configured!** Your API key is in the `.env` file.

Location ID: `7p8fgVVr84S9fxsJqMdA`

### Step 2: Get Your Anthropic Claude API Key

1. Go to https://console.anthropic.com/
2. Create an account (or log in)
3. Navigate to API Keys
4. Create a new key
5. Copy it to `.env` as `ANTHROPIC_API_KEY`

### Step 3: Configure GHL Pipeline

1. Log into GoHighLevel
2. Go to **Settings → Pipelines**
3. Find or create "Job Requests" pipeline
4. Copy the Pipeline ID from the URL
5. Add to `.env` as `PFC_PIPELINE_ID`

### Step 4: Get Department User IDs

1. In GHL, go to **Settings → Team**
2. Click on each team member
3. Copy their User ID from the URL
4. Add to `.env`:
   - `STAFFING_USER_ID`
   - `LOGISTICS_USER_ID`
   - `FINANCE_USER_ID`
   - `SCHEDULING_USER_ID`
   - `ESOC_USER_ID`

---

## Deploying to Replit

### Option 1: Quick Deploy

1. Go to https://replit.com/
2. Click "+ Create Repl"
3. Choose "Import from GitHub"
4. Upload this folder
5. Replit will auto-detect Node.js
6. Add **Secrets** (environment variables):
   - Click the lock icon in left sidebar
   - Add each variable from `.env`
7. Click "Run"

### Option 2: Manual Setup

1. Create a new Node.js Repl
2. Upload all files from this folder
3. Configure Secrets (same as above)
4. In the Shell, run: `npm install`
5. Click "Run" (or run `node src/index.js`)

### Replit Configuration

Create a `.replit` file:

```toml
run = "node src/index.js"
entrypoint = "src/index.js"

[nix]
channel = "stable-22_11"

[deployment]
run = ["sh", "-c", "node src/index.js"]
```

---

## Connecting to GoHighLevel

### Email Intake

1. In GHL, go to **Settings → Workflows**
2. Create new workflow: "Email to Ticket"
3. Trigger: **Email Received**
4. Condition: To address contains "requests@"
5. Action: **Send Webhook**
   - URL: `https://your-replit-url.repl.co/webhook/email`
   - Method: POST
   - Body:
     ```json
     {
       "from": "{{email.from}}",
       "subject": "{{email.subject}}",
       "body": "{{email.body}}"
     }
     ```

### SMS Intake

1. In GHL, create workflow: "SMS to Ticket"
2. Trigger: **Inbound Message (SMS)**
3. Action: **Send Webhook**
   - URL: `https://your-replit-url.repl.co/webhook/sms`
   - Method: POST
   - Body:
     ```json
     {
       "from": "{{contact.phone}}",
       "message": "{{message.body}}",
       "contactId": "{{contact.id}}"
     }
     ```

### Web Form Intake

1. In GHL, create your job request form
2. Add form submission action: **Send Webhook**
   - URL: `https://your-replit-url.repl.co/webhook/webform`
   - Method: POST
   - Body: Map all form fields

### Sage AI Integration

1. In Assistable (Sage AI), configure webhook
2. Set webhook URL: `https://your-replit-url.repl.co/webhook/sage`
3. Configure to send:
   - Call transcript
   - Caller phone number
   - Any extracted data

---

## Department Routing Logic

The Claude AI analyzes each ticket and determines which departments are needed:

### Always Required:
- **Staffing** - For personnel assignment
- **Finance** - For billing/quotes
- **Scheduling** - For calendar coordination

### Conditionally Required:
- **Logistics** - If transportation, equipment, or location setup needed
- **ESOC** - If security assessment or geofencing required

### Priority Levels:
- **Urgent** - 2 hour response time
- **High** - 4 hour response time
- **Medium** - 24 hour response time
- **Low** - 48 hour response time

---

## Testing the System

### Test 1: Manual Ticket Creation

```bash
curl -X POST http://localhost:3000/webhook/manual \
  -H "Content-Type: application/json" \
  -d '{
    "ticketData": {
      "clientName": "Test Client",
      "email": "test@example.com",
      "description": "Need 3 security personnel for Saturday event in Miami",
      "jobType": "Event Staffing",
      "startDate": "2024-12-07"
    }
  }'
```

### Test 2: Simulated Email

```bash
curl -X POST http://localhost:3000/webhook/email \
  -H "Content-Type: application/json" \
  -d '{
    "from": "client@example.com",
    "subject": "Urgent: Weekend Security Needed",
    "body": "We need 5 security guards for our Miami Beach event this Saturday from 6pm-2am. Please provide quote ASAP."
  }'
```

### Test 3: Simulated SMS

```bash
curl -X POST http://localhost:3000/webhook/sms \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+15551234567",
    "message": "Need 2 drivers for LA pickup tomorrow morning"
  }'
```

---

## Monitoring & Logs

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

To monitor in real-time:
```bash
tail -f logs/combined.log
```

---

## Troubleshooting

### "GHL API connection failed"

**Cause:** Invalid API key or location ID
**Fix:** Double-check your `.env` file credentials

### "Claude API error"

**Cause:** Invalid or missing Anthropic API key
**Fix:** Add valid `ANTHROPIC_API_KEY` to `.env`

### "Department tasks not created"

**Cause:** Missing department user IDs
**Fix:** Configure all 5 department user IDs in `.env`

### "Webhook not receiving requests"

**Cause:** GHL workflow not configured or wrong URL
**Fix:** Verify your Replit URL in GHL workflows

---

## Security Notes

- Never commit `.env` file to Git (already in `.gitignore`)
- Use Replit Secrets for production
- API keys are bearer tokens - keep them secure
- Consider adding webhook signature verification for production

---

## Support

For issues or questions:
1. Check logs: `logs/combined.log`
2. Test GHL connection: `npm test`
3. Verify environment variables in `.env`
4. Contact Happy Path team

---

## License

Proprietary - Built for PFC by Happy Path Marketing
