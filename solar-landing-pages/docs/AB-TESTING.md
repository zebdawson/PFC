# A/B Testing & Analytics Guide

Complete guide to running split tests and analyzing performance of your solar landing pages.

## Table of Contents

1. [Overview](#overview)
2. [A/B Testing Strategy](#ab-testing-strategy)
3. [Setup Instructions](#setup-instructions)
4. [Traffic Distribution](#traffic-distribution)
5. [Tracking & Measurement](#tracking--measurement)
6. [Statistical Significance](#statistical-significance)
7. [Analyzing Results](#analyzing-results)
8. [Optimization Recommendations](#optimization-recommendations)

---

## Overview

You have two landing page versions to test:

**Version A (Fear-Based):**
- Headline: "The Power Company Is Robbing You Blind"
- Emotional trigger: Fear of loss, rising costs
- CTA color: Orange/Red (danger)
- Messaging: Urgent, problem-focused

**Version B (Opportunity-Based):**
- Headline: "Florida Homeowners Are Getting Paid to Go Solar"
- Emotional trigger: FOMO, financial opportunity
- CTA color: Green (growth/money)
- Messaging: Positive, benefit-focused

**Goal:** Determine which approach converts cold traffic better.

**Target Metrics:**
- Primary: Form completion rate (target: 15%+)
- Secondary: Cost per lead, lead quality score

---

## A/B Testing Strategy

### Test Plan

**Duration:** 14-30 days (recommended)
**Traffic Split:** 50/50 (equal distribution)
**Minimum Sample Size:** 1,000 visitors per version
**Significance Level:** 95% confidence

### What We're Testing

| Element | Version A | Version B |
|---------|-----------|-----------|
| **Headline** | Fear-based | Opportunity-based |
| **Color Scheme** | Orange/Red | Green |
| **Messaging Tone** | Urgent, negative | Positive, opportunistic |
| **Social Proof** | Problem validation | Success stories |
| **CTA Copy** | "Lock My Rate" | "Claim My Incentives" |

### Success Criteria

**Version wins if:**
- ✅ Conversion rate is >2% higher than other version
- ✅ Statistical significance >95%
- ✅ Lead quality score is equal or better
- ✅ Cost per lead is equal or lower

---

## Setup Instructions

### Method 1: Using Cloudflare Workers (Recommended)

Cloudflare Workers can randomly distribute traffic between your two versions.

**Step 1: Deploy Both Versions**

```bash
# Deploy Version A
vercel --prod version-a/
# Output: https://solar-a.yourdomain.com

# Deploy Version B
vercel --prod version-b/
# Output: https://solar-b.yourdomain.com
```

**Step 2: Create Cloudflare Worker**

```javascript
// Cloudflare Worker for A/B Testing
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Check if user has been assigned a version (cookie)
  const cookies = request.headers.get('Cookie') || ''
  const versionMatch = cookies.match(/ab_test_version=([AB])/)

  let version
  if (versionMatch) {
    // User has existing cookie, use same version
    version = versionMatch[1]
  } else {
    // New user, randomly assign 50/50
    version = Math.random() < 0.5 ? 'A' : 'B'
  }

  // Define destination URLs
  const destinations = {
    'A': 'https://solar-a.yourdomain.com',
    'B': 'https://solar-b.yourdomain.com'
  }

  // Fetch from appropriate version
  const targetUrl = destinations[version] + url.pathname + url.search

  // Make request
  const response = await fetch(targetUrl)

  // Clone response so we can modify headers
  const newResponse = new Response(response.body, response)

  // Set cookie to persist version for this user
  newResponse.headers.set(
    'Set-Cookie',
    `ab_test_version=${version}; Path=/; Max-Age=2592000; SameSite=Strict`
  )

  // Add custom header for tracking
  newResponse.headers.set('X-AB-Test-Version', version)

  return newResponse
}
```

**Step 3: Deploy Worker**

1. Go to Cloudflare Dashboard
2. Navigate to **Workers & Pages**
3. Click **Create Application** → **Create Worker**
4. Paste the code above
5. Deploy
6. Set up route: `yourdomain.com/*`

### Method 2: Using Google Optimize

**Step 1: Install Google Optimize**

```html
<!-- Add to both version-a and version-b index.html -->
<script src="https://www.googleoptimize.com/optimize.js?id=YOUR_OPTIMIZE_ID"></script>
```

**Step 2: Create Experiment**

1. Go to Google Optimize
2. Create new A/B test
3. Original page: Version A URL
4. Variant: Version B URL
5. Set traffic allocation: 50/50
6. Add objective: Form submission
7. Start experiment

### Method 3: Server-Side Split (Backend)

Add to your backend `server.js`:

```javascript
app.get('/', (req, res) => {
    // Check for existing cookie
    let version = req.cookies.ab_version

    if (!version) {
        // Assign random version
        version = Math.random() < 0.5 ? 'A' : 'B'

        // Set cookie for 30 days
        res.cookie('ab_version', version, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true
        })
    }

    // Redirect to appropriate version
    const urls = {
        'A': 'https://solar-a.yourdomain.com',
        'B': 'https://solar-b.yourdomain.com'
    }

    res.redirect(urls[version])
})
```

---

## Traffic Distribution

### Setting Up Traffic Sources

When running paid ads, use UTM parameters to track source performance:

```
Version A: https://yourdomain.com/?utm_source=facebook&utm_medium=paid&utm_campaign=solar_q4&utm_content=version_a

Version B: https://yourdomain.com/?utm_source=facebook&utm_medium=paid&utm_campaign=solar_q4&utm_content=version_b
```

### Traffic Allocation

**Week 1-2:** Equal 50/50 split
- Gather baseline data
- Ensure both versions are working
- Check for technical issues

**Week 3+:** Analyze and optimize
- If one version clearly winning, shift traffic
- 70/30 split to winning version
- Keep testing to confirm results

**Example Traffic Shift:**
```
Initial: Version A (50%) | Version B (50%)

After 2 weeks, Version B converting 18% vs Version A 12%:
→ Shift to: Version A (30%) | Version B (70%)

After 4 weeks, Version B still winning:
→ Final: Version B (100%) - Declare winner
```

---

## Tracking & Measurement

### Google Analytics 4 Setup

**1. Create Custom Events**

Add to `main.js`:

```javascript
// Track page version view
function trackPageVersion() {
    const version = document.body.dataset.version || 'A'

    gtag('event', 'page_view', {
        'page_version': version,
        'page_location': window.location.href
    })
}

// Track form submission by version
function trackFormSubmission(version) {
    gtag('event', 'generate_lead', {
        'page_version': version,
        'value': 1.0,
        'currency': 'USD'
    })
}
```

**2. Create Custom Dimensions**

In Google Analytics 4:
1. Go to **Configure** → **Custom Definitions**
2. Create custom dimension:
   - Dimension name: "Page Version"
   - Scope: Event
   - Parameter: page_version

**3. Create Comparison Report**

1. Go to **Reports** → **Exploration**
2. Create new exploration
3. Add dimensions: Page version, Event name
4. Add metrics: Users, Conversions, Conversion rate
5. Filter: Event name = "generate_lead"

### Facebook Pixel Tracking

Add custom parameters to track versions:

```javascript
fbq('trackCustom', 'PageView_VersionA', {
    version: 'A',
    test_name: 'fear_vs_opportunity'
})

// On conversion
fbq('trackCustom', 'Lead_VersionA', {
    version: 'A',
    value: 1.0
})
```

### Database Tracking

Your backend already tracks `page_version` in the leads table.

**Query for conversion rates:**

```sql
SELECT
    page_version,
    COUNT(*) as total_leads,
    AVG(lead_score) as avg_score,
    COUNT(CASE WHEN lead_score >= 70 THEN 1 END) as high_quality_leads,
    ROUND(
        COUNT(CASE WHEN lead_score >= 70 THEN 1 END)::numeric / COUNT(*) * 100,
        2
    ) as quality_rate
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY page_version;
```

---

## Statistical Significance

### Sample Size Calculator

Minimum sample size formula:
```
n = (Z² × p × (1-p)) / E²

Where:
- Z = 1.96 (for 95% confidence)
- p = estimated conversion rate (0.15 or 15%)
- E = margin of error (0.03 or 3%)

n = (1.96² × 0.15 × 0.85) / 0.03²
n ≈ 544 conversions per version
```

**For 15% conversion rate:**
- Need ~3,627 visitors per version
- Total: ~7,254 visitors

### Statistical Significance Calculator

Use this online tool: https://www.optimizely.com/sample-size-calculator/

**Or calculate manually:**

```python
# Python script to calculate significance
from scipy import stats

# Version A results
visitors_a = 5000
conversions_a = 600  # 12% conversion rate

# Version B results
visitors_b = 5000
conversions_b = 900  # 18% conversion rate

# Chi-square test
observed = [[conversions_a, visitors_a - conversions_a],
            [conversions_b, visitors_b - conversions_b]]

chi2, p_value = stats.chi2_contingency(observed)[:2]

print(f"P-value: {p_value}")
print(f"Significant: {p_value < 0.05}")
```

**Results Interpretation:**
- p-value < 0.05 = Statistically significant (95% confidence)
- p-value < 0.01 = Highly significant (99% confidence)

---

## Analyzing Results

### Key Metrics Dashboard

Create a spreadsheet to track:

| Metric | Version A | Version B | Difference | Winner |
|--------|-----------|-----------|------------|--------|
| **Visitors** | 5,247 | 5,183 | - | - |
| **Form Starts** | 1,574 (30%) | 1,659 (32%) | +2% | B |
| **Completions** | 629 (12%) | 933 (18%) | +6% | **B** |
| **Avg Lead Score** | 62 | 71 | +9 pts | **B** |
| **Cost Per Click** | $2.50 | $2.50 | - | - |
| **Cost Per Lead** | $20.83 | $13.89 | -33% | **B** |
| **Quality Leads** | 189 (30%) | 420 (45%) | +15% | **B** |

### Conversion Funnel Analysis

Track drop-off at each step:

**Version A:**
```
Page View: 5,247 (100%)
  ↓
Form Start: 1,574 (30%) ← 70% drop-off
  ↓
Step 2: 1,103 (70% of starts) ← 30% drop-off
  ↓
Step 3: 827 (75% of step 2) ← 25% drop-off
  ↓
Completed: 629 (76% of step 3) ← 24% drop-off
```

**Version B:**
```
Page View: 5,183 (100%)
  ↓
Form Start: 1,659 (32%) ← 68% drop-off (Better!)
  ↓
Step 2: 1,244 (75% of starts) ← 25% drop-off (Better!)
  ↓
Step 3: 1,057 (85% of step 2) ← 15% drop-off (Better!)
  ↓
Completed: 933 (88% of step 3) ← 12% drop-off (Better!)
```

**Analysis:** Version B has better engagement at every step!

### Heatmap Analysis

Use Microsoft Clarity to compare:

**Version A Observations:**
- Users scrolling past main CTA
- Confusion on multi-step form
- High exit rate on step 3

**Version B Observations:**
- More clicks on value proposition
- Better form progression
- Lower exit rates

---

## Optimization Recommendations

### After Declaring Winner (Version B)

Don't stop testing! Now optimize the winning version:

### Test #2: CTA Button Copy

**Current:** "YES! CLAIM MY INCENTIVES NOW →"

**Variations to test:**
- A: "YES! CLAIM MY INCENTIVES NOW →"
- B: "Get My Free Savings Report →"
- C: "Calculate My Savings (Free) →"
- D: "See How Much I Can Save →"

### Test #3: Form Length

**Current:** 4-step form

**Variations:**
- A: 4 steps (current)
- B: 2 steps (combine steps)
- C: 1 long form (all at once)
- D: 5 steps (more granular)

### Test #4: Social Proof Position

**Current:** Below hero

**Variations:**
- A: Below hero (current)
- B: Above hero (in hero section)
- C: Floating ticker (always visible)
- D: Multiple locations

### Test #5: Value Proposition

**Current:** "Up to $72,892 in incentives"

**Variations:**
- A: $72,892 total value
- B: $397/month savings
- C: $47,892 over 25 years
- D: 73-91% bill reduction

---

## Continuous Optimization

### Weekly Review Checklist

- [ ] Check conversion rates (Version A vs B)
- [ ] Review lead quality scores
- [ ] Analyze traffic sources
- [ ] Check form abandonment rates
- [ ] Review heatmaps and session recordings
- [ ] Calculate cost per lead
- [ ] Check page load speeds
- [ ] Review customer feedback

### Monthly Deep Dive

- [ ] Run statistical significance tests
- [ ] Segment analysis by traffic source
- [ ] Analyze conversion paths
- [ ] Review competitor landing pages
- [ ] Survey converted customers
- [ ] Test new hypotheses
- [ ] Update creative assets
- [ ] Optimize for seasonal trends

---

## Tools & Resources

### Essential Tools

1. **Google Analytics 4** (Free)
   - Traffic analysis
   - Conversion tracking
   - Funnel visualization

2. **Microsoft Clarity** (Free)
   - Heatmaps
   - Session recordings
   - Rage clicks analysis

3. **Hotjar** (Paid, but worth it)
   - Advanced heatmaps
   - Form analytics
   - Feedback polls

4. **Optimizely** (Enterprise)
   - Advanced A/B testing
   - Multivariate testing
   - AI-powered optimization

### Calculators

- Sample Size: https://www.optimizely.com/sample-size-calculator/
- Statistical Significance: https://www.surveymonkey.com/mp/ab-testing-significance-calculator/
- Conversion Rate: https://www.calculator.net/conversion-rate-calculator.html

### Learning Resources

- Google Analytics Academy (Free courses)
- ConversionXL Blog (CRO best practices)
- A/B Testing Mastery (Udemy course)

---

## Reporting Template

### Weekly A/B Test Report

```
📊 Solar Landing Pages A/B Test - Week [X]

Test Duration: [Start Date] to [End Date]
Status: [In Progress / Completed]

📈 RESULTS:

Version A (Fear-Based):
- Visitors: X,XXX
- Conversions: XXX (XX%)
- Cost per Lead: $XX.XX
- Avg Lead Score: XX

Version B (Opportunity-Based):
- Visitors: X,XXX
- Conversions: XXX (XX%)
- Cost per Lead: $XX.XX
- Avg Lead Score: XX

🏆 WINNER: Version [A/B]
- Conversion Rate Improvement: +XX%
- Cost Reduction: -XX%
- Statistical Significance: XX%

📌 KEY INSIGHTS:
1. [Insight 1]
2. [Insight 2]
3. [Insight 3]

🎯 NEXT STEPS:
1. [Action 1]
2. [Action 2]
3. [Action 3]

💡 RECOMMENDATIONS:
- [Recommendation 1]
- [Recommendation 2]
```

---

## Conclusion

A/B testing is not a one-time event—it's a continuous process of optimization.

**The Goal:** Get to 20%+ conversion rate on cold traffic

**How:**
1. Test major changes (like Version A vs B)
2. Pick a winner
3. Test incremental improvements
4. Repeat forever

**Remember:**
- Always be testing
- Data beats opinions
- Small improvements compound
- Speed matters (2 sec load time)
- Mobile-first design
- Trust signals are crucial

---

**Last Updated:** 2024-11-23
**Version:** 1.0.0
