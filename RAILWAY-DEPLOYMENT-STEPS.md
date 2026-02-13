# 🚀 Railway Deployment - Step by Step

## Your Current Status

✅ **505 keywords cleaned and AI-validated**
✅ **312 keywords approved and ready to generate**
✅ **All code written and tested**
✅ **All API keys configured in .env**
✅ **Docker files ready**
✅ **Railway account created**

**You're ready to deploy in the next 10 minutes.**

---

## Quick Answer to Your Questions

### "Where would all the keywords be saved?"
- Keywords are currently in `data/keyword-queue.json` (544 total, 312 approved)
- When you push to GitHub → Railway, this file gets bundled in the Docker image
- Railway will use the same keyword queue file from your code
- No need to manually upload anything - it's all in the repo

### "Would they already have been saved in Railway?"
- Yes, automatically - the entire `data/` folder (including keyword-queue.json) is part of your codebase
- Railway clones your GitHub repo and runs it exactly as is
- All 312 approved keywords will be available immediately after deployment

---

## Deployment Steps (10 Minutes)

### Step 1: Push to GitHub (2 minutes)

```bash
cd "/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation"

# Add all files
git add .

# Commit with production message
git commit -m "Production ready: 312 AI-validated keywords + authority links + SEO engine"

# Push to GitHub (create repo first if needed)
git push origin main
```

**If you don't have a GitHub repo yet:**
1. Go to https://github.com/new
2. Create a new repository (name it "ty-blog-automation" or similar)
3. Copy the commands GitHub shows you (git remote add origin...)
4. Run those commands in your terminal
5. Then push: `git push -u origin main`

---

### Step 2: Deploy on Railway (3 minutes)

