/**
 * Solar Landing Page - Backend Server
 * Node.js/Express server for handling form submissions
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================
// DATABASE CONNECTION
// ==============================================

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'solar_leads',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// ==============================================
// MIDDLEWARE
// ==============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Max 3 submissions per IP per day
const submissionLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3,
    message: 'Too many submissions from this IP, please try again tomorrow',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    }
});

// ==============================================
// SPAM PREVENTION UTILITIES
// ==============================================

/**
 * Verify Google reCAPTCHA v3 token
 */
async function verifyRecaptcha(token) {
    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`,
            null,
            {
                params: {
                    secret: process.env.RECAPTCHA_SECRET_KEY,
                    response: token
                }
            }
        );

        const { success, score, action } = response.data;

        // Score should be >= 0.5 for legitimate users
        return success && score >= 0.5;
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return false;
    }
}

/**
 * Check if email is from a disposable email provider
 */
const disposableEmailDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'throwaway.email', 'fakeinbox.com'
];

function isDisposableEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableEmailDomains.includes(domain);
}

/**
 * Validate email using external API (optional)
 */
async function validateEmailAPI(email) {
    // You can use services like Hunter.io, ZeroBounce, or EmailListVerify
    // This is a placeholder - implement with your chosen service
    try {
        // const response = await axios.get(`https://api.hunter.io/v2/email-verifier`, {
        //     params: {
        //         email: email,
        //         api_key: process.env.HUNTER_API_KEY
        //     }
        // });
        // return response.data.data.status === 'valid';

        return true; // Placeholder
    } catch (error) {
        console.error('Email validation error:', error);
        return true; // Don't block on validation errors
    }
}

/**
 * Check submission velocity - flag unusual patterns
 */
async function checkSubmissionVelocity(ip) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const result = await pool.query(
        'SELECT COUNT(*) FROM leads WHERE ip_address = $1 AND created_at > $2',
        [ip, oneHourAgo]
    );

    const submissionsLastHour = parseInt(result.rows[0].count);

    // Flag if more than 2 submissions in last hour from same IP
    return submissionsLastHour > 2;
}

/**
 * Calculate lead score based on various factors
 */
function calculateLeadScore(data) {
    let score = 50; // Base score

    // Electric bill amount (higher bill = better lead)
    const billRanges = {
        '0-100': -10,
        '100-150': 0,
        '150-200': 10,
        '200-300': 20,
        '300+': 30
    };
    score += billRanges[data.electric_bill] || 0;

    // Roof shade (full sun is best)
    const roofScores = {
        'full-sun': 20,
        'partial-shade': 10,
        'mostly-shade': -10
    };
    score += roofScores[data.roof_shade] || 0;

    // SMS opt-in (shows interest)
    if (data.sms_optin) {
        score += 10;
    }

    // Time to complete form (too fast might be spam, reasonable time is good)
    // This would need to be passed from frontend
    // if (data.form_completion_time > 30 && data.form_completion_time < 300) {
    //     score += 10;
    // }

    return Math.min(100, Math.max(0, score)); // Keep between 0-100
}

// ==============================================
// API ROUTES
// ==============================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Submit lead form
 */
app.post(
    '/api/submit-lead',
    submissionLimiter,
    [
        // Validation middleware
        body('address').trim().isLength({ min: 5 }).escape(),
        body('name').trim().isLength({ min: 2 }).escape(),
        body('phone').trim().matches(/^\d{10}$/),
        body('electric_bill').isIn(['0-100', '100-150', '150-200', '200-300', '300+']),
        body('roof_shade').isIn(['full-sun', 'partial-shade', 'mostly-shade']),
        body('sms_optin').optional().isBoolean(),
        body('recaptcha_token').notEmpty(),
        body('website').isEmpty() // Honeypot should be empty
    ],
    async (req, res) => {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const {
                address,
                name,
                phone,
                electric_bill,
                roof_shade,
                sms_optin = false,
                recaptcha_token,
                email = null
            } = req.body;

            // Get IP address
            const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            // 1. Verify reCAPTCHA
            const isValidRecaptcha = await verifyRecaptcha(recaptcha_token);
            if (!isValidRecaptcha) {
                console.log('reCAPTCHA verification failed for IP:', ip);
                return res.status(400).json({
                    success: false,
                    message: 'Security verification failed'
                });
            }

            // 2. Check submission velocity
            const isSuspiciousVelocity = await checkSubmissionVelocity(ip);
            if (isSuspiciousVelocity) {
                console.log('Suspicious submission velocity from IP:', ip);
                // Log but don't block - could be legitimate
            }

            // 3. Validate email if provided
            if (email) {
                if (isDisposableEmail(email)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Please use a permanent email address'
                    });
                }
            }

            // 4. Calculate lead score
            const leadScore = calculateLeadScore({
                electric_bill,
                roof_shade,
                sms_optin
            });

            // 5. Insert into database
            const insertQuery = `
                INSERT INTO leads (
                    address, name, phone, email, electric_bill, roof_shade,
                    sms_optin, lead_score, ip_address, user_agent, referrer,
                    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                    page_version, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
                RETURNING id
            `;

            const values = [
                address,
                name,
                phone,
                email,
                electric_bill,
                roof_shade,
                sms_optin,
                leadScore,
                ip,
                req.headers['user-agent'] || null,
                req.headers['referer'] || null,
                req.body.utm_source || null,
                req.body.utm_medium || null,
                req.body.utm_campaign || null,
                req.body.utm_term || null,
                req.body.utm_content || null,
                req.body.page_version || 'A'
            ];

            const result = await pool.query(insertQuery, values);
            const leadId = result.rows[0].id;

            console.log(`New lead created: ID ${leadId}, Score: ${leadScore}`);

            // 6. Send to integrations
            await Promise.allSettled([
                sendToGoHighLevel(leadId, { address, name, phone, email, electric_bill, roof_shade, sms_optin }),
                sendSlackNotification(leadId, { name, phone, address, leadScore }),
                sendSMS(phone, name),
                sendEmail(email, name)
            ]);

            // 7. Return success
            res.json({
                success: true,
                leadId: leadId,
                message: 'Thank you! We\'ll contact you shortly.'
            });

        } catch (error) {
            console.error('Form submission error:', error);
            res.status(500).json({
                success: false,
                message: 'An error occurred. Please try again.'
            });
        }
    }
);

