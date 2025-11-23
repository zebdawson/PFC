/**
 * Solar Landing Page - Main JavaScript
 * Handles form validation, tracking, countdown, and all interactive elements
 */

// ==============================================
// CONFIGURATION
// ==============================================

const CONFIG = {
    RECAPTCHA_SITE_KEY: 'YOUR_RECAPTCHA_SITE_KEY',
    GA4_ID: 'YOUR_GA4_ID',
    FB_PIXEL_ID: 'YOUR_PIXEL_ID',
    API_ENDPOINT: '/api/submit-lead',
    COUNTDOWN_END_DATE: '2024-12-31T23:59:59', // Set your deadline
    MIN_FORM_TIME: 3000, // Minimum time before form can be submitted (spam prevention)
};

// ==============================================
// STATE MANAGEMENT
// ==============================================

let formStartTime = null;
let currentStep = 1;
let formData = {};
let exitIntentShown = false;

// ==============================================
// INITIALIZATION
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initCountdown();
    initLiveFeed();
    initFormTracking();
    initExitIntent();
    initCookieBanner();
    initScrollTracking();
    initVideoTracking();
    setupFormListeners();

    // Track page load
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });

    // Start form timer
    formStartTime = Date.now();
});

// ==============================================
// COUNTDOWN TIMER
// ==============================================

function initCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    function updateCountdown() {
        const now = new Date().getTime();
        const endDate = new Date(CONFIG.COUNTDOWN_END_DATE).getTime();
        const distance = endDate - now;

        if (distance < 0) {
            countdownElement.innerHTML = 'EXPIRED';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Track countdown visibility
    trackEvent('countdown_view', {
        deadline: CONFIG.COUNTDOWN_END_DATE
    });
}

// ==============================================
// LIVE FEED SIMULATION
// ==============================================

function initLiveFeed() {
    const feedElement = document.getElementById('feed-message');
    if (!feedElement) return;

    const cities = [
        'Orlando', 'Tampa', 'Jacksonville', 'Miami', 'Fort Lauderdale',
        'West Palm Beach', 'Tallahassee', 'Port St. Lucie', 'Cape Coral',
        'Clearwater', 'Lakeland', 'Daytona Beach', 'Boca Raton', 'Sarasota'
    ];

    const names = [
        'John', 'Sarah', 'Mike', 'Jennifer', 'David', 'Lisa', 'Tom',
        'Emily', 'James', 'Amanda', 'Robert', 'Michelle', 'Chris', 'Jessica'
    ];

    const actions = [
        'just locked in their rate',
        'just claimed their incentives',
        'just qualified for solar',
        'just scheduled their installation',
        'just saved their spot'
    ];

    function updateFeed() {
        const name = names[Math.floor(Math.random() * names.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const minutes = Math.floor(Math.random() * 10) + 1;

        feedElement.textContent = `${name} from ${city} ${action} ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    updateFeed();
    setInterval(updateFeed, 8000);
}

// ==============================================
// FORM MULTI-STEP NAVIGATION
// ==============================================

function nextStep(step) {
    // Validate current step
    if (!validateCurrentStep()) {
        return;
    }

    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.add('hidden');
    });

    // Show next step
    document.getElementById(`step-${step}`).classList.remove('hidden');

    // Update progress
    currentStep = step;
    updateProgress(step);

    // Track step completion
    trackEvent('form_step_complete', {
        step: step - 1,
        step_name: getStepName(step - 1)
    });

    // Special handling for step 3 (show savings preview)
    if (step === 3) {
        document.getElementById('electric-bill').addEventListener('change', showSavingsPreview);
    }

    // Scroll to form
    document.getElementById('lead-form').scrollIntoView({ behavior: 'smooth' });
}

function validateCurrentStep() {
    const step = currentStep;
    let isValid = true;

    if (step === 1) {
        const address = document.getElementById('address').value.trim();
        if (address.length < 5) {
            showError('Please enter a valid address');
            isValid = false;
        }
        formData.address = address;
    }

    if (step === 2) {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (name.length < 2) {
            showError('Please enter your name');
            isValid = false;
        }

        if (!isValidPhone(phone)) {
            showError('Please enter a valid phone number');
            isValid = false;
        }

        formData.name = name;
        formData.phone = phone;
    }

    if (step === 3) {
        const electricBill = document.getElementById('electric-bill').value;
        if (!electricBill) {
            showError('Please select your electric bill range');
            isValid = false;
        }
        formData.electric_bill = electricBill;
    }

    return isValid;
}

function updateProgress(step) {
    const progress = (step / 4) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('current-step').textContent = step;
}

function getStepName(step) {
    const names = ['address', 'contact_info', 'electric_bill', 'roof_assessment'];
    return names[step - 1] || 'unknown';
}

// ==============================================
// FORM VALIDATION
// ==============================================

function isValidPhone(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's 10 digits
    return cleaned.length === 10;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(message) {
    alert(message); // Replace with better UI notification
}

function showSavingsPreview() {
    const billRange = document.getElementById('electric-bill').value;
    const savingsPreview = document.getElementById('savings-preview');
    const potentialSavings = document.getElementById('potential-savings');

    if (!billRange) return;

    let savings = 0;
    switch(billRange) {
        case '0-100':
            savings = 70;
            break;
        case '100-150':
            savings = 110;
            break;
        case '150-200':
            savings = 150;
            break;
        case '200-300':
            savings = 225;
            break;
        case '300+':
            savings = 280;
            break;
    }

    potentialSavings.textContent = `$${savings}`;
    savingsPreview.classList.remove('hidden');

    // Track savings preview
    trackEvent('savings_preview', {
        bill_range: billRange,
        potential_savings: savings
    });
}

// ==============================================
// FORM SUBMISSION
// ==============================================

function setupFormListeners() {
    const form = document.getElementById('lead-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate time-based spam prevention
        const timeSinceLoad = Date.now() - formStartTime;
        if (timeSinceLoad < CONFIG.MIN_FORM_TIME) {
            showError('Please take a moment to review the form');
            return;
        }

        // Check honeypot
        if (document.querySelector('input[name="website"]').value !== '') {
            console.log('Honeypot triggered - spam detected');
            return;
        }

        // Validate final step
        const roofShade = document.querySelector('input[name="roof_shade"]:checked');
        if (!roofShade) {
            showError('Please select your roof shade condition');
            return;
        }

        formData.roof_shade = roofShade.value;
        formData.sms_optin = document.querySelector('input[name="sms_optin"]').checked;

        // Disable submit button
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'SUBMITTING...';

        try {
            // Get reCAPTCHA token
            const recaptchaToken = await getRecaptchaToken();
            formData.recaptcha_token = recaptchaToken;

            // Submit form
            const response = await submitForm(formData);

            if (response.success) {
                // Track conversion
                trackConversion(formData);

                // Redirect to thank you page
                window.location.href = '/thank-you.html?lead=' + response.leadId;
            } else {
                throw new Error(response.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showError('There was an error submitting your form. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'YES! LOCK MY RATE BEFORE IT EXPIRES →';
        }
    });
}

async function getRecaptchaToken() {
    return new Promise((resolve, reject) => {
        grecaptcha.ready(function() {
            grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {action: 'submit'})
                .then(function(token) {
                    resolve(token);
                })
                .catch(reject);
        });
    });
}

async function submitForm(data) {
    const response = await fetch(CONFIG.API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return await response.json();
}

// ==============================================
// TRACKING & ANALYTICS
// ==============================================

function trackEvent(eventName, params = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', eventName, params);
    }

    // Microsoft Clarity
    if (typeof clarity !== 'undefined') {
        clarity('set', eventName, JSON.stringify(params));
    }

    console.log('Event tracked:', eventName, params);
}

function trackConversion(formData) {
    // Google Analytics 4 conversion
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            send_to: CONFIG.GA4_ID,
            value: 1.0,
            currency: 'USD',
            transaction_id: Date.now().toString()
        });
    }

    // Facebook Pixel Lead event
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'Solar Landing Page',
            value: 1.0,
            currency: 'USD'
        });
    }

    console.log('Conversion tracked:', formData);
}

function initFormTracking() {
    // Track focus on form fields
    const formFields = ['address', 'name', 'phone', 'electric-bill'];

    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('focus', function() {
                trackEvent('form_field_focus', {
                    field_name: fieldId
                });
            });
        }
    });

    // Track CTA clicks
    document.querySelectorAll('.cta-button').forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('cta_click', {
                button_text: this.textContent.trim(),
                button_location: this.id || 'unknown'
            });
        });
    });
}

// ==============================================
// SCROLL DEPTH TRACKING
// ==============================================

function initScrollTracking() {
    let scrollDepths = [25, 50, 75, 100];
    let trackedDepths = [];

    window.addEventListener('scroll', function() {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

        scrollDepths.forEach(depth => {
            if (scrollPercent >= depth && !trackedDepths.includes(depth)) {
                trackedDepths.push(depth);
                trackEvent('scroll_depth', {
                    percent: depth
                });
            }
        });
    });
}

// ==============================================
// VIDEO TRACKING
// ==============================================

function initVideoTracking() {
    // Track when videos come into view
    const videos = document.querySelectorAll('iframe[src*="youtube"]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                trackEvent('video_view', {
                    video_title: entry.target.title || 'unknown'
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    videos.forEach(video => observer.observe(video));
}

// ==============================================
// EXIT INTENT POPUP
// ==============================================

function initExitIntent() {
    let mouseY = 0;
    let topOfPage = 0;

    document.addEventListener('mousemove', function(e) {
        mouseY = e.clientY;
    });

    document.addEventListener('mouseout', function(e) {
        if (e.clientY < topOfPage && !exitIntentShown) {
            showExitPopup();
        }
    });

    // Also trigger on back button (mobile)
    window.addEventListener('popstate', function() {
        if (!exitIntentShown) {
            showExitPopup();
        }
    });
}

function showExitPopup() {
    const popup = document.getElementById('exit-popup');
    if (popup && !exitIntentShown) {
        popup.classList.add('active');
        exitIntentShown = true;

        trackEvent('exit_intent_shown', {
            time_on_page: Math.round((Date.now() - formStartTime) / 1000)
        });
    }
}

function closeExitPopup() {
    const popup = document.getElementById('exit-popup');
    if (popup) {
        popup.classList.remove('active');
        trackEvent('exit_intent_closed');
    }
}

// ==============================================
// COOKIE BANNER (GDPR/CCPA)
// ==============================================

function initCookieBanner() {
    const cookieConsent = localStorage.getItem('cookieConsent');

    if (!cookieConsent) {
        setTimeout(() => {
            document.getElementById('cookie-banner').classList.remove('hidden');
        }, 2000);
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    document.getElementById('cookie-banner').classList.add('hidden');
    trackEvent('cookie_consent', { action: 'accepted' });
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    document.getElementById('cookie-banner').classList.add('hidden');
    trackEvent('cookie_consent', { action: 'declined' });
}

// ==============================================
// DYNAMIC SPOTS LEFT COUNTER
// ==============================================

function updateSpotsLeft() {
    // Simulate decreasing spots (you can make this real by pulling from backend)
    const baseSpots = 12;
    const hour = new Date().getHours();
    const spotsLeft = Math.max(1, baseSpots - (hour % 12));

    const spotElements = document.querySelectorAll('#spots-left, #spots-left-footer');
    spotElements.forEach(el => {
        if (el) el.textContent = spotsLeft;
    });
}

setInterval(updateSpotsLeft, 60000); // Update every minute
updateSpotsLeft(); // Initial update

// ==============================================
// PHONE NUMBER FORMATTING
// ==============================================

const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length > 0) {
            if (value.length <= 3) {
                value = `(${value}`;
            } else if (value.length <= 6) {
                value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
            } else {
                value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
            }
        }

        e.target.value = value;
    });
}

// ==============================================
// GOOGLE PLACES AUTOCOMPLETE (OPTIONAL)
// ==============================================

// Uncomment if you add Google Places API
/*
function initAutocomplete() {
    const addressInput = document.getElementById('address');
    if (addressInput && typeof google !== 'undefined') {
        const autocomplete = new google.maps.places.Autocomplete(addressInput, {
            types: ['address'],
            componentRestrictions: { country: 'us' }
        });

        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            trackEvent('address_autocomplete', {
                place_id: place.place_id
            });
        });
    }
}

// Call this after Google Maps API loads
// initAutocomplete();
*/

// ==============================================
// PERFORMANCE MONITORING
// ==============================================

window.addEventListener('load', function() {
    // Track page load time
    if (window.performance && window.performance.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;

        trackEvent('page_load_time', {
            load_time_ms: loadTime,
            load_time_seconds: (loadTime / 1000).toFixed(2)
        });

        console.log(`Page loaded in ${(loadTime / 1000).toFixed(2)} seconds`);
    }
});

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// Get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Track UTM parameters
const utmParams = {
    utm_source: getUrlParameter('utm_source'),
    utm_medium: getUrlParameter('utm_medium'),
    utm_campaign: getUrlParameter('utm_campaign'),
    utm_term: getUrlParameter('utm_term'),
    utm_content: getUrlParameter('utm_content')
};

if (utmParams.utm_source) {
    trackEvent('utm_tracking', utmParams);
}

// Make functions available globally for inline onclick handlers
window.nextStep = nextStep;
window.closeExitPopup = closeExitPopup;
window.acceptCookies = acceptCookies;
window.declineCookies = declineCookies;

console.log('Solar Landing Page - JavaScript Loaded Successfully');