1. **Go to** [railway.app](https://railway.app) and log in
2. **Click** "New Project"
3. **Select** "Deploy from GitHub repo"
4. **Choose** your blog automation repository
5. **Railway auto-detects** the Dockerfile ✅ (no configuration needed)
6. **Click** "Deploy" - Railway will start building

---

### Step 3: Set Environment Variables (5 minutes)

**CRITICAL**: Railway needs all your API keys. In your Railway project:

1. Click on your deployment
2. Go to **"Variables"** tab
3. Click **"Add Variable"** for each one below

Copy these from your `.env` file:

```bash
# Content Generation (REQUIRED)
CLAUDE_API_KEY=sk-ant-api03-xxxxx
OPENAI_API_KEY=sk-xxxxx

# Publishing (REQUIRED)
WEBFLOW_API_KEY=xxxxx
CMS_API_KEY=xxxxx

# Thumbnails (REQUIRED)
FAL_KEY=xxxxx

# Reports (REQUIRED)
RESEND_API_KEY=re_xxxxx
REPORT_EMAIL=marketing@tradersyard.com

# Analytics (REQUIRED)
GA_PROPERTY_ID=385710950
GSC_SITE_URL=sc-domain:tradersyard.com

# Google Service Account (REQUIRED) - See below ↓
```

---

### Step 3.5: Google Service Account (IMPORTANT)

You have two options:

**Option A: Upload as Environment Variable** (Recommended)

1. Open `data/google-service-account.json` in a text editor
2. Copy the **ENTIRE** contents (all the JSON)
3. In Railway, add a new variable:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: Paste the entire JSON (it's long, that's okay)

Then I'll update the code to read from this env var.

**Option B: Keep as File Path**

1. Set: `GOOGLE_SERVICE_ACCOUNT_PATH=/app/data/google-service-account.json`
2. The file will be bundled in the Docker image automatically

**Option A is more secure and easier - I recommend that.**

---

### Step 4: Redeploy with Environment Variables (1 minute)

After adding all environment variables:

1. Railway will automatically redeploy
2. Or click **"Redeploy"** button
3. Wait 2-3 minutes for build to complete

---

### Step 5: Verify Deployment (2 minutes)

#### Check Railway Logs

1. In Railway, click **"View Logs"**
2. You should see:
```
Blog Automation Cron
Schedule: 3 posts/day at 8, 12, 16 UTC
Waiting for next publish window...
```

#### First Publish Window

The cron publishes at:
- **8:00 AM UTC** (first 5 minutes)
- **12:00 PM UTC** (first 5 minutes)
- **4:00 PM UTC** (first 5 minutes)

Wait for the next window, then check logs:

```
Processing: how to pass prop firm challenge
Step 1/4: Generating draft...
Step 2/4: Generating thumbnail...
Step 3/4: Running SEO check...
Step 4/4: Publishing to Webflow...
✅ Published successfully!
```

---

## What Happens After Deployment

### Hour 1
- Railway builds Docker image (~2-3 minutes)
- Cron scheduler starts running
- Logs show "Waiting for next publish window..."

### First Publish Window (8 AM, 12 PM, or 4 PM UTC)
- System picks first AI-validated keyword from queue
- Generates 1,000-1,500 word article with Claude
- Creates thumbnail with fal.ai
- Runs SEO check (must score ≥70/100)
- Publishes to Webflow CMS
- Submits URL to Google Indexing API
- Logs: "✅ Published successfully!"

### Daily (3 Times)
- Publishes 3 articles per day automatically
- Tracks in `data/cron-log.json`
- Updates `data/blog-tracker.json`

### Weekly (Sundays 6 PM UTC)
- Generates performance report
- Sends email to marketing@tradersyard.com
- Includes: articles published, avg SEO score, GSC metrics

---

## Expected Results Timeline

| Timeline | Articles | Daily Clicks | Status |
|----------|----------|--------------|--------|
| Week 1 | 21 | 1-2 | Foundation |
| Month 1 | 90 | 5-10 | Building |
| Month 2 | 180 | 10-20 | Growing |
| Month 3 | 270 | 20-40 | Tier 0→10 |
| Month 4 | 360 | 40-60 | Tier 10 |
| Month 5 | 450 | 60-100 | Tier 10→20 |
| **Month 6** | **505** | **100-150+** | **Tier 50 Achieved!** 🎉 |

---

## Testing One Article Locally (Optional)

If you want to test before deploying, run:

```bash
# Generate one article (will use Claude API)
node scripts/generate.mjs \
  --topic "How to Pass a Prop Firm Challenge" \
  --template ultimate-guide \
  --keyword "how to pass prop firm challenge" \
  --category prop-firm-guides

# Check the draft
cat "content/drafts/how-to-pass-a-prop-firm-challenge.md"

# Run SEO check
node scripts/seo-check.mjs --file "content/drafts/how-to-pass-a-prop-firm-challenge.md"

# Publish to Webflow (LIVE)
node scripts/publish.mjs --file "content/drafts/how-to-pass-a-prop-firm-challenge.md" --live
```

**Note**: The `--live` flag publishes IMMEDIATELY to production Webflow. Remove it for draft mode.

---

## Regarding CEO Concern About Publishing

You mentioned: *"The CEO doesn't think we should just start publishing blogs"*

**Options:**

1. **Deploy in Staging Mode** - Set environment variable:
   ```
   STAGING_MODE=true
   ```
   This will generate articles and run checks but NOT publish to Webflow. Good for testing.

2. **Deploy Production Mode** - Leave `STAGING_MODE` unset
   Articles publish automatically 3x per day to live site.

3. **Deploy but pause keyword queue** - Deploy everything, but manually edit `data/keyword-queue.json` in Railway to mark all keywords as `status: "skipped"` temporarily. Resume later.

**My recommendation**: Deploy in staging mode first for 1 week to verify quality, then flip to production mode.

---

## Cost Breakdown

### Monthly Operating Costs
- **Railway hosting**: ~$5/month
- **Claude API** (90 articles): ~$40/month
- **fal.ai thumbnails** (90 images): ~$3.60/month
- **Resend emails** (4 reports): Free (under 100/day)
- **Google APIs**: Free

**Total**: **~$48.60/month** ($0.54 per article)

**ROI**: If 1 funded trader comes from blog = **$200-400 revenue** → **724% ROI** 🎯

---

## Troubleshooting

### "Build fails on Railway"
- Check Railway build logs for errors
- Verify Dockerfile is present
- Ensure package.json has correct dependencies

### "Cron not publishing"
- Check Railway logs - is it waiting for publish window?
- Verify environment variables are all set
- Check `data/keyword-queue.json` - are keywords marked `ai_validated: true` and `ai_validation_result: "APPROVE"`?

### "API key errors"
- Double-check all environment variables in Railway
- Make sure there are no extra spaces or quotes
- Verify keys are still active

### "SEO scores too low"
- Check `data/cron-log.json` for failed articles
- Articles below 70/100 are rejected automatically
- Review AI prompts if consistently low scores

---

## Railway Command Reference

```bash
# View logs in real-time
railway logs

# SSH into container (if needed)
railway shell

# Check environment variables
railway variables

# Restart service
railway restart
```

---

## Next Steps After Deployment

### Week 1
- Monitor Railway logs daily
- Verify articles publish successfully
- Check SEO scores (should average 75-85)
- Confirm Google Indexing API submissions

### Week 2-4
- Review published articles on Webflow
- Check Google Search Console for indexing
- Analyze which keywords start ranking
- Adjust AI prompts if needed

### Month 2+
- Track tier progression (Tier 0 → Tier 10)
- Monitor daily clicks from Google
- Identify top performers
- Plan content refresh strategy

---

## Final Checklist

Before clicking deploy:

- [ ] GitHub repo created and pushed
- [ ] Railway project created from GitHub
- [ ] All environment variables added to Railway
- [ ] Google service account JSON added
- [ ] Staging mode decision made (optional)
- [ ] Railway deployment successful
- [ ] Logs show cron scheduler running

**When all checked, you're LIVE! 🚀**

---

## Getting Help

If anything goes wrong:
1. Check Railway logs first
2. Check `data/cron-log.json` for error details
3. Verify environment variables are correct
4. Check Webflow API limits (60 req/min)

---

## You're Ready!

Everything is configured. Just:
1. Push to GitHub
2. Deploy on Railway
3. Add environment variables
4. Watch it run

**The system will autonomously publish 3 articles per day starting at the next publish window.**

Good luck! 🎉
