-- ============================================
-- Solar Landing Page Database Schema
-- PostgreSQL Database
-- ============================================

-- Create database (run separately)
-- CREATE DATABASE solar_leads;

-- Connect to the database
-- \c solar_leads;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEADS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS leads (
    -- Primary identification
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,

    -- Contact information
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,

    -- Solar-specific data
    electric_bill VARCHAR(20) NOT NULL,
    roof_shade VARCHAR(20) NOT NULL,
    sms_optin BOOLEAN DEFAULT FALSE,

    -- Lead qualification
    lead_score INTEGER DEFAULT 50 CHECK (lead_score >= 0 AND lead_score <= 100),
    lead_status VARCHAR(50) DEFAULT 'new',

    -- Tracking data
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,

    -- UTM parameters (for attribution)
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),

    -- A/B testing
    page_version VARCHAR(10) DEFAULT 'A',

    -- Integration tracking
    ghl_contact_id VARCHAR(255),
    synced_to_crm BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacted_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,

    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes for performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR email IS NULL),
    CONSTRAINT valid_phone CHECK (phone ~ '^\d{10}$')
);

-- ============================================
-- INDEXES
-- ============================================

-- Performance indexes
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_ip_address ON leads(ip_address);
CREATE INDEX idx_leads_lead_status ON leads(lead_status);
CREATE INDEX idx_leads_page_version ON leads(page_version);
CREATE INDEX idx_leads_utm_source ON leads(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX idx_leads_ghl_contact_id ON leads(ghl_contact_id) WHERE ghl_contact_id IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_leads_status_score ON leads(lead_status, lead_score DESC);
CREATE INDEX idx_leads_created_version ON leads(created_at DESC, page_version);

-- ============================================
-- LEAD ACTIVITIES TABLE (for tracking interactions)
-- ============================================

CREATE TABLE IF NOT EXISTS lead_activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_lead_id ON lead_activities(lead_id, created_at DESC);
CREATE INDEX idx_activities_type ON lead_activities(activity_type);

-- ============================================
-- FORM SUBMISSIONS TABLE (for spam detection)
-- ============================================

CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    ip_address INET NOT NULL,
    user_agent TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    was_spam BOOLEAN DEFAULT FALSE,
    honeypot_triggered BOOLEAN DEFAULT FALSE,
    recaptcha_score DECIMAL(3,2)
);

CREATE INDEX idx_submissions_ip ON form_submissions(ip_address, submitted_at DESC);
CREATE INDEX idx_submissions_spam ON form_submissions(was_spam);

-- ============================================
-- ANALYTICS TABLE (for conversion tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    page_version VARCHAR(10),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_session ON analytics_events(session_id, created_at);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_page_version ON analytics_events(page_version);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate conversion rate by page version
CREATE OR REPLACE FUNCTION get_conversion_rate(version VARCHAR(10), days INTEGER DEFAULT 30)
RETURNS TABLE (
    page_version VARCHAR(10),
    total_visits BIGINT,
    total_conversions BIGINT,
    conversion_rate DECIMAL(5,2),
    avg_lead_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.page_version,
        COUNT(DISTINCT a.session_id) AS total_visits,
        COUNT(DISTINCT l.id) AS total_conversions,
        ROUND((COUNT(DISTINCT l.id)::DECIMAL / NULLIF(COUNT(DISTINCT a.session_id), 0)) * 100, 2) AS conversion_rate,
        ROUND(AVG(l.lead_score), 2) AS avg_lead_score
    FROM analytics_events a
    LEFT JOIN leads l ON l.page_version = a.page_version
        AND l.created_at >= NOW() - INTERVAL '1 day' * days
    WHERE a.event_type = 'page_view'
        AND a.created_at >= NOW() - INTERVAL '1 day' * days
        AND (version IS NULL OR a.page_version = version)
    GROUP BY l.page_version;
END;
$$ LANGUAGE plpgsql;

-- Function to get lead source performance
CREATE OR REPLACE FUNCTION get_source_performance(days INTEGER DEFAULT 30)
RETURNS TABLE (
    utm_source VARCHAR(255),
    total_leads BIGINT,
    avg_lead_score DECIMAL(5,2),
    conversion_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.utm_source,
        COUNT(*) AS total_leads,
        ROUND(AVG(l.lead_score), 2) AS avg_lead_score,
        COUNT(CASE WHEN l.converted_at IS NOT NULL THEN 1 END) AS conversion_count
    FROM leads l
    WHERE l.created_at >= NOW() - INTERVAL '1 day' * days
        AND l.utm_source IS NOT NULL
    GROUP BY l.utm_source
    ORDER BY total_leads DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO leads (name, phone, email, address, electric_bill, roof_shade, sms_optin, lead_score, page_version)
VALUES
    ('John Smith', '5551234567', 'john@example.com', '123 Main St, Orlando, FL 32801', '200-300', 'full-sun', TRUE, 75, 'A'),
    ('Sarah Johnson', '5559876543', 'sarah@example.com', '456 Oak Ave, Tampa, FL 33602', '300+', 'full-sun', TRUE, 85, 'B'),
    ('Mike Williams', '5555555555', 'mike@example.com', '789 Pine Rd, Jacksonville, FL 32099', '150-200', 'partial-shade', FALSE, 60, 'A');
*/

-- ============================================
-- VIEWS (for reporting)
-- ============================================

-- Daily conversion summary
CREATE OR REPLACE VIEW daily_conversions AS
SELECT
    DATE(created_at) AS date,
    page_version,
    COUNT(*) AS total_leads,
    AVG(lead_score) AS avg_score,
    COUNT(CASE WHEN sms_optin = TRUE THEN 1 END) AS sms_optins
FROM leads
WHERE deleted_at IS NULL
GROUP BY DATE(created_at), page_version
ORDER BY date DESC;

-- Lead source performance view
CREATE OR REPLACE VIEW source_performance AS
SELECT
    utm_source,
    utm_medium,
    utm_campaign,
    COUNT(*) AS total_leads,
    AVG(lead_score) AS avg_score,
    COUNT(CASE WHEN lead_score >= 70 THEN 1 END) AS high_quality_leads
FROM leads
WHERE deleted_at IS NULL
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY total_leads DESC;

-- ============================================
-- GRANTS (adjust as needed)
-- ============================================

-- Create application user
-- CREATE USER solar_app WITH PASSWORD 'secure_password_here';

-- Grant permissions
-- GRANT SELECT, INSERT, UPDATE ON leads TO solar_app;
-- GRANT SELECT, INSERT ON lead_activities TO solar_app;
-- GRANT SELECT, INSERT ON form_submissions TO solar_app;
-- GRANT SELECT, INSERT ON analytics_events TO solar_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO solar_app;

-- ============================================
-- MAINTENANCE
-- ============================================

-- Clean up old analytics events (run monthly)
-- DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';

-- Clean up spam submissions (run weekly)
-- DELETE FROM form_submissions WHERE was_spam = TRUE AND submitted_at < NOW() - INTERVAL '30 days';

COMMIT;
