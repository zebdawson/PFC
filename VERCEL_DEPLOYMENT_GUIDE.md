# Vercel Deployment Guide for PFC Dashboard

## Overview

This guide walks you through deploying the PFC dashboard frontend to Vercel.

---

## Prerequisites

1. **GitHub Repository** - Your code is already in GitHub ✅
2. **Vercel Account** - Sign up at https://vercel.com (free)
3. **Replit Backend URL** - From your Replit deployment

---

## Step 1: Get Your Replit Backend URL

Before deploying to Vercel, you need your Replit backend URL:

### Option A: If Replit is Already Running

1. Go to https://replit.com/
2. Open your `pfc-ticketing-middleware` Repl
3. Look at the top of the page - you'll see the URL
4. It will look like: `https://pfc-ticketing.username.repl.co`
5. **Copy this URL** - you'll need it in Step 4

### Option B: Deploy to Replit First

If you haven't deployed to Replit yet:

1. Go to https://replit.com/
2. Click **"+ Create Repl"**
3. Choose **"Import from GitHub"** (or upload the `replit-middleware` folder)
4. Configure **Secrets** (the lock icon 🔒):
   - Add all values from `/replit-middleware/.env.example`
   - Get Pipeline ID and User IDs by running: `npm run get-config`
   - Get Claude API key from: https://console.anthropic.com/
5. Click **"Run"**
6. Copy the URL from the top of the Repl

---

## Step 2: Sign Up for Vercel

1. Go to https://vercel.com/
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

---

## Step 3: Deploy the Dashboard

### Import Your Project

1. On your Vercel dashboard, click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Find your `PFC` repository (or whatever you named it)
4. Click **"Import"**

### Configure the Project

1. **Framework Preset:** Vite (should auto-detect)
2. **Root Directory:** Click **"Edit"** and select `pfc-dashboard`
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `dist` (default)

### Add Environment Variable

1. Expand **"Environment Variables"** section
2. Add a new variable:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** Your Replit URL (e.g., `https://pfc-ticketing.username.repl.co`)
3. Click **"Add"**

### Deploy

1. Click **"Deploy"**
2. Wait 1-2 minutes for the build to complete
3. You'll get a URL like: `https://pfc-dashboard.vercel.app`

---

## Step 4: Test Your Deployment

### Test the Dashboard

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Navigate to different pages:
   - Admin Dashboard
   - Departments
   - **Submit Request** (intake form)

### Test the Intake Form

1. Go to: `https://your-project.vercel.app/intake`
2. Fill out the form with test data
3. Click **"Submit Request"**
4. You should see:
   - Success screen with ticket number
   - Opportunity created in GHL
   - Tasks assigned to departments

### If Submission Fails

Check the browser console (F12) for errors:

**CORS Error:**
- Your Replit backend needs to allow requests from your Vercel domain
- Update `/replit-middleware/src/index.js`:
  ```javascript
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'https://your-project.vercel.app'  // Add your Vercel URL
    ]
  }));
  ```

**Network Error:**
- Verify `VITE_BACKEND_URL` in Vercel settings
- Make sure Replit backend is running
- Test the backend directly: `https://your-replit-url.repl.co/health`

---

## Step 5: Custom Domain (Optional)

### Add Your Own Domain

If you want `tickets.pfcgoc.com` instead of `your-project.vercel.app`:

1. In Vercel project, go to **Settings → Domains**
2. Click **"Add Domain"**
3. Enter your domain: `tickets.pfcgoc.com`
4. Follow the DNS configuration instructions
5. Vercel will provide nameservers or CNAME record
6. Add the DNS records in your domain registrar (GoDaddy, Namecheap, etc.)
7. Wait 5-60 minutes for DNS propagation

---

## Step 6: Enable GHL Embedding (iframe)

To embed the intake form in GoHighLevel:

### Option 1: Custom Menu Link

1. In GHL, go to **Settings → Custom Menu**
2. Add new menu item:
   - **Name:** Submit Job Request
   - **Type:** External Link
   - **URL:** `https://your-vercel-url.vercel.app/intake`
   - **Icon:** Choose an appropriate icon

### Option 2: Embed in Site/Funnel

