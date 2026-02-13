# 🚂 Deploy to Railway NOW

## ✅ Code is on GitHub!

**Repository**: https://github.com/Gbollysearch7/silver-fortnight

---

## Click to Deploy on Railway

### 👉 [DEPLOY ON RAILWAY NOW](https://railway.app/new?referralCode=alphasec)

This will open Railway's deployment page.

---

## Deployment Steps

### 1. Connect GitHub Repository

1. Click **"Deploy from GitHub repo"**
2. If first time: Click **"Configure GitHub App"** and authorize Railway
3. Select **"Gbollysearch7/silver-fortnight"** from the list
4. Railway auto-detects Dockerfile ✅
5. Click **"Deploy Now"**

### 2. Add Environment Variables

While Railway is building, add your API keys:

1. Click your project name
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** for each:

```bash
CLAUDE_API_KEY=<your_claude_key>
OPENAI_API_KEY=<your_openai_key>
WEBFLOW_API_KEY=<your_webflow_key>
FAL_KEY=<your_fal_key>
RESEND_API_KEY=<your_resend_key>
REPORT_EMAIL=floalarape@gmail.com
GA_PROPERTY_ID=385710950
GSC_SITE_URL=sc-domain:tradersyard.com
```

### 3. Add Google Service Account

**CRITICAL**: Copy the entire contents of `data/google-service-account.json`:

1. In Railway Variables, click **"+ New Variable"**
2. Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
3. Value: Paste the **ENTIRE** JSON file contents
4. Click **"Add"**

### 4. Redeploy

After adding all variables:

1. Click **"Redeploy"** button
2. Wait 2-3 minutes for build
3. Check **"View Logs"** to see:

```
======================================================================
  Blog Automation Cron
======================================================================

  [INFO] Schedule: 3 posts/day at 8, 12, 16 UTC
  [INFO] Waiting for next publish window...
```

✅ **You're LIVE!**

---

## First Article Publishes:

**Next window:** 8:00 AM, 12:00 PM, or 4:00 PM UTC

**First keyword:** "how to pass prop firm challenge"

**Published to:** https://tradersyard.com/blog/

---

## Weekly Reports

Every **Sunday at 6:00 PM UTC** → **floalarape@gmail.com**

---

## Quick Links

- **GitHub Repo**: https://github.com/Gbollysearch7/silver-fortnight
- **Railway Dashboard**: https://railway.app/dashboard
- **Webflow Blog**: https://tradersyard.com/blog

---

**Deploy now! 🚀**
