# GoHighLevel Custom Fields Setup Guide

## Overview

This guide shows you exactly which custom fields to create in GoHighLevel for the PFC ticketing system to work properly.

---

## How to Create Custom Fields in GHL

1. Log into your GoHighLevel account
2. Go to **Settings → Custom Fields**
3. Choose the object type (Contact or Opportunity)
4. Click **"Add Custom Field"**
5. Fill in the details below for each field

---

## Custom Fields for OPPORTUNITIES

These fields should be added to the **Opportunity** object:

### 1. **Ticket Number**
- **Field Name:** `Ticket Number`
- **Field Key:** `ticket_number`
- **Type:** Text (Single Line)
- **Description:** Unique identifier like PFC-241122-1234
- **Required:** Yes
- **Visible:** Yes

### 2. **Request Type**
- **Field Name:** `Request Type`
- **Field Key:** `request_type`
- **Type:** Dropdown (Single Select)
- **Options:**
  - Operational Support
  - ESOC Service
  - Driver Request
  - Emergency Response
  - Event Staffing
  - Executive Protection
  - Other
- **Required:** Yes

### 3. **Urgency Level**
- **Field Name:** `Urgency Level`
- **Field Key:** `urgency_level`
- **Type:** Dropdown (Single Select)
- **Options:**
  - Critical (2 hour response)
  - High (4 hour response)
  - Normal (24 hour response)
  - Low (48 hour response)
- **Required:** Yes
- **Default:** Normal

### 4. **Departments Needed**
- **Field Name:** `Departments Needed`
- **Field Key:** `departments_needed`
- **Type:** Checkbox (Multi-Select)
- **Options:**
  - Staffing
  - Logistics
  - Finance
  - Scheduling
  - ESOC
- **Required:** Yes

### 5. **Job Start Date**
- **Field Name:** `Job Start Date`
- **Field Key:** `job_start_date`
- **Type:** Date
- **Required:** Yes

### 6. **Job End Date**
- **Field Name:** `Job End Date`
- **Field Key:** `job_end_date`
- **Type:** Date
- **Required:** No

### 7. **Number of Personnel**
- **Field Name:** `Number of Personnel`
- **Field Key:** `personnel_count`
- **Type:** Number
- **Required:** No

### 8. **Location/Venue**
- **Field Name:** `Location/Venue`
- **Field Key:** `job_location`
- **Type:** Text (Single Line)
- **Required:** No

### 9. **Special Requirements**
- **Field Name:** `Special Requirements`
- **Field Key:** `special_requirements`
- **Type:** Text (Multi-Line)
- **Required:** No
- **Description:** Armed guards, specific uniforms, languages, equipment, etc.

### 10. **Budget/Quote Range**
- **Field Name:** `Budget/Quote Range`
- **Field Key:** `budget_range`
- **Type:** Text (Single Line)
- **Required:** No

### 11. **Intake Source**
- **Field Name:** `Intake Source`
- **Field Key:** `intake_source`
- **Type:** Dropdown (Single Select)
- **Options:**
  - Email
  - SMS
  - Web Form
  - Phone Call (Sage AI)
  - Manual Entry
- **Required:** Yes

### 12. **AI Analysis**
- **Field Name:** `AI Analysis`
- **Field Key:** `ai_analysis`
- **Type:** Text (Multi-Line)
- **Required:** No
- **Description:** Claude AI's analysis of the request

### 13. **Client Company**
- **Field Name:** `Client Company`
- **Field Key:** `client_company`
- **Type:** Text (Single Line)
- **Required:** No

---

## Custom Fields for CONTACTS

These fields should be added to the **Contact** object:

### 1. **Preferred Contact Method**
- **Field Name:** `Preferred Contact Method`
- **Field Key:** `preferred_contact_method`
- **Type:** Dropdown
- **Options:**
  - Email
  - SMS
  - Phone
- **Default:** Email

### 2. **Client Type**
- **Field Name:** `Client Type`
- **Field Key:** `client_type`
- **Type:** Dropdown
- **Options:**
  - New Client
  - Returning Client
  - VIP Client
  - Government
  - Corporate
  - Event Organizer
  - Individual
- **Required:** No

### 3. **Total Job Requests**
- **Field Name:** `Total Job Requests`
- **Field Key:** `total_requests`
- **Type:** Number
- **Required:** No
- **Description:** Auto-incremented by system

---

## Pipeline Setup

### Create "Job Requests" Pipeline

1. Go to **Settings → Pipelines**
2. Click **"Add Pipeline"**
3. **Name:** Job Requests
4. **Create these stages:**

   1. **New Request** (Incoming tickets)
   2. **Under Review** (Being analyzed)
   3. **Assigned** (Tasks sent to departments)
   4. **In Progress** (Departments working)
   5. **Pending Client** (Waiting on client response)
   6. **Quote Sent** (Proposal delivered)
   7. **Scheduled** (Job booked)
   8. **Completed** (Job finished)
   9. **Cancelled**
   10. **Lost**

---

## Quick Setup Checklist

Use this checklist as you create each field:

### Opportunity Fields
- [ ] Ticket Number (Text)
- [ ] Request Type (Dropdown)
- [ ] Urgency Level (Dropdown)
- [ ] Departments Needed (Checkbox)
- [ ] Job Start Date (Date)
- [ ] Job End Date (Date)
- [ ] Number of Personnel (Number)
- [ ] Location/Venue (Text)
- [ ] Special Requirements (Multi-line)
- [ ] Budget/Quote Range (Text)
- [ ] Intake Source (Dropdown)
- [ ] AI Analysis (Multi-line)
- [ ] Client Company (Text)

### Contact Fields
- [ ] Preferred Contact Method (Dropdown)
- [ ] Client Type (Dropdown)
- [ ] Total Job Requests (Number)

### Pipeline
- [ ] "Job Requests" pipeline created
- [ ] 10 stages configured (New Request → Completed/Cancelled/Lost)

---

## After You Create These Fields

Once you've created all the custom fields in GHL:

1. Run the configuration script:
   ```bash
   cd replit-middleware
   npm run get-config
   ```

2. This will give you:
   - Pipeline ID
   - Stage IDs
   - User IDs for department assignment

3. Add those to your Replit Secrets

4. Your intake form will automatically populate these fields when tickets are created!

---

## Testing Your Fields

After setup, test by creating a manual opportunity in GHL:

1. Go to Opportunities → New Opportunity
2. Fill in the custom fields
3. Verify all fields appear and work correctly
4. Then test with the API via the middleware

---

## Field Mapping Reference

When the intake form submits, here's how data maps to GHL:

| Form Field | GHL Custom Field | Object |
|------------|------------------|--------|
| Client Name | name | Contact |
| Email | email | Contact |
| Phone | phone | Contact |
| Company | client_company | Contact & Opportunity |
| Request Type | request_type | Opportunity |
| Urgency | urgency_level | Opportunity |
| Description | description | Opportunity |
| Start Date | job_start_date | Opportunity |
| End Date | job_end_date | Opportunity |
| Personnel Needed | personnel_count | Opportunity |
| Location | job_location | Opportunity |
| Departments | departments_needed | Opportunity |
| Special Notes | special_requirements | Opportunity |

---

## Need Help?

If you run into issues:

1. Make sure field keys match exactly (case-sensitive)
2. Verify you're adding to the correct object (Contact vs Opportunity)
3. Check that dropdown options match the list above
4. Test with a manual opportunity creation first

Once these are set up, your intake form will work beautifully! 🎉