// ==============================================
// INTEGRATION FUNCTIONS
// ==============================================

/**
 * Send lead to GoHighLevel CRM
 */
async function sendToGoHighLevel(leadId, data) {
    try {
        const response = await axios.post(
            `${process.env.GHL_API_URL}/contacts/`,
            {
                firstName: data.name.split(' ')[0],
                lastName: data.name.split(' ').slice(1).join(' ') || '',
                phone: data.phone,
                email: data.email,
                address1: data.address,
                customFields: {
                    electric_bill: data.electric_bill,
                    roof_shade: data.roof_shade,
                    sms_optin: data.sms_optin
                },
                tags: ['Solar Lead', 'Landing Page']
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GHL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`Lead ${leadId} sent to GoHighLevel:`, response.data.id);
        return response.data;
    } catch (error) {
        console.error('GoHighLevel integration error:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Send Slack notification to sales team
 */
async function sendSlackNotification(leadId, data) {
    if (!process.env.SLACK_WEBHOOK_URL) return;

    try {
        await axios.post(process.env.SLACK_WEBHOOK_URL, {
            text: `🌟 New Solar Lead! 🌟`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '🌟 New Solar Lead!'
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Name:*\n${data.name}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Phone:*\n${data.phone}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Address:*\n${data.address}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Lead Score:*\n${data.leadScore}/100`
                        }
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `Lead ID: ${leadId} | ${new Date().toLocaleString()}`
                        }
                    ]
                }
            ]
        });

        console.log(`Slack notification sent for lead ${leadId}`);
    } catch (error) {
        console.error('Slack notification error:', error.message);
    }
}

/**
 * Send SMS to lead
 */
async function sendSMS(phone, name) {
    if (!process.env.TWILIO_ACCOUNT_SID) return;

    try {
        const twilio = require('twilio');
        const client = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

        await client.messages.create({
            body: `Hi ${name.split(' ')[0]}, this is Solar Consultant Mike. I saw you're interested in cutting your power bill. I have your address and will call you within 5 minutes to discuss your savings!`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });

        console.log(`SMS sent to ${phone}`);
    } catch (error) {
        console.error('SMS sending error:', error.message);
    }
}

/**
 * Send email to lead
 */
async function sendEmail(email, name) {
    if (!email || !process.env.SENDGRID_API_KEY) return;

    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: email,
            from: process.env.SENDER_EMAIL,
            subject: 'Your Solar Savings Calculation',
            html: `
                <h1>Hi ${name}!</h1>
                <p>Thank you for your interest in solar savings.</p>
                <p>We're reviewing your information and will contact you shortly with a custom savings proposal.</p>
                <p>In the meantime, you can use our <a href="${process.env.SITE_URL}/calculator">savings calculator</a> to see your potential savings.</p>
                <p>Best regards,<br>Solar Power Florida Team</p>
            `
        };

        await sgMail.send(msg);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error('Email sending error:', error.message);
    }
}

// ==============================================
// ANALYTICS ENDPOINTS
// ==============================================

/**
 * Get conversion statistics
 */
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                COUNT(*) as total_leads,
                AVG(lead_score) as avg_lead_score,
                COUNT(CASE WHEN page_version = 'A' THEN 1 END) as version_a_count,
                COUNT(CASE WHEN page_version = 'B' THEN 1 END) as version_b_count,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as leads_24h,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as leads_7d
            FROM leads
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Stats query error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ==============================================
// ERROR HANDLING
// ==============================================

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ==============================================
// START SERVER
// ==============================================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end();
    process.exit(0);
});
