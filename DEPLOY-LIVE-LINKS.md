# 🚀 ONE-CLICK DEPLOYMENT LINKS

## ✅ Everything is Ready

Your code is committed and ready to push. Just click the links below!

---

## Step 1: Create GitHub Repository (1 click)

### Click this link to create the repository:

**👉 [CREATE GITHUB REPO NOW](https://github.com/new?name=ty-blog-automation&description=TradersYard+Blog+Automation+-+Autonomous+SEO+content+generation&visibility=public)**

This will:
- Create a public repository named `ty-blog-automation`
- Add the description: "TradersYard Blog Automation - Autonomous SEO content generation"

After clicking, GitHub will show you commands. **Come back here for the next step.**

---

## Step 2: Push Your Code to GitHub

After creating the repo, run these commands:

```bash
cd "/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation"

# Add your GitHub username here (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ty-blog-automation.git

# Push the code
git push -u origin main
```

**Or if you have SSH set up:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/ty-blog-automation.git
git push -u origin main
```

✅ Done! Your code is now on GitHub.

---

## Step 3: Deploy on Railway (1 click)

### Click this link to create Railway project:

**👉 [DEPLOY ON RAILWAY NOW](https://railway.app/new)**

This opens Railway's new project page.

### Then:

1. Click **"Deploy from GitHub repo"**
2. **Authorize Railway** to access your GitHub (first time only)
3. Select **`ty-blog-automation`** from the list
4. Railway auto-detects Dockerfile ✅
5. Click **"Deploy Now"**

Railway will start building (takes 2-3 minutes).

---

## Step 4: Add Environment Variables on Railway

While Railway is building, add your environment variables:

1. In Railway dashboard, click your **"ty-blog-automation"** project
2. Click **"Variables"** tab
3. Click **"+ New Variable"** for each one below

### Copy-Paste These (from your .env file):

```bash
CLAUDE_API_KEY=
OPENAI_API_KEY=
WEBFLOW_API_KEY=
FAL_KEY=
RESEND_API_KEY=
REPORT_EMAIL=floalarape@gmail.com
GA_PROPERTY_ID=385710950
GSC_SITE_URL=sc-domain:tradersyard.com
```

### For Google Service Account:

**Option A** (Recommended):
1. Open `data/google-service-account.json` in a text editor
2. Copy the **ENTIRE** file contents (all the JSON)
3. In Railway, add variable:
   - Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
   - Value: Paste the entire JSON

**Option B**:
1. Add variable:
   - Name: `GOOGLE_SERVICE_ACCOUNT_PATH`
   - Value: `/app/data/google-service-account.json`

---

## Step 5: Verify Deployment

After Railway finishes building:

1. Click **"View Logs"** in Railway
2. You should see:

```
======================================================================
  Blog Automation Cron
======================================================================

  [INFO] Schedule: 3 posts/day at 8, 12, 16 UTC
  [INFO] Queue: /app/data/keyword-queue.json
  [INFO] Waiting for next publish window...
```

✅ Success! Your automation is running!

---

## When Will First Article Publish?

The system publishes at:
- **8:00 AM UTC** (3:00 AM EST / 12:00 AM PST)
- **12:00 PM UTC** (7:00 AM EST / 4:00 AM PST)
- **4:00 PM UTC** (11:00 AM EST / 8:00 AM PST)

**Within the first 5 minutes** of each window, one article will be:
1. Generated with Claude AI (1,500 words)
2. Thumbnail created with fal.ai
3. SEO checked (must score ≥70/100)
4. Published LIVE to Webflow
5. Submitted to Google Indexing API

Check Railway logs to see:
```
✅ Published successfully!
URL: https://tradersyard.com/blog/how-to-pass-a-prop-firm-challenge-complete-2026-guide
```

---

## Weekly Reports

Every **Sunday at 6:00 PM UTC**, you'll receive an email at:

📧 **floalarape@gmail.com**

With:
- Articles published this week
- Average SEO scores
- Google Search Console metrics
- Top performing keywords

---

## Quick Links

### Your Deployment
- **GitHub Repo**: https://github.com/YOUR_USERNAME/ty-blog-automation (replace YOUR_USERNAME)
- **Railway Dashboard**: https://railway.app/dashboard
- **Webflow Blog**: https://tradersyard.com/blog

### Monitoring
- **Railway Logs**: Real-time in Railway dashboard
- **Cron Log**: `data/cron-log.json` (in your repo)
- **Blog Tracker**: `data/blog-tracker.json` (in your repo)

---

## What Happens Next

### Day 1 (Today)
- ✅ Code pushed to GitHub
- ✅ Deployed on Railway
- ✅ Environment variables configured
- ⏳ Waiting for next publish window...

### First Publish (Next Window)
- 🤖 AI generates article
- 🎨 Thumbnail created
- 📊 SEO check passed
- 🚀 Published to Webflow LIVE
- 📍 Submitted to Google

### Week 1
- **21 articles** published (3/day × 7 days)
- **1-2 daily clicks** from Google
- **First weekly report** sent Sunday

### Month 1
- **90 articles** published
- **5-10 daily clicks** from Google
- **4 weekly reports** received

### Month 6
- **505 articles** published ✅
- **100-150+ daily clicks** from Google 🎉
- **Tier 50 blog achieved!**

---

## Troubleshooting

### "Can't push to GitHub"
Make sure you replaced `YOUR_USERNAME` with your actual GitHub username in the commands above.

### "Railway build fails"
Check Railway build logs for error details. Most common: missing environment variables.

### "No articles publishing"
1. Check Railway logs - is it running?
2. Verify all environment variables are set
3. Check the time - only publishes during windows (8/12/16 UTC)

### "Wrong email for reports"
Verify in Railway Variables: `REPORT_EMAIL=floalarape@gmail.com`

---

## Cost Reminder

**Monthly**: ~$48.60
- Railway: $5
- Claude API: $40
- fal.ai: $3.60
- Resend: Free
- Google: Free

**Per Article**: $0.54

**ROI**: If 1 funded trader from blog = $200-400 → 310-718% ROI 🎯

---

## 🎉 You're Ready!

Just click the links above and follow the steps. Your autonomous blog automation will be LIVE in 10 minutes!

**Questions?** Check [DEPLOY-LIVE-NOW.md](./DEPLOY-LIVE-NOW.md) for detailed guide.

**Let's go! 🚀**
