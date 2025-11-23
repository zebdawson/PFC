# Solar Landing Pages - Deployment Guide

This guide will walk you through deploying your high-converting solar landing pages.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [DNS & SSL Configuration](#dns--ssl-configuration)
7. [Environment Variables](#environment-variables)
8. [Performance Optimization](#performance-optimization)
9. [Monitoring & Alerts](#monitoring--alerts)

---

## Prerequisites

Before you begin, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ database
- [ ] Domain name registered
- [ ] Cloudflare or Vercel account (for CDN)
- [ ] API keys for:
  - Google reCAPTCHA v3
  - Google Analytics 4
  - Facebook Pixel
  - GoHighLevel CRM
  - Twilio (for SMS)
  - SendGrid (for email)

---

## Quick Start

### 1. Clone and Install

```bash
# Navigate to project directory
cd solar-landing-pages

# Install backend dependencies
cd backend
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your actual credentials

cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb solar_leads

# Run migrations
psql -d solar_leads -f database/schema.sql
```

### 3. Start Backend Server

```bash
cd backend
npm run dev  # Development
npm start    # Production
```

### 4. Deploy Frontend

See [Frontend Deployment](#frontend-deployment) section below.

---

## Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE solar_leads;
CREATE USER solar_app WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE solar_leads TO solar_app;
\q
```

```bash
# Import schema
psql -U solar_app -d solar_leads -f database/schema.sql
```

### Option 2: Hosted Database (Recommended for Production)

**Recommended Providers:**

1. **Supabase** (Free tier available)
   - Go to https://supabase.com
   - Create new project
   - Copy connection string
   - Run schema in SQL Editor

2. **Railway** (Easy setup)
   - Go to https://railway.app
   - Create PostgreSQL database
   - Copy connection details

3. **AWS RDS** (Enterprise)
   - Create RDS PostgreSQL instance
   - Configure security groups
   - Connect and import schema

### Database Connection String Format

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://solar_app:password123@db.example.com:5432/solar_leads
```

---

## Backend Deployment

### Option 1: Deploy to Vercel (Serverless)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend directory
cd backend

# Deploy
vercel

# Set environment variables in Vercel dashboard
# https://vercel.com/your-username/your-project/settings/environment-variables
```

Create `vercel.json` in backend directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Option 3: Deploy to VPS (DigitalOcean, Linode, etc.)

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone your repository
git clone your-repo-url
cd solar-landing-pages/backend

# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name solar-api
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo apt-get install nginx
```

Nginx configuration (`/etc/nginx/sites-available/solar-api`):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/solar-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## Frontend Deployment

### Option 1: Cloudflare Pages (Recommended - Fastest)

1. Go to https://pages.cloudflare.com
2. Connect your GitHub repository
3. Configure build settings:
   - **Build command:** (Leave empty - static HTML)
   - **Build output directory:** `/`
   - **Root directory:** `solar-landing-pages/version-a` (or version-b)
4. Add environment variables (if needed)
5. Deploy

**For A/B Testing:** Deploy both versions to different subdomains:
- Version A: `solar-a.yourdomain.com`
- Version B: `solar-b.yourdomain.com`

Then use Cloudflare Workers to randomly distribute traffic 50/50.

### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to version directory
cd version-a

# Deploy
vercel --prod

# Repeat for version-b
cd ../version-b
vercel --prod
```

### Option 3: Netlify

1. Go to https://netlify.com
2. Drag and drop `version-a` folder
3. Configure domain
4. Repeat for `version-b`

### Option 4: AWS S3 + CloudFront

```bash
# Install AWS CLI
pip install awscli

# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://solar-landing-page

# Upload files
aws s3 sync version-a/ s3://solar-landing-page --acl public-read

# Configure CloudFront distribution
# (Do this in AWS Console for SSL and caching)
```

---

## DNS & SSL Configuration

### DNS Records

Add these records to your DNS provider:

```
Type    Name                Value                       TTL
A       @                   [Your server IP]            Auto
A       www                 [Your server IP]            Auto
CNAME   api                 your-backend-url.com        Auto
```

### SSL Certificate

**Option 1: Cloudflare (Easiest)**
- Cloudflare provides free SSL automatically
- Set SSL/TLS mode to "Full (strict)"

**Option 2: Let's Encrypt**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Option 3: AWS Certificate Manager**
- Request certificate in ACM
- Add to CloudFront distribution

---

## Environment Variables

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Database
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=solar_leads
DB_USER=solar_app
DB_PASSWORD=your_secure_password

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret

# GoHighLevel
GHL_API_URL=https://rest.gohighlevel.com/v1
GHL_API_KEY=your_ghl_api_key

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDER_EMAIL=noreply@yourdomain.com

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx

# Site
SITE_URL=https://yourdomain.com
```

### Frontend (Update in HTML files)

Replace these placeholders in both `version-a/index.html` and `version-b/index.html`:

- `YOUR_RECAPTCHA_SITE_KEY` - Your reCAPTCHA v3 site key
- `YOUR_GA4_ID` - Your Google Analytics 4 measurement ID
- `YOUR_PIXEL_ID` - Your Facebook Pixel ID
- `YOUR_CLARITY_ID` - Your Microsoft Clarity project ID

Also update in `shared/js/main.js`:
- `CONFIG.RECAPTCHA_SITE_KEY`
- `CONFIG.GA4_ID`
- `CONFIG.FB_PIXEL_ID`
- `CONFIG.API_ENDPOINT` - Your backend API URL

---

## Performance Optimization

### Frontend Optimization

1. **Image Optimization**
   - Convert images to WebP format
   - Use responsive images with `srcset`
   - Lazy load images below the fold

2. **Minification**
   ```bash
   # Install terser for JS minification
   npm install -g terser
   terser shared/js/main.js -o shared/js/main.min.js -c -m

   # Update HTML to reference main.min.js
   ```

3. **Critical CSS**
   - Inline critical CSS in `<head>`
   - Defer non-critical CSS
   - Use Tailwind's purge option

4. **Preload Critical Resources**
   ```html
   <link rel="preload" href="shared/js/main.min.js" as="script">
   <link rel="preconnect" href="https://www.google.com">
   ```

### Backend Optimization

1. **Database Connection Pooling**
   - Already configured in `server.js`
   - Adjust pool size based on traffic

2. **Caching**
   - Use Redis for session storage
   - Cache API responses

3. **Rate Limiting**
   - Already implemented
   - Adjust limits based on traffic patterns

### CDN Configuration

**Cloudflare Settings:**
- Browser Cache TTL: 4 hours
- Caching Level: Standard
- Auto Minify: HTML, CSS, JS
- Brotli compression: Enabled
- HTTP/2: Enabled

---

## Monitoring & Alerts

### Application Monitoring

1. **Server Monitoring**
   ```bash
   # PM2 monitoring
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7

   # View logs
   pm2 logs solar-api
   ```

2. **Database Monitoring**
   ```sql
   -- Check database size
   SELECT pg_size_pretty(pg_database_size('solar_leads'));

   -- Check table sizes
   SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
   FROM pg_tables WHERE schemaname = 'public';

   -- Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   ```

3. **Uptime Monitoring**
   - Use [UptimeRobot](https://uptimerobot.com) (free)
   - Monitor: Frontend URL, API health endpoint
   - Alert via email/SMS

### Analytics Monitoring

1. **Google Analytics 4**
   - Check daily traffic
   - Monitor conversion funnel
   - Track form abandonment

2. **Microsoft Clarity**
   - Review heatmaps weekly
   - Watch session recordings
   - Identify UX issues

3. **Error Tracking**
   - Use Sentry (free tier)
   ```bash
   npm install @sentry/node
   ```

### Alerting

Set up alerts for:
- Server downtime (>1 minute)
- API response time >2 seconds
- Error rate >5%
- Database connection failures
- Form submission failures

---

## Troubleshooting

### Common Issues

**1. Forms not submitting**
- Check API endpoint URL in `main.js`
- Verify CORS settings in backend
- Check browser console for errors
- Verify reCAPTCHA keys

**2. Slow page load**
- Check image sizes (should be <200KB each)
- Verify CDN is enabled
- Check Lighthouse score (target: 90+)

**3. Database connection errors**
- Verify connection string
- Check database is running
- Verify firewall rules
- Check connection pool settings

**4. SMS/Email not sending**
- Verify Twilio/SendGrid credentials
- Check account balance
- Review API logs
- Test with API testing tools

---

## Security Checklist

- [ ] HTTPS enabled on all domains
- [ ] Environment variables secured (not in git)
- [ ] Database password is strong (20+ characters)
- [ ] Rate limiting enabled
- [ ] reCAPTCHA implemented
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input validation)
- [ ] CORS properly configured
- [ ] Security headers enabled (helmet.js)
- [ ] Regular backups automated
- [ ] Monitoring and alerts configured

---

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * pg_dump -U solar_app solar_leads > /backups/solar_leads_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U solar_app -d solar_leads < /backups/solar_leads_20241201.sql
```

### File Backups

```bash
# Backup files to S3
aws s3 sync /var/www/solar-landing-pages s3://backups-bucket/solar-landing-pages/
```

---

## Next Steps

After deployment:

1. ✅ Test both landing page versions
2. ✅ Submit test forms
3. ✅ Verify CRM integration
4. ✅ Check analytics tracking
5. ✅ Test on mobile devices
6. ✅ Run Lighthouse audit
7. ✅ Set up monitoring
8. ✅ Configure alerts
9. ✅ Start A/B test (see [A/B Testing Guide](AB-TESTING.md))

---

## Support

For issues:
1. Check logs: `pm2 logs solar-api`
2. Review error messages
3. Check documentation
4. Contact your development team

---

**Last Updated:** 2024-11-23
**Version:** 1.0.0
