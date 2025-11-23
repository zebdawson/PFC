# Customization Guide

Complete guide to customizing your solar landing pages for your specific location, branding, and business needs.

## Table of Contents

1. [Quick Customizations](#quick-customizations)
2. [Branding & Design](#branding--design)
3. [Copy & Messaging](#copy--messaging)
4. [Form Modifications](#form-modifications)
5. [Tracking & Analytics](#tracking--analytics)
6. [Advanced Customizations](#advanced-customizations)

---

## Quick Customizations

### 1. Update Location (Florida → Your State)

**Files to edit:**
- `version-a/index.html`
- `version-b/index.html`
- `shared/js/main.js`

**Find and replace:**
```
Florida → Your State
Orlando, Tampa, Jacksonville → Your Cities
Duke Energy → Your Local Utility Company
```

**Example for California:**
```html
<!-- Before -->
<h1>Florida Homeowners Are Getting Paid to Go Solar</h1>

<!-- After -->
<h1>California Homeowners Are Getting Paid to Go Solar</h1>
```

**Update cities in live feed:**
```javascript
// In shared/js/main.js, line ~XX
const cities = [
    'Los Angeles', 'San Diego', 'San Francisco', 'Sacramento',
    'San Jose', 'Fresno', 'Long Beach', 'Oakland'
];
```

### 2. Update Contact Information

**Find in both landing pages:**
```html
<!-- Phone number -->
<a href="tel:+15551234567">(555) 123-4567</a>

<!-- Email -->
<a href="mailto:noreply@yourdomain.com">noreply@yourdomain.com</a>

<!-- Address in footer -->
<p>123 Solar St, Orlando, FL 32801</p>
```

**Replace with your actual contact info.**

### 3. Update Company Name & License

```html
<!-- Find -->
Solar Power Florida

<!-- Replace with -->
Your Company Name

<!-- Update license number -->
FL License #12345 → Your State License #XXXXX
```

### 4. Update Incentive Amounts

The incentive amounts should reflect current federal and state programs:

```html
<!-- Federal Tax Credit (currently 30%) -->
<strong>$18,500</strong> - Current federal tax credit

<!-- State Rebates (varies by state) -->
<strong>$6,500</strong> - Florida solar incentives

<!-- Update these based on:
- Current IRS solar tax credit percentage
- Your state's specific rebate programs
- Average system cost in your area
-->
```

**How to calculate:**

```
Average System Cost: $60,000
Federal Tax Credit (30%): $60,000 × 0.30 = $18,000
State Rebate: (Check your state energy office)
Total Incentives: Federal + State
```

---

## Branding & Design

### Update Color Scheme

**Version A uses Orange/Red theme:**
```css
/* Find and replace these hex codes: */
#FF6B35 → Your primary color
#FF8555 → Your secondary color
```

**Version B uses Green theme:**
```css
/* Find and replace: */
#10B981 → Your primary color
#059669 → Your secondary color
```

**Using Find & Replace in your editor:**
1. Open `version-a/index.html`
2. Find: `#FF6B35`
3. Replace: `#YOUR_HEX_COLOR`
4. Replace All

**Tailwind color classes:**
```html
<!-- Find -->
bg-orange-500
text-orange-600
border-orange-500

<!-- Replace with -->
bg-blue-500
text-blue-600
border-blue-500
```

### Add Your Logo

**Step 1: Prepare logo file**
- Format: PNG with transparent background
- Size: 200px wide × 60px tall (recommended)
- Save as: `shared/images/logo.png`

**Step 2: Add logo to pages**

```html
<!-- Add this at the top of the hero section -->
<div class="text-center mb-8">
    <img src="../shared/images/logo.png" alt="Your Company Name" class="h-16 mx-auto">
</div>
```

### Update Trust Badges

```html
<!-- Current -->
<div class="bg-white px-4 py-2 rounded-lg shadow-md">
    <p class="text-sm text-gray-900 font-bold">BBB A+ Rated</p>
</div>

<!-- Add custom badges -->
<div class="bg-white px-4 py-2 rounded-lg shadow-md">
    <img src="path-to-your-badge.png" alt="Badge" class="h-8">
</div>
```

### Change Fonts

**Current font:** Inter (Google Fonts)

**To use a different font:**

```html
<!-- Replace this line in <head> -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">

<!-- With your font, e.g., Montserrat -->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
```

Then update the CSS:
```css
* {
    font-family: 'Montserrat', sans-serif; /* Changed from Inter */
}
```

---

## Copy & Messaging

### Update Headlines

**Version A (Fear-Based):**

Current:
```html
<h1>The Power Company Is Robbing You Blind</h1>
```

Alternative headlines to test:
```html
<h1>Stop Overpaying Your Power Company by $XXX/Month</h1>
<h1>Your Electric Bill Is About to Get Worse (Unless You Do This)</h1>
<h1>Power Companies Don't Want You to Know This Secret</h1>
```

**Version B (Opportunity-Based):**

Current:
```html
<h1>Florida Homeowners Are Getting Paid to Go Solar</h1>
```

Alternatives:
```html
<h1>Get Paid Up to $72,892 to Go Solar in [Your State]</h1>
<h1>Turn Your Roof Into a Money-Making Machine</h1>
<h1>The Government Is Paying [Your State] Homeowners to Install Solar</h1>
```

### Update Value Stack Numbers

Based on your market:

```html
<!-- Calculate average savings for your area -->
<li>
    <strong class="font-black">$47,892</strong> - What you'll save over 25 years
</li>

<!-- Formula: -->
<!-- Average monthly electric bill × 12 months × 25 years × 0.80 (80% reduction) -->
<!-- Example: $200 × 12 × 25 × 0.80 = $48,000 -->
```

### Update CTA (Call-to-Action) Text

**Current CTAs:**
- "YES! LOCK MY RATE BEFORE IT EXPIRES →"
- "YES! CLAIM MY INCENTIVES NOW →"

**Test these alternatives:**
```html
<button>Get My Free Solar Quote →</button>
<button>Calculate My Savings Now →</button>
<button>See If I Qualify (Free) →</button>
<button>Get My Custom Proposal →</button>
<button>Book My Free Assessment →</button>
```

### Update FAQ Section

Add questions specific to your area:

```html
<div class="bg-white rounded-lg shadow-lg p-6 md:p-8">
    <h3 class="text-xl md:text-2xl font-black text-gray-900 mb-3">
        "Does solar work in [Your City]?" <!-- Your question -->
    </h3>
    <p class="text-gray-700 text-lg">
        Yes! [Your City] gets XXX days of sunshine per year, making it perfect for solar...
    </p>
</div>
```

---

## Form Modifications

### Add/Remove Form Fields

**To add a new field (e.g., "Best Time to Call"):**

**Step 1:** Add HTML in the appropriate step:

```html
<!-- In step 2, after phone field -->
<label for="best-time" class="block text-sm font-bold text-gray-700 mb-2">
    Best Time to Call:
</label>
<select
    id="best-time"
    name="best_time"
    required
    class="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
>
    <option value="">Select Time...</option>
    <option value="morning">Morning (8am-12pm)</option>
    <option value="afternoon">Afternoon (12pm-5pm)</option>
    <option value="evening">Evening (5pm-8pm)</option>
</select>
```

**Step 2:** Update validation in `main.js`:

```javascript
if (step === 2) {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const bestTime = document.getElementById('best-time').value;

    // Add validation
    if (!bestTime) {
        showError('Please select your preferred call time');
        isValid = false;
    }

    formData.best_time = bestTime;
}
```

**Step 3:** Update database schema:

```sql
ALTER TABLE leads ADD COLUMN best_time VARCHAR(20);
```

**Step 4:** Update backend validation:

```javascript
// In backend/server.js
body('best_time').optional().isIn(['morning', 'afternoon', 'evening']),
```

### Change Form Steps

**To reduce from 4 steps to 2 steps:**

```html
<!-- Combine steps 1 & 2 into a single step -->
<div id="step-1" class="form-step">
    <!-- Address field -->
    <input type="text" id="address" name="address" required />

    <!-- Name field -->
    <input type="text" id="name" name="name" required />

    <!-- Phone field -->
    <input type="tel" id="phone" name="phone" required />

    <button type="button" onclick="nextStep(2)">Continue →</button>
</div>
```

### Update Form Styling

**Change button colors:**

```css
.cta-button {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
    box-shadow: 0 10px 30px rgba(YOUR_COLOR_RGB, 0.4);
}
```

**Change input border colors:**

```html
<!-- Find -->
focus:border-orange-500

<!-- Replace with -->
focus:border-blue-500
```

---

## Tracking & Analytics

### Update Tracking IDs

**Google Analytics 4:**

```javascript
// Find in both landing pages
gtag('config', 'YOUR_GA4_ID');

// Replace with your actual measurement ID
gtag('config', 'G-XXXXXXXXXX');
```

**Facebook Pixel:**

```javascript
// Find
fbq('init', 'YOUR_PIXEL_ID');

// Replace
fbq('init', '1234567890');
```

**Microsoft Clarity:**

```javascript
// Find
"https://www.clarity.ms/tag/"+i;

// Replace i with your project ID
"https://www.clarity.ms/tag/YOUR_PROJECT_ID";
```

**reCAPTCHA:**

```html
<!-- In <head> -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<!-- Also update in main.js -->
const CONFIG = {
    RECAPTCHA_SITE_KEY: 'YOUR_ACTUAL_SITE_KEY',
    ...
};
```

### Add Custom Tracking Events

**Track specific button clicks:**

```javascript
// Add to main.js
function trackCustomEvent(buttonName) {
    gtag('event', 'button_click', {
        'button_name': buttonName
    });

    fbq('trackCustom', 'ButtonClick', {
        'button': buttonName
    });
}

// Then in HTML:
<button onclick="trackCustomEvent('Get_Quote'); nextStep(2)">
    Get My Quote →
</button>
```

**Track video plays:**

```javascript
// Already implemented in main.js
// To customize, edit initVideoTracking() function
```

---

## Advanced Customizations

### Add Live Chat Widget

**Popular options:**

1. **Intercom**
```html
<!-- Add before </body> -->
<script>
  window.intercomSettings = {
    app_id: "YOUR_APP_ID"
  };
</script>
<script>(function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/YOUR_APP_ID';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s, x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
</script>
```

2. **Tidio**
```html
<script src="//code.tidio.co/YOUR_KEY.js" async></script>
```

3. **Crisp**
```html
<script type="text/javascript">
  window.$crisp=[];window.CRISP_WEBSITE_ID="YOUR_WEBSITE_ID";
  (function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();
</script>
```

### Add SMS Opt-In with Short Code

```html
<!-- Replace standard checkbox -->
<div class="bg-blue-50 border-2 border-blue-500 rounded-lg p-4 mb-4">
    <p class="text-blue-900 font-bold mb-2">
        💬 Get Instant Text Updates
    </p>
    <p class="text-sm text-blue-800 mb-3">
        Text <strong>SOLAR</strong> to <strong>12345</strong> for instant updates on your application
    </p>
    <label class="flex items-start cursor-pointer">
        <input type="checkbox" name="sms_optin" checked class="mt-1 mr-2">
        <span class="text-xs text-gray-600">
            I consent to receive automated SMS messages...
        </span>
    </label>
</div>
```

### Add Urgency Elements

**Limited spots counter (dynamic):**

```javascript
// Add to main.js
function updateUrgencyElements() {
    const now = new Date();
    const hour = now.getHours();

    // Simulate decreasing availability throughout the day
    const spotsLeft = Math.max(1, 15 - hour);

    // Update all spots counters
    document.querySelectorAll('.spots-left').forEach(el => {
        el.textContent = spotsLeft;

        // Change color based on scarcity
        if (spotsLeft <= 3) {
            el.classList.add('text-red-600', 'font-black');
        } else if (spotsLeft <= 7) {
            el.classList.add('text-orange-600', 'font-bold');
        }
    });
}

// Run on load and update every minute
updateUrgencyElements();
setInterval(updateUrgencyElements, 60000);
```

**Real-time notification popups:**

```html
<!-- Add to bottom of page -->
<div id="notification-popup" class="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-sm hidden">
    <p class="text-sm font-bold text-gray-900 mb-1" id="notification-text">
        Sarah from Tampa just claimed her incentives!
    </p>
    <p class="text-xs text-gray-600">2 minutes ago</p>
</div>
```

```javascript
// Add to main.js
function showNotification(message) {
    const popup = document.getElementById('notification-popup');
    const text = document.getElementById('notification-text');

    text.textContent = message;
    popup.classList.remove('hidden');

    setTimeout(() => {
        popup.classList.add('hidden');
    }, 5000);
}

// Trigger every 30 seconds
setInterval(() => {
    const names = ['Sarah', 'Mike', 'Jennifer', 'David'];
    const cities = ['Tampa', 'Orlando', 'Jacksonville', 'Miami'];
    const actions = ['claimed her incentives', 'booked his consultation', 'got approved'];

    const name = names[Math.floor(Math.random() * names.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    showNotification(`${name} from ${city} just ${action}!`);
}, 30000);
```

### Add Review Schema Markup

```html
<!-- Add to <head> for local SEO -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Solar Panel Installation",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "537"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

---

## Testing Your Customizations

### Checklist Before Going Live

- [ ] Test form submission (use test email/phone)
- [ ] Verify reCAPTCHA works
- [ ] Check all links work
- [ ] Test on mobile devices
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Verify tracking codes fire (use browser extensions)
- [ ] Check page load speed (Google PageSpeed Insights)
- [ ] Test calendar booking
- [ ] Verify emails/SMS send correctly
- [ ] Check database saves lead data
- [ ] Test GoHighLevel integration
- [ ] Review for typos and errors

### Browser Testing

Test on:
- ✅ Chrome (desktop & mobile)
- ✅ Safari (desktop & mobile)
- ✅ Firefox (desktop)
- ✅ Edge (desktop)

### Device Testing

Test on:
- ✅ iPhone (various sizes)
- ✅ Android phone
- ✅ iPad/tablet
- ✅ Desktop (1920px width)
- ✅ Laptop (1366px width)

---

## Common Customization Requests

### "I want to add a video to the hero section"

```html
<!-- Replace the left column content with -->
<div class="fade-in-up">
    <h1 class="text-4xl md:text-6xl font-black mb-6">
        Your Headline Here
    </h1>

    <div class="rounded-lg overflow-hidden shadow-2xl mb-6">
        <div class="video-container">
            <iframe
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1"
                frameborder="0"
                allowfullscreen>
            </iframe>
        </div>
    </div>

    <!-- Rest of content -->
</div>
```

### "I want to add more testimonials"

```html
<!-- Copy this block and update details -->
<div class="bg-white rounded-lg overflow-hidden shadow-xl">
    <div class="video-container">
        <iframe src="https://www.youtube.com/embed/YOUR_VIDEO_ID" ...></iframe>
    </div>
    <div class="p-4">
        <p class="font-bold text-gray-900">Customer Name - City</p>
        <p class="text-sm text-gray-600">"Quote about savings"</p>
        <div class="flex text-yellow-400 mt-2">⭐⭐⭐⭐⭐</div>
    </div>
</div>
```

### "I want to change the multi-step form to a single page"

Remove all `hidden` classes and step dividers:

```html
<form id="lead-form" class="space-y-4">
    <!-- Honeypot stays -->
    <input type="text" name="website" class="honeypot" />

    <!-- All fields visible at once -->
    <input type="text" id="address" name="address" required />
    <input type="text" id="name" name="name" required />
    <input type="tel" id="phone" name="phone" required />
    <!-- etc. -->

    <button type="submit">Submit →</button>
</form>
```

Update `main.js` to remove step logic.

---

## Getting Help

If you need help with customizations:

1. **Check documentation** - Review all docs files
2. **Search issues** - GitHub issues for similar questions
3. **Ask community** - Post in discussions
4. **Hire developer** - For complex customizations

---

**Last Updated:** 2024-11-23
**Version:** 1.0.0
