# GoHighLevel Integration Guide

Complete guide to integrating your solar landing pages with GoHighLevel CRM.

## Table of Contents

1. [Overview](#overview)
2. [Setup GoHighLevel API](#setup-gohighlevel-api)
3. [Building Pages in GoHighLevel](#building-pages-in-gohighlevel)
4. [Form Integration](#form-integration)
5. [Automation Workflows](#automation-workflows)
6. [Calendar Integration](#calendar-integration)
7. [SMS & Email Sequences](#sms--email-sequences)
8. [Webhooks Configuration](#webhooks-configuration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This integration allows you to:
- ✅ Capture leads directly into GoHighLevel
- ✅ Trigger automated follow-up sequences
- ✅ Book appointments via embedded calendar
- ✅ Track lead scoring and status
- ✅ Send SMS and email campaigns
- ✅ Generate reports and analytics

---

## Setup GoHighLevel API

### Step 1: Get API Key

1. Log in to your GoHighLevel account
2. Go to **Settings** → **API Key**
3. Click **Create API Key**
4. Give it a name: "Solar Landing Pages"
5. Copy the API key (you'll need this)

### Step 2: Configure Environment Variables

Add to your backend `.env` file:

```bash
GHL_API_URL=https://rest.gohighlevel.com/v1
GHL_API_KEY=your_api_key_here
GHL_LOCATION_ID=your_location_id_here
```

To find your Location ID:
1. Go to **Settings** → **Business Profile**
2. Copy the Location ID

### Step 3: Test API Connection

```bash
# Test API connection
curl -X GET "https://rest.gohighlevel.com/v1/contacts/" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Building Pages in GoHighLevel

### Method 1: Import HTML to GoHighLevel (Recommended)

GoHighLevel allows you to create custom pages using their page builder or custom HTML.

#### Step-by-Step:

1. **Login to GoHighLevel**
   - Navigate to **Sites** → **Funnels/Websites**

2. **Create New Funnel**
   - Click **+ Create Funnel**
   - Name: "Solar Landing Pages A/B Test"
   - Type: Lead Generation

3. **Add Custom Page**
   - Click **+ Add Step**
   - Select **Custom Code**
   - Name: "Solar Landing Page - Version A"

4. **Import HTML**
   - Copy the entire contents of `version-a/index.html`
   - Paste into the Custom Code editor
   - Click **Save**

5. **Update Form Action**
   Since you're in GoHighLevel, you can use their native form functionality:

   ```html
   <!-- Replace the form in the HTML with GoHighLevel form -->
   <form id="lead-form" class="space-y-4" data-ghl-form="FORM_ID">
       <!-- Keep all form fields the same -->
   </form>
   ```

6. **Repeat for Version B**
   - Create another page for Version B
   - Import `version-b/index.html`

### Method 2: Use External Hosting + GHL Forms

If you want to host pages externally (Cloudflare/Vercel) but use GHL forms:

1. **Create Form in GoHighLevel**
   - Go to **Sites** → **Forms**
   - Click **+ Create Form**
   - Design your form with these fields:
     - Address (text)
     - Name (text)
     - Phone (phone)
     - Electric Bill (dropdown)
     - Roof Shade (radio buttons)
     - SMS Opt-in (checkbox)

2. **Get Form Embed Code**
   - Click **Embed**
   - Copy the iframe code or JavaScript code

3. **Add to Your Landing Page**
   ```html
   <!-- Replace the form section with GHL embed -->
   <div id="ghl-form-container">
       <iframe src="https://app.gohighlevel.com/form/YOUR_FORM_ID"
               width="100%"
               height="800"
               frameborder="0">
       </iframe>
   </div>
   ```

### Method 3: Custom Integration (Most Flexible)

Keep your landing pages as-is and send data to GoHighLevel via API.

This is already set up in `backend/server.js` in the `sendToGoHighLevel()` function.

---

## Form Integration

### Option A: GoHighLevel Native Forms

**Advantages:**
- No backend needed
- Automatic CRM integration
- Built-in spam protection
- Easy workflow triggers

**Setup:**

1. Create form in GHL (as shown above)
2. Embed in your landing page
3. Style the iframe to match your design

**Styling the Form:**

```css
/* Add to your CSS */
#ghl-form-container iframe {
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
```

### Option B: Custom Forms with API Integration

**Advantages:**
- Full design control
- Custom validation
- Multi-step forms
- Advanced tracking

**Already implemented in this project!**

The backend `server.js` sends leads to GoHighLevel automatically.

**Verify Integration:**

1. Submit a test form on your landing page
2. Check GoHighLevel → **Contacts**
3. You should see the new contact with:
   - Name, Phone, Email, Address
   - Custom fields: Electric Bill, Roof Shade
   - Tags: "Solar Lead", "Landing Page"

---

## Automation Workflows

### Create Follow-Up Workflow

1. **Go to Automations**
   - Navigate to **Marketing** → **Workflows**
   - Click **+ Create Workflow**

2. **Set Trigger**
   - Trigger: **Contact Tag Added**
   - Tag: "Solar Lead"

3. **Add Actions**

   **Immediate Actions (within 1 minute):**
   ```
   1. Send SMS → "Hi [First Name], this is Mike from Solar Power Florida..."
   2. Send Email → Welcome email with savings calculator
   3. Assign to User → Assign to sales rep based on location
   4. Create Opportunity → Create deal in pipeline
   ```

   **Follow-Up Sequence (if no response):**
   ```
   Wait 5 minutes
   → IF no response:
      → Send SMS → "Just wanted to make sure you got my message..."

   Wait 1 hour
   → IF no response:
      → Call Action → Trigger automatic dialer

   Wait 4 hours
   → IF no response:
      → Send Email → "Here's what other Florida homeowners are saving..."

   Wait 1 day
   → IF no response:
      → Send SMS → "Last chance to lock in your rate..."

   Wait 3 days
   → IF still no response:
      → Add Tag "Cold Lead"
      → Move to nurture campaign
   ```

4. **Save and Activate Workflow**

### Lead Scoring Workflow

```
IF electric_bill is "300+"
   → Add 30 points to lead score
   → Add tag "High Value Lead"
   → Notify sales manager

IF roof_shade is "full-sun"
   → Add 20 points to lead score
   → Add tag "Ideal Candidate"

IF lead_score > 80
   → Priority notification to sales team
   → Assign to top closer
```

---

## Calendar Integration

### Embed GoHighLevel Calendar on Thank You Page

1. **Create Calendar**
   - Go to **Calendar** → **Settings**
   - Click **+ Create Calendar**
   - Name: "Solar Consultation"
   - Duration: 30 minutes
   - Buffer: 15 minutes

2. **Get Embed Code**
   - Click on calendar
   - Click **Share & Embed**
   - Copy the embed code

3. **Add to Thank You Page**

Create a thank you page (`thank-you.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - Book Your Consultation</title>
    <link href="https://cdn.tailwindcss.com" rel="stylesheet">
</head>
<body class="bg-gray-100">
    <div class="max-w-4xl mx-auto px-4 py-12">
        <div class="bg-white rounded-lg shadow-xl p-8">
            <!-- Success Message -->
            <div class="text-center mb-8">
                <div class="text-6xl mb-4">🎉</div>
                <h1 class="text-4xl font-black text-gray-900 mb-4">
                    Congratulations!
                </h1>
                <p class="text-xl text-gray-700">
                    You're one step closer to saving thousands on your electric bills!
                </p>
            </div>

            <!-- What Happens Next -->
            <div class="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-green-900 mb-4">
                    What Happens Next:
                </h2>
                <ol class="space-y-3 text-lg">
                    <li class="flex items-start">
                        <span class="font-black text-green-600 mr-3">1.</span>
                        <span>You'll receive a text message in the next 2 minutes</span>
                    </li>
                    <li class="flex items-start">
                        <span class="font-black text-green-600 mr-3">2.</span>
                        <span>Our solar specialist will call you to discuss your savings</span>
                    </li>
                    <li class="flex items-start">
                        <span class="font-black text-green-600 mr-3">3.</span>
                        <span>We'll schedule a free site assessment</span>
                    </li>
                </ol>
            </div>

            <!-- Calendar Embed -->
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-4 text-center">
                    Or Book Your Consultation Now:
                </h2>

                <!-- GoHighLevel Calendar Embed -->
                <iframe
                    src="https://app.gohighlevel.com/widget/booking/YOUR_CALENDAR_ID"
                    style="width: 100%; border: none; overflow: hidden; height: 800px;"
                    scrolling="no"
                    id="YOUR_CALENDAR_ID">
                </iframe>
            </div>

            <!-- Video Testimonial -->
            <div class="mb-8">
                <h3 class="text-xl font-bold text-gray-900 mb-4">
                    While You Wait, Watch How We Helped John Save $397/Month:
                </h3>
                <div class="aspect-w-16 aspect-h-9">
                    <iframe
                        src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                        frameborder="0"
                        allowfullscreen
                        class="w-full h-full rounded-lg">
                    </iframe>
                </div>
            </div>

            <!-- Social Proof -->
            <div class="text-center">
                <p class="text-gray-600 mb-4">Join 2,847 Florida homeowners this month!</p>
                <div class="flex justify-center gap-4">
                    <span class="bg-gray-200 px-4 py-2 rounded">⭐⭐⭐⭐⭐ 4.9/5</span>
                    <span class="bg-gray-200 px-4 py-2 rounded">BBB A+</span>
                    <span class="bg-gray-200 px-4 py-2 rounded">537 Reviews</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Tracking -->
    <script>
        // Track thank you page view
        if (typeof gtag !== 'undefined') {
            gtag('event', 'conversion', {
                'send_to': 'YOUR_GA4_ID',
                'value': 1.0,
                'currency': 'USD'
            });
        }
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead');
        }
    </script>
</body>
</html>
```

---

## SMS & Email Sequences

### SMS Templates

**Immediate Response (sent via workflow):**
```
Hi [First Name]! This is Mike from Solar Power Florida.

I saw you're interested in cutting your power bill. I have your address as [Address].

When's the best time for a quick 5-min call today?

Reply YES to schedule or call me: (555) 123-4567
```

**Follow-Up SMS (after 5 minutes, no response):**
```
[First Name], just wanted to make sure you got my message!

Quick question: What's your biggest concern about going solar?

A) Upfront cost
B) Installation time
C) Not sure if I qualify
D) Something else

Reply with A, B, C, or D
```

**Urgency SMS (after 1 day):**
```
⚡ [First Name], we only have 3 installation spots left this month in [City].

Your neighbors are locking in their rates before the utility increase.

Don't miss out on $72,892 in incentives!

Book now: [Calendar Link]
```

### Email Templates

**Email 1: Welcome + Value** (Immediate)
```
Subject: Your Solar Savings Calculation for [Address]

Hi [First Name],

Thank you for checking if you qualify for solar savings at [Address]!

Based on your electric bill range of [Electric Bill Range], here's what you could save:

💰 Monthly Savings: $XXX - $XXX
💰 25-Year Savings: $XX,XXX
💰 Federal Tax Credit: $18,500
💰 Florida Rebates: $6,500

TOTAL INCENTIVES: Up to $72,892

[CTA Button: Book My Free Assessment]

What happens next?
1. Quick 5-minute consultation call
2. Free site assessment (virtual or in-person)
3. Custom proposal with exact savings
4. Installation in as little as 30 days

Questions? Call or text: (555) 123-4567

Best regards,
Mike Johnson
Solar Consultant
Solar Power Florida

P.S. We only have 12 installation spots left this month. Book now to secure yours!
```

**Email 2: Social Proof** (After 4 hours, no response)
```
Subject: How Your Neighbors Saved $45K+ on Solar

Hi [First Name],

I wanted to share how other homeowners in [City] are saving with solar:

[Video Thumbnail] Sarah M. - Tampa
"We're saving $287/month. Wish we did this sooner!"
[Watch Video]

[Video Thumbnail] Mike R. - [City]
"Paid off our system in 7 years. Now pure profit!"
[Watch Video]

[Video Thumbnail] Jennifer L. - Orlando
"Our home value went up $45,000!"
[Watch Video]

Ready to join them?
[CTA Button: Yes, Show Me My Savings]

Best,
Mike
```

**Email 3: Objection Handling** (After 1 day)
```
Subject: "Is solar really worth it?" - [First Name]

Hi [First Name],

I get it. You're skeptical.

So were the 2,847 Florida homeowners who switched this month.

Here's what they asked before going solar:

❓ "What if I move?"
✅ Solar adds $40K+ to home value. You win either way.

❓ "What about hurricanes?"
✅ Panels withstand Cat 5 winds. 25-year warranty.

❓ "Too expensive?"
✅ $0 down. Pay less than your current electric bill.

❓ "Is this a scam?"
✅ BBB A+, 537 reviews, licensed & bonded.

Still have questions? Let's talk.
[CTA Button: Book a Call]

Best,
Mike

P.S. The federal tax credit is dropping from 30% to 26% soon. That's thousands of dollars you'll lose by waiting.
```

---

## Webhooks Configuration

### Set Up Webhook in GoHighLevel

1. **Go to Settings → Webhooks**
2. **Create New Webhook**
   - Event: **Contact Created**
   - URL: `https://your-api.com/api/ghl-webhook`
   - Method: POST

3. **Add Webhook Handler in Backend**

Add to `backend/server.js`:

```javascript
// GoHighLevel Webhook Handler
app.post('/api/ghl-webhook', express.json(), async (req, res) => {
    try {
        const { type, contact, customFields } = req.body;

        console.log('GoHighLevel webhook received:', type);

        // Process webhook based on type
        if (type === 'Contact.Create') {
            // Update lead score in database
            await pool.query(
                'UPDATE leads SET ghl_contact_id = $1 WHERE phone = $2',
                [contact.id, contact.phone]
            );

            // Trigger additional actions
            // - Send to Slack
            // - Update analytics
            // - Trigger other integrations
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});
```

---

## Troubleshooting

### Common Issues

**1. Leads Not Appearing in GoHighLevel**

Check:
- ✅ API key is correct
- ✅ Location ID is correct
- ✅ Check backend logs: `pm2 logs solar-api`
- ✅ Test API manually:
  ```bash
  curl -X POST "https://rest.gohighlevel.com/v1/contacts/" \
    -H "Authorization: Bearer YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Test","lastName":"User","phone":"5551234567"}'
  ```

**2. Calendar Not Embedding**

- ✅ Check iframe URL is correct
- ✅ Verify calendar is published
- ✅ Check for CORS issues
- ✅ Test in incognito mode

**3. SMS Not Sending**

- ✅ Verify phone number is in E.164 format (+1XXXXXXXXXX)
- ✅ Check SMS credits in GHL
- ✅ Verify workflow is active
- ✅ Check contact has phone number

**4. Workflow Not Triggering**

- ✅ Verify tag is added to contact
- ✅ Check workflow is published (not draft)
- ✅ Review workflow history in GHL
- ✅ Check trigger conditions

---

## Best Practices

1. **Test Everything**
   - Submit test leads regularly
   - Check all workflows fire correctly
   - Verify calendar bookings work
   - Test SMS and email delivery

2. **Monitor Lead Quality**
   - Review lead scores weekly
   - Track conversion rates
   - Identify best traffic sources
   - Optimize based on data

3. **Keep CRM Clean**
   - Remove duplicate contacts
   - Archive old leads
   - Update custom fields as needed
   - Maintain tag organization

4. **Response Time**
   - Aim for <5 minute response time
   - Have backup staff for coverage
   - Use automation for after-hours
   - Track response metrics

---

## Advanced Features

### Lead Scoring in GHL

Set up custom fields for lead scoring:

1. **Create Custom Field**
   - Name: "Lead Score"
   - Type: Number
   - Default: 50

2. **Update Score via Workflow**
   ```
   IF electric_bill = "300+" → Add 30 to Lead Score
   IF roof_shade = "full-sun" → Add 20 to Lead Score
   IF sms_optin = true → Add 10 to Lead Score
   ```

3. **Prioritize High-Score Leads**
   ```
   IF Lead Score > 80
   → Add tag "Hot Lead"
   → Assign to top closer
   → Send urgent notification
   ```

### Multi-Location Setup

If you have multiple locations:

1. Create separate sub-accounts in GHL
2. Route leads based on address
3. Use location-specific phone numbers
4. Customize messaging per region

---

## Resources

- [GoHighLevel API Documentation](https://highlevel.stoplight.io/docs/integrations/)
- [GHL Community Forum](https://community.gohighlevel.com/)
- [Video Tutorials](https://help.gohighlevel.com/)

---

**Last Updated:** 2024-11-23
**Version:** 1.0.0