1. In GHL Sites or Funnels
2. Add a **Custom Code** element
3. Paste:
   ```html
   <iframe
     src="https://your-vercel-url.vercel.app/intake"
     width="100%"
     height="1200"
     frameborder="0"
     style="border: none;"
   ></iframe>
   ```

### Option 3: Standalone URL

Simply share the intake form URL directly:
- `https://your-vercel-url.vercel.app/intake`

---

## Automatic Deployments

Every time you push to GitHub, Vercel will automatically rebuild and deploy! 🎉

### How it Works

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update intake form"
   git push
   ```
3. Vercel detects the push and starts building
4. New version is live in 1-2 minutes

---

## Environment Variables for Different Branches

You can have different backends for development vs production:

### Production (main branch)
- `VITE_BACKEND_URL=https://pfc-ticketing-prod.repl.co`

### Staging (staging branch)
- `VITE_BACKEND_URL=https://pfc-ticketing-staging.repl.co`

### Development
- Local `.env` file with `VITE_BACKEND_URL=http://localhost:3000`

To set this up in Vercel:
1. Go to **Settings → Environment Variables**
2. Add the same variable multiple times with different scopes:
   - Production: `main` branch
   - Preview: `staging` branch
   - Development: All branches

---

## Troubleshooting

### Build Fails

**Error: `Cannot find module 'XYZ'`**
- Run `npm install` locally to update `package-lock.json`
- Commit and push

**Error: Build exceeds time limit**
- Usually not an issue with Vite projects
- Check for infinite loops in component rendering

### Deployment Succeeds but Page is Blank

**White screen:**
- Check browser console for errors
- Verify `vite.config.js` base path is correct
- Make sure all dependencies are in `package.json` (not devDependencies)

### Form Submission Doesn't Work

**404 on backend endpoint:**
- Check `VITE_BACKEND_URL` environment variable
- Verify Replit is running: `https://your-replit-url.repl.co/health`

**CORS error:**
- Update Replit middleware CORS settings (see Step 4 above)

---

## Performance Optimization

Vercel automatically handles:
- ✅ CDN distribution (fast worldwide)
- ✅ HTTPS/SSL certificate
- ✅ Compression (gzip/brotli)
- ✅ Image optimization
- ✅ Serverless functions
- ✅ Edge caching

Your app will load in < 1 second globally! 🚀

---

## Monitoring & Analytics

### Vercel Analytics (Free)

1. In your Vercel project, go to **Analytics** tab
2. Click **"Enable Analytics"**
3. View metrics:
   - Page views
   - Unique visitors
   - Top pages
   - Performance scores

### Vercel Logs

1. Go to **Deployments** tab
2. Click on any deployment
3. Click **"View Function Logs"** to see runtime errors

---

## Cost

### Vercel Pricing

**Hobby Plan (FREE):**
- ✅ Unlimited projects
- ✅ Automatic HTTPS
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Custom domains
- **Perfect for PFC ticketing system!**

**Pro Plan ($20/month):**
- Only needed if you exceed 100GB/month bandwidth
- Or need advanced team features
- You probably won't need this

---

## Quick Reference Commands

### Local Development
```bash
cd pfc-dashboard
npm install
npm run dev
# Visit http://localhost:5173
```

### Deploy to Vercel
```bash
git add .
git commit -m "Your changes"
git push
# Vercel auto-deploys!
```

### Update Environment Variables
1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Edit `VITE_BACKEND_URL`
4. Redeploy: Deployments → Latest → **Redeploy**

---

## Next Steps After Deployment

1. ✅ Test the intake form end-to-end
2. ✅ Share the URL with your team
3. ✅ Embed in GHL custom menu
4. ✅ (Optional) Set up custom domain
5. ✅ Monitor analytics and logs
6. ✅ Iterate based on user feedback

---

## Support

**Vercel Issues:**
- https://vercel.com/docs
- https://vercel.com/support

**Your Project Issues:**
- Check browser console (F12)
- Check Vercel deployment logs
- Check Replit middleware logs
- Verify environment variables

---

## You're Ready to Deploy! 🚀

Everything is configured and ready. Just follow the steps above and your beautiful intake form will be live in minutes!
