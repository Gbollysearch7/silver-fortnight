# 🚀 Railway Deployment Guide

## Prerequisites Checklist

Before deploying, verify ALL of these are complete:

- [x] ✅ 505 clean keywords imported to queue
- [x] ✅ All keywords AI-validated (running in background)
- [x] ✅ All API keys set in .env
- [x] ✅ SEO checker updated (14 rules including authority links)
- [x] ✅ AI prompts updated with TradersYard context
- [x] ✅ Dockerfile ready
- [x] ✅ .dockerignore configured
- [x] ✅ railway.toml configured

---

## Step 1: Push to GitHub

```bash
# Make sure you're in the project directory
cd "/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation"

# Add all files
git add .

# Commit with production-ready message
git commit -m "Production ready: AI validation + 505 keywords + authority links"

# Push to GitHub
git push origin main
```

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your GitHub repository
5. Railway will auto-detect the Dockerfile

---

## Step 3: Set Environment Variables

In Railway project settings, add ALL these environment variables:

### Required API Keys

```bash
# Claude API (Primary content generation)
CLAUDE_API_KEY=sk-ant-api03-***

# OpenAI API (Fallback content generation)
OPENAI_API_KEY=sk-***

# Webflow CMS
WEBFLOW_API_KEY=***
CMS_API_KEY=***

# fal.ai (Thumbnail generation)
FAL_KEY=***

# Resend (Weekly reports)
RESEND_API_KEY=re_***
REPORT_EMAIL=marketing@tradersyard.com

# Google Analytics & Search Console
GA_PROPERTY_ID=385710950
GSC_SITE_URL=sc-domain:tradersyard.com
```

### Google Service Account

For the Google service account, you have two options:

**Option A: Upload JSON file** (Recommended)
1. In Railway, go to Variables
2. Click "Add Variable"
3. Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Value: Paste the ENTIRE contents of `data/google-service-account.json`

Then update `lib/config.mjs` to load from env var instead of file.

**Option B: Mount file**
1. Upload `google-service-account.json` to Railway volume
2. Set `GOOGLE_SERVICE_ACCOUNT_PATH=/app/data/google-service-account.json`

---

## Step 4: Configure Railway Settings

### Build Settings
- **Builder**: Dockerfile
- **Dockerfile Path**: `Dockerfile`
- **Build Command**: (leave empty, Dockerfile handles it)

### Deploy Settings
- **Start Command**: `node scripts/cron.mjs`
- **Restart Policy**: ON_FAILURE
- **Max Retries**: 10

These are already configured in `railway.toml`.

---

## Step 5: Deploy

1. Railway will automatically deploy when you push to GitHub
2. Monitor the build logs
3. Wait for "Deployment successful" message

---

## Step 6: Verify Deployment

### Check Logs
```bash
# In Railway dashboard, click "View Logs"
# You should see:
# "Blog Automation Cron"
# "Schedule: 3 posts/day at 8, 12, 16 UTC"
# "Waiting for next publish window..."
```

### Test Publish Window
The cron runs at:
- 8:00 AM UTC (first 5 minutes)
- 12:00 PM UTC (first 5 minutes)
- 4:00 PM UTC (first 5 minutes)

Wait for next window and check logs to see:
```
Processing: [keyword]
Step 1/4: Generating draft...
Step 2/4: Generating thumbnail...
Step 3/4: Running SEO check...
Step 4/4: Publishing to Webflow...
✅ Published successfully!
```

---

## Step 7: Monitor

### Weekly Reports
Every Sunday at 6 PM UTC, you'll receive an email at `marketing@tradersyard.com` with:
- Total articles published
- Average SEO score
- GSC clicks/impressions
- Top performing keywords

### Manual Status Check
```bash
# SSH into Railway container (if needed)
railway run node scripts/status.mjs
```

---

## Troubleshooting

### Build Fails
**Issue**: Docker build fails
**Solution**: Check Railway build logs for missing dependencies

### Cron Not Running
**Issue**: Cron doesn't pick keywords
**Solution**: Verify keywords are AI-validated in `data/keyword-queue.json`

### API Key Errors
**Issue**: "API key not configured"
**Solution**: Double-check all env vars are set in Railway

### Low SEO Scores
**Issue**: Articles score <70
**Solution**: Check `data/cron-log.json` for failed articles, review AI prompts

---

## Environment Variables Checklist

Copy this checklist to Railway:

```bash
# ✅ Content Generation
CLAUDE_API_KEY=
OPENAI_API_KEY=

# ✅ Publishing
WEBFLOW_API_KEY=
CMS_API_KEY=

# ✅ Assets
FAL_KEY=

# ✅ Reports
RESEND_API_KEY=
REPORT_EMAIL=

# ✅ Analytics
GA_PROPERTY_ID=
GSC_SITE_URL=
GOOGLE_SERVICE_ACCOUNT_JSON=  # or GOOGLE_SERVICE_ACCOUNT_PATH

# ✅ Optional (if using)
FIRECRAWL_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

---

## Post-Deployment

### Week 1
- Monitor daily for successful publishes
- Check SEO scores (should average 75-85)
- Verify Webflow CMS updates
- Confirm Google Indexing API submissions

### Week 2-4
- Review first batch of published articles
- Check GSC for indexing status
- Analyze which keywords are ranking
- Adjust AI prompts if needed

### Month 2+
- Track tier progression (Tier 0 → Tier 10)
- Monitor daily clicks from Google
- Identify top performers
- Plan content refresh strategy

---

## Success Metrics

### Week 1
- ✅ 21 articles published (3/day × 7 days)
- ✅ All scores ≥70
- ✅ Zero failed publishes

### Month 1
- ✅ 90 articles published
- ✅ 5-10 daily clicks from Google
- ✅ 20-30% of articles indexed

### Month 3
- ✅ 270 articles published
- ✅ 20-40 daily clicks from Google
- ✅ Tier 0 → Tier 10 progression starts

### Month 6
- ✅ 505 articles published (all keywords)
- ✅ 80-120 daily clicks from Google
- ✅ Tier 20-50 blog status achieved

---

## Final Checklist Before Deployment

- [ ] All API keys added to Railway
- [ ] Google service account configured
- [ ] Railway build settings configured
- [ ] Deployment successful
- [ ] Logs show cron running
- [ ] First article published successfully
- [ ] Weekly report received
- [ ] GSC shows new articles

**When all checkboxes are complete, you're live! 🚀**
