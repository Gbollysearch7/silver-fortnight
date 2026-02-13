# TradersYard Blog Automation System

## What This Project Is

An autonomous blog publishing pipeline for [TradersYard](https://tradersyard.com) — a proprietary trading firm. The system generates blog post drafts from a keyword queue, creates AI thumbnails, runs SEO audits, publishes to Webflow CMS, submits to Google Indexing API, and sends weekly email reports. It runs independently on Railway.app, publishing 3 posts per day without human intervention.

---

## Architecture Overview

```
keyword-queue.json → cron.mjs picks next "queued" keyword (AI-validated only!)
    ↓
generate.mjs → creates markdown draft from template
    ↓
thumbnail.mjs → generates image via fal.ai Ideogram v3
    ↓
seo-check.mjs → scores 0-100 (13 rules)
    ↓
publish.mjs → converts markdown → styled HTML → Webflow CMS
    ↓
index.mjs → submits URL to Google Indexing API
    ↓
report.mjs → weekly email via Resend API (Sundays 6PM UTC)
```

**NEW: AI Keyword Validation** (runs BEFORE content generation):
```
import-keywords.mjs → imports CSV to queue (ai_validated: false)
    ↓
ai-keyword-validator.mjs → Claude Sonnet 4.5 validates each keyword
    ↓
Approved keywords → status: queued (ready for generation)
Rejected keywords → status: skipped (branded or wrong-audience)
```

**Runtime**: Node.js 22 (ESM, `.mjs` files). Single dependency: `dotenv`.

**Hosting**: Railway.app (always-on container). `npm start` → `node scripts/cron.mjs`.

**Publishing Schedule**: 3 posts/day at 8:00 AM, 12:00 PM, and 4:00 PM UTC.

---

## Directory Structure

```
BLOG-AUTOMATION/
├── package.json              # ESM project, "start": "node scripts/cron.mjs"
├── config.json               # Webflow IDs, SEO rules, design tokens, templates
├── .env                      # API keys (see "Environment Variables" below)
├── Dockerfile                # node:22-slim, Railway deployment
├── railway.toml              # DOCKERFILE builder, ON_FAILURE restart
├── .dockerignore             #
│
├── lib/                      # Shared modules
│   ├── config.mjs            # Loads .env + config.json, exports paths + API keys
│   ├── utils.mjs             # CLI args, slugify, JSON file I/O, console colors, tracker CRUD
│   ├── markdown.mjs          # YAML frontmatter parser (regex, no deps), md→HTML converter
│   ├── html-styler.mjs       # TradersYard design system: TOC, tables, CTA, FAQ, inline CSS
│   ├── webflow.mjs           # Webflow API v2 client with rate limit handling
│   └── seo-checker.mjs       # 13-rule SEO engine (0-100 score)
│
├── scripts/                  # CLI automation scripts
│   ├── generate.mjs          # Create draft from topic + template + keyword
│   ├── seo-check.mjs         # Run SEO audit on markdown files
│   ├── thumbnail.mjs         # Generate images via fal.ai Ideogram v3
│   ├── publish.mjs           # Markdown → styled HTML → Webflow CMS
│   ├── index.mjs             # Submit URLs to Google Indexing API (JWT auth)
│   ├── calendar.mjs          # Editorial calendar CRUD
│   ├── performance.mjs       # Fetch GSC + GA4 metrics (requires googleapis)
│   ├── pipeline.mjs          # Orchestrator: seo → thumbnail → publish → index
│   ├── cron.mjs              # Autonomous scheduler (Railway entry point)
│   ├── report.mjs            # Weekly email report via Resend API
│   └── status.mjs            # Dashboard: pipeline overview + stats
│
├── content/
│   ├── templates/            # 5 blog post templates (ultimate-guide, listicle, how-to, comparison, success-story)
│   ├── drafts/               # Generated markdown drafts
│   ├── review/               # Posts awaiting review
│   ├── approved/             # Ready to publish
│   └── published/            # Published archive
│
├── output/
│   ├── html/                 # Webflow-ready HTML payloads (JSON)
│   ├── thumbnails/           # Generated PNG images
│   └── reports/              # Performance + SEO reports (markdown)
│
├── calendar/                 # Monthly editorial calendars (YYYY-MM.json)
│
└── data/
    ├── keyword-queue.json    # Keyword queue (statuses: queued → generating → published/failed)
    ├── blog-tracker.json     # Post tracking (slug → status, SEO score, Webflow ID, GSC metrics)
    ├── cron-log.json         # Append-only event log from cron runs
    └── indexing-results.json # Google Indexing API submission history
```

---

## Environment Variables (.env)

```bash
# Webflow API (REQUIRED for publishing)
WEBFLOW_API_KEY=           # Webflow API v2 bearer token
CMS_API_KEY=               # Alternate key (not currently used, kept for compat)

# Google (REQUIRED for indexing + performance)
GA_PROPERTY_ID=385710950
GSC_SITE_URL=sc-domain:tradersyard.com
GOOGLE_SERVICE_ACCOUNT_PATH=/path/to/google-service-account.json

# fal.ai (REQUIRED for thumbnails)
FAL_KEY=                   # fal.ai API key (format: uuid:hash)

# Firecrawl (optional, for competitor research)
FIRECRAWL_API_KEY=

# Supabase (optional, for future DB sync)
SUPABASE_URL=https://qbbqlnldleqobkymeudk.supabase.co
SUPABASE_ANON_KEY=

# Resend (REQUIRED for weekly reports)
RESEND_API_KEY=            # Get from https://resend.com
REPORT_EMAIL=              # Email address for weekly reports
```

**Note**: The `.env` file has ALL keys consolidated from TYSEO AGENT + TRADERS YARD SEO + marketing skills, including Resend, Omnisend, SEMrush, Grafana, and Google Sheets credentials. The Google service account is at `./data/google-service-account.json` (local path, works both locally and on Railway when bundled).

---

## Key External Services

| Service | Purpose | Auth Method | Cost |
|---------|---------|-------------|------|
| **Webflow CMS** | Blog publishing | Bearer token | Free (CMS plan) |
| **fal.ai (Ideogram v3)** | Thumbnail generation | `Key` header | ~$0.04/image |
| **Google Indexing API** | URL submission | Service account JWT | Free |
| **Google Search Console** | Performance metrics | Service account | Free |
| **Google Analytics 4** | Pageview metrics | Service account | Free |
| **Resend** | Weekly report emails | Bearer token | Free tier: 100 emails/day |
| **Railway.app** | Hosting (cron scheduler) | Git deploy | ~$5/month |

### Webflow CMS Details
- **Blog Collection ID**: `67b4bd39747043c9b6d29c6e`
- **API Base**: `https://api.webflow.com/v2`
- **Field Mapping**: `name` (title), `slug`, `post-body` (HTML), `post-summary` (description)
- **Rate Limits**: 60 req/min, handled automatically with retry on 429

---

## How the Cron Scheduler Works

`scripts/cron.mjs` runs continuously on Railway:

1. **Checks every 5 minutes** if it's a publish window
2. **Publish windows**: 8:00 AM UTC and 2:00 PM UTC (first 5 minutes of each hour)
3. **Daily limit**: 2 posts per day (tracked in `data/cron-log.json`)
4. **Picks next keyword** from `data/keyword-queue.json` sorted by priority (lower = higher)
5. **Runs 4-step pipeline**: generate → thumbnail → seo-check → publish → index
6. **Weekly report**: Sundays at 6:00 PM UTC via Resend email

### Keyword Queue Format (`data/keyword-queue.json`)
```json
{
  "queue": [
    {
      "id": "002",
      "keyword": "best prop firms for beginners",
      "title": "Best Prop Firms for Beginners (Honest Guide 2026)",
      "template": "listicle",
      "category": "prop-firm-guides",
      "priority": 1,
      "status": "queued",
      "notes": "Comparison format. TradersYard should rank #1."
    }
  ]
}
```

**Statuses**: `queued` → `generating` → `published` | `failed` | `skipped`

---

## CLI Quick Reference

```bash
# Generate a new draft
node scripts/generate.mjs --topic "Post Title" --template ultimate-guide --keyword "keyword" --category prop-firm-guides

# SEO check
node scripts/seo-check.mjs --file content/drafts/slug.md
node scripts/seo-check.mjs --all-drafts --update

# Generate thumbnail
node scripts/thumbnail.mjs --file content/drafts/slug.md
node scripts/thumbnail.mjs --all-missing --dry-run

# Publish to Webflow
node scripts/publish.mjs --file content/approved/slug.md --live
node scripts/publish.mjs --file content/drafts/slug.md --dry-run
node scripts/publish.mjs --list-fields

# Full pipeline
node scripts/pipeline.mjs --file content/drafts/slug.md
node scripts/pipeline.mjs --file content/drafts/slug.md --dry-run

# Cron scheduler
node scripts/cron.mjs                # Start continuous scheduler
node scripts/cron.mjs --once         # Run one cycle and exit
node scripts/cron.mjs --dry-run      # Preview without publishing

# Report
node scripts/report.mjs --preview    # Preview report without sending
node scripts/report.mjs              # Send via Resend

# Calendar
node scripts/calendar.mjs --view
node scripts/calendar.mjs --add --title "Post" --keyword "keyword" --date 2026-03-01

# Performance tracking
node scripts/performance.mjs         # Fetch GSC data for all blog posts
node scripts/performance.mjs --underperforming
node scripts/performance.mjs --report

# Status dashboard
node scripts/status.mjs
node scripts/status.mjs --verbose

# KGR Keyword Research
npm run kgr                # View Tier 0 keywords
npm run kgr -- --tier 10   # View Tier 10 keywords
npm run kgr:add            # Add keywords to queue
npm run kgr -- --generate  # Generate keyword ideas

# Staging Mode (generate without publishing)
npm run staging:once       # Generate one staged post
npm run staging            # Run staging cron
npm run bulk-publish       # Publish all staged content after migration

# Blog Migration
npm run redirects          # Generate redirect CSV
npm run tier:blog          # Calculate blog-only tier
```

---

## Staging Workflow (During Migration)

### Overview

While migrating from `blog.tradersyard.com` → `tradersyard.com/blog/`, you can **continue generating content without publishing** using staging mode.

### Quick Start

```bash
# 1. Add Tier 0 KGR keywords (0-10 monthly searches)
npm run kgr:add

# 2. Test staging mode (generates but doesn't publish)
npm run staging:once

# 3. Run continuous staging (2 posts/day)
npm run staging

# 4. After migration, bulk publish all staged content
npm run bulk-publish -- --yes
```

### How Staging Works

| Step | Normal Mode | Staging Mode |
|------|-------------|--------------|
| Research + AI Generation | ✅ Runs | ✅ Runs |
| Thumbnail + SEO Check | ✅ Runs | ✅ Runs |
| Webflow Publish | ✅ Publishes | ❌ Skipped |
| Google Indexing | ✅ Submits | ❌ Skipped |
| Status | `published` | `staged` |
| Storage | `content/published/` | `content/approved/` |

**Status Flow:** `queued` → `generating` → `staged` → (after migration) → `published`

### During Migration (30 days)

1. Enable staging mode in Railway:
   ```bash
   startCommand = "node scripts/cron.mjs --staging"
   ```

2. System generates 2 posts/day (60 posts total)

3. All content saved to `content/approved/` ready to publish

### After Migration Complete

1. Switch back to normal mode in Railway

2. Bulk publish all staged content:
   ```bash
   npm run bulk-publish -- --dry-run  # Preview first
   npm run bulk-publish -- --yes      # Publish all
   ```

3. Verify tier progression:
   ```bash
   npm run tier:blog  # Should show Tier 0 → Tier 10+ after publishing
   ```

**See [STAGING-WORKFLOW.md](./STAGING-WORKFLOW.md) for complete guide.**

---

## SEO Avalanche Technique (Tier Progression)

### Current Tier

Blog subdomain (`blog.tradersyard.com`) is at **Tier 0** (0 daily clicks).

Target keywords with **0-10 monthly searches** using KGR formula:

```
KGR = Allintitle Results ÷ Monthly Search Volume
Must be ≤ 0.25 to qualify
```

### Tier Progression Timeline

| Tier | Daily Clicks | Monthly Searches | Articles Needed | Timeline |
|------|--------------|------------------|-----------------|----------|
| 0 | 0-10 | 0-10 | 60-120 | Months 1-2 |
| 10 | 10-20 | 10-20 | 60-120 | Months 3-4 |
| 20 | 20-50 | 20-50 | 60-120 | Months 5-6 |
| 50 | 50-100 | 50-100 | 60-120 | Months 9-12 |

**Migration Shortcut:** Moving to `tradersyard.com/blog/` inherits Tier 50 instantly (skip 12 months).

**See [TIER-0-KEYWORD-STRATEGY.md](./TIER-0-KEYWORD-STRATEGY.md) and [BLOG-MIGRATION-GUIDE.md](./BLOG-MIGRATION-GUIDE.md) for details.**

---

## SEO Scoring Rules (100 points)

| Rule | Points | Severity |
|------|--------|----------|
| Title exists, <60 chars, contains keyword | 10 | error/warning |
| Meta description 150-160 chars, contains keyword | 10 | error/warning |
| Slug clean and <60 chars | 5 | warning |
| H1 contains primary keyword | 10 | warning |
| Keyword in first 100 words | 10 | warning |
| H2s contain secondary keywords | 10 | warning/info |
| Word count meets template minimum | 10 | error/warning |
| Internal links >= 3 | 10 | warning |
| Images have alt text | 5 | warning |
| Schema type defined | 5 | info |
| FAQ section present (for guides) | 5 | info |
| CTA defined in frontmatter | 5 | warning |
| Short paragraphs (<5 sentences) | 5 | info |

**Minimum to publish**: 70/100 (configurable in `config.json`)

---

## Design System (Inline CSS for Webflow)

- **Primary**: `#4250eb` (electric blue)
- **Dark BG 1**: `#1a1a2e`
- **Dark BG 2**: `#16161f`
- **Dark BG 3**: `#12121a`
- **Text Light**: `#e2e8f0`
- **Text Muted**: `#94a3b8`
- **Border**: `#2d2d44`
- **Success Green**: `#4ade80`

All HTML output uses inline CSS (required for Webflow CMS rich text fields).

---

## Blog Post Frontmatter Schema

```yaml
---
title: "Post Title"
slug: "post-slug"
description: "Meta description"
keywords:
  primary: "main keyword"
  secondary: ["keyword 2", "keyword 3"]
category: "prop-firm-guides"
author: "TradersYard"
template: "ultimate-guide"
status: "draft"
created_at: "2026-02-12T10:00:00Z"
updated_at: "2026-02-12T14:30:00Z"
scheduled_date: null
published_at: null
meta_title: "Post Title | TradersYard"
meta_description: "..."
seo_score: null
featured_image:
  url: null
  alt: "Alt text"
webflow_item_id: null
webflow_published: false
related_posts: ["slug-1", "slug-2"]
cta:
  text: "Start your challenge today"
  url: "https://tradersyard.com/#pricing"
---
```

---

## Templates (in `content/templates/`)

| Template | Target Words | Best For |
|----------|-------------|----------|
| `ultimate-guide.md` | 2,500-3,500 | Comprehensive how-to guides |
| `listicle.md` | 1,500-2,000 | "Top N" / "Best X" articles |
| `how-to.md` | 1,000-1,500 | Step-by-step tutorials |
| `comparison.md` | 2,000-3,000 | "X vs Y" comparisons |
| `success-story.md` | 800-1,200 | Trader interviews / case studies |

---

## Thumbnail Generation

- **Model**: fal.ai Ideogram v3 (`https://fal.run/fal-ai/ideogram/v3`)
- **Cost**: ~$0.04 per image
- **Format**: 16:9 landscape (1200x630 for OG images)
- **Style**: Professional dark fintech, navy background (#0F172A), electric blue (#4250EB) accents
- **Auto theme detection** based on template/title: guide, comparison, list, story, country, education, technical
- **Output**: `output/thumbnails/{slug}.png`

---

## Deployment to Railway

### Setup
1. Push this folder to a GitHub repo
2. Create a new Railway project from the repo
3. Railway auto-detects the Dockerfile
4. Add all environment variables from `.env` to Railway's environment settings
5. Deploy

### Railway Config (`railway.toml`)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node scripts/cron.mjs"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### Important for Railway
- `GOOGLE_SERVICE_ACCOUNT_PATH` needs adjustment — on Railway, the service account JSON should be stored as an env var or mounted file, not a local path
- Consider using `GOOGLE_SERVICE_ACCOUNT_JSON` env var (base64 encoded) and decoding it in `lib/config.mjs`

---

## Known Limitations & Next Steps

### Critical: AI Content Generation Gap
The `generate.mjs` script creates **template-based scaffolds with placeholder text**, not real articles. For true autonomous publishing, you need to integrate an AI content generation step. Options:
- **Claude API** — call `https://api.anthropic.com/v1/messages` in generate.mjs to write real articles
- **OpenAI API** — similar approach with GPT-4
- **Custom prompt engineering** — use the template structure + keyword + TradersYard data to generate full articles

This is the single biggest gap before the system can truly run autonomously.

### Pending Setup
- [x] Add real `RESEND_API_KEY` to `.env` — DONE (`re_auKf53Ek_...`)
- [x] Add real `REPORT_EMAIL` to `.env` — DONE (`marketing@tradersyard.com`)
- [x] Google service account copied to `./data/google-service-account.json` — path updated in .env
- [ ] Reset test data: `data/keyword-queue.json` item 001 is marked "published" from dry-run testing
- [ ] Install `jose` dependency for Google Indexing API JWT auth: `npm install jose`
- [ ] Install `googleapis` dependency for performance tracking: `npm install googleapis`

### Future Enhancements
- [ ] Build a web dashboard/interface for managing the keyword queue and viewing reports
- [ ] Add AI content generation (Claude API) to generate.mjs for real articles
- [ ] Supabase sync for blog tracker data
- [ ] Webhook endpoint for external triggers (e.g., add keyword via API)
- [ ] Slack/Discord notifications on publish or failure
- [ ] A/B testing for titles and meta descriptions
- [ ] Auto-refresh stale content based on performance data

---

## Two Supabase Instances

TradersYard has two Supabase instances:
1. **Main**: `qbbqlnldleqobkymeudk.supabase.co` — trader data, payouts, accounts, dashboard
2. **MCP**: Available via `mcp__supabase-tradersyard__` tools — may be the same instance or separate

For blog automation, use the main instance if syncing blog tracker data.

---

## Related Projects

- **Marketing Skills** (`ty agent 2026/marketing skills/`) — CRM, email campaigns, content skills, Grafana dashboard
- **TYSEO AGENT** (`TYSEO AGENT/`) — SEO automation with 25 Python scripts, Webflow publishing, content briefs
- **seo-agent** (`TYSEO AGENT/TRADERS YARD SEO/seo-agent/`) — Experimental SEO agent framework

This project is now a standalone folder at `2026-projects/TY Blog Automation/`. It was originally built inside `TYSEO AGENT/TRADERS YARD SEO/BLOG-AUTOMATION/`.

---

## Session History (Decisions Made)

1. **Framework**: Node.js ESM (`.mjs`) with minimal dependencies (only `dotenv`)
2. **Hosting**: Railway.app (~$5/mo) over Make.com, Vercel, or GitHub Actions
3. **Removed**: `social.mjs` and `email.mjs` (social media content + Omnisend newsletters) — removed per user request
4. **Added**: `thumbnail.mjs` (fal.ai), `cron.mjs` (autonomous scheduler), `report.mjs` (Resend email)
5. **Schedule**: 2 posts/day at 8 AM and 2 PM UTC
6. **Weekly report**: Sundays at 6 PM UTC via Resend
7. **Design**: Matches TradersYard brand — `#4250eb` primary, dark navy backgrounds
8. **SEO**: 13-rule scoring engine, minimum 70/100 to publish
9. **Webflow**: Uses existing collection `67b4bd39747043c9b6d29c6e` with field mapping from `create_blog_post.py`
10. **Thumbnails**: fal.ai Ideogram v3, auto theme detection, 16:9 format

---

## Tested Commands (All Passed)

```bash
node scripts/generate.mjs --topic "How to Pass a Prop Firm Challenge in 2026" --template ultimate-guide --keyword "prop firm challenge" --category prop-firm-guides
# ✅ Draft created in content/drafts/

node scripts/seo-check.mjs --file content/drafts/how-to-pass-a-prop-firm-challenge-in-2026.md
# ✅ Score: 53/100 (expected for template scaffold)

node scripts/publish.mjs --file content/drafts/how-to-pass-a-prop-firm-challenge-in-2026.md --dry-run
# ✅ HTML payload saved to output/html/

node scripts/thumbnail.mjs --file content/drafts/how-to-pass-a-prop-firm-challenge-in-2026.md --dry-run
# ✅ Prompt generated correctly

node scripts/calendar.mjs --add --title "Test Post" --keyword "test" --date 2026-03-01
# ✅ Entry added to calendar/2026-03.json

node scripts/status.mjs
# ✅ Dashboard displayed

node scripts/cron.mjs --once --dry-run
# ✅ Picked next queued keyword, ran dry-run pipeline

node scripts/report.mjs --preview
# ✅ Report stats displayed
```

---

## Bug Fixes Applied

1. **seo-check.mjs line 144**: Nested template literal with ternary caused SyntaxError. Fixed with if/else + string concatenation.
2. **thumbnail.mjs line 100**: `title.includes('in ')` matched "in 2026" triggering country theme incorrectly. Fixed with regex `/\bin [a-z]+(?!\s*\d)/.test(title)` to exclude "in" followed by numbers.
