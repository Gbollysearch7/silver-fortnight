# Staging Workflow: Generate Content During Migration

## Overview

While the blog migration from `blog.tradersyard.com` → `tradersyard.com/blog/` is in progress, you can continue generating high-quality AI-powered content **without publishing it**. This staging workflow allows you to:

1. ✅ Build up a content bank during migration
2. ✅ Generate 2 posts per day autonomously
3. ✅ Store everything in `content/approved/` ready to publish
4. ✅ Bulk publish all staged content after migration is complete

---

## Quick Start

### 1. Add Tier 0 Keywords to Queue

Since the blog is at **Tier 0** (0 daily clicks), you need to target **0-10 monthly search** keywords using the KGR (Keyword Golden Ratio) formula.

```bash
# View 45 pre-researched Tier 0 keywords
npm run kgr

# Add them to your keyword queue
npm run kgr:add
```

This adds 45 Tier 0 KGR keywords to `data/keyword-queue.json` ready for staging.

### 2. Generate One Staged Post (Test)

```bash
# Generate one post in staging mode (won't publish)
npm run staging:once
```

This will:
- Pick next keyword from queue
- Research competitors via Firecrawl
- Fact-check claims from authoritative sources
- Generate AI article via GPT-4o
- Create thumbnail via fal.ai Ideogram v3
- Run SEO check (13 rules, 100-point score)
- Save to `content/approved/` (NOT publish to Webflow)
- Mark as "staged" in queue

### 3. Start Continuous Staging Mode

```bash
# Run staging cron (generates 2 posts/day at 8 AM and 2 PM UTC)
npm run staging
```

This runs continuously like the production cron, but **does not publish**. It generates content and stores it in `content/approved/` ready for bulk publish later.

---

## How Staging Mode Works

### Normal Mode vs Staging Mode

| Step | Normal Mode | Staging Mode |
|------|-------------|--------------|
| 1. Research | ✅ Runs | ✅ Runs |
| 2. AI Generation | ✅ Runs | ✅ Runs |
| 3. Thumbnail | ✅ Runs | ✅ Runs |
| 4. SEO Check | ✅ Runs | ✅ Runs |
| 5. Webflow Publish | ✅ Publishes | ❌ Skipped |
| 6. Google Indexing | ✅ Submits | ❌ Skipped |
| 7. Status | `published` | `staged` |
| 8. Storage | `content/published/` | `content/approved/` |

### Queue Status Flow

```
queued → generating → staged → (after migration) → published
```

Items marked as `staged` are ready to bulk publish after migration.

---

## During Migration Period

### Run Staging Cron on Railway

Update your Railway environment variable to enable staging mode:

```bash
# In Railway dashboard, set:
STAGING_MODE=true
```

Or update your `railway.toml`:

```toml
[deploy]
startCommand = "node scripts/cron.mjs --staging"
```

This will continue generating 2 posts per day but store them locally instead of publishing.

### Monitor Staging Progress

```bash
# Check how many staged posts you have
npm run status

# View keyword queue
cat data/keyword-queue.json | grep "staged"
```

### Add More Keywords During Migration

```bash
# Generate additional keyword ideas
npm run kgr -- --generate

# View Tier 10 keywords (if you advance tier)
npm run kgr -- --tier 10

# Add Tier 10 keywords to queue
npm run kgr -- --tier 10 --add-to-queue
```

---

## After Migration is Complete

### 1. Switch Back to Normal Mode

```bash
# In Railway, remove STAGING_MODE env var
# Or update railway.toml:
startCommand = "node scripts/cron.mjs"
```

### 2. Bulk Publish All Staged Content

```bash
# Preview what will be published (dry run)
npm run bulk-publish -- --dry-run

# Publish first 10 staged items
npm run bulk-publish -- --limit 10 --yes

# Publish ALL staged content
npm run bulk-publish -- --yes
```

This will:
- Publish all `staged` items to Webflow
- Submit all URLs to Google Indexing API
- Update queue status to `published`
- Add to blog tracker
- Rate limit: 2 seconds between each publish

### 3. Verify Published Content

```bash
# Check blog tracker
cat data/blog-tracker.json

# Check Webflow CMS
# https://webflow.com/dashboard/sites/67b4bd39747043c9b6d29c6b/cms/collections/67b4bd39747043c9b6d29c6e

# Run tier calculator to see if traffic increased
npm run tier:blog
```

---

## File Structure During Staging

```
content/
├── templates/           # 5 blog templates
├── drafts/              # Initial AI-generated drafts
├── review/              # (not used in staging)
├── approved/            # ✅ STAGED CONTENT GOES HERE
└── published/           # (only after bulk publish)

data/
├── keyword-queue.json   # Items marked "staged" instead of "published"
├── cron-log.json        # Events: type="staged" instead of "published"
└── blog-tracker.json    # Empty during staging (populated after publish)

output/
├── html/                # Webflow-ready payloads (generated but not sent)
├── thumbnails/          # Generated PNGs ready to upload
└── reports/             # SEO reports
```

---

## Cost Estimate for Staging

### Per Post Cost (AI-powered)

| Service | Cost per Post |
|---------|---------------|
| Firecrawl (3 scrapes + 1 search) | ~$0.04 |
| OpenAI GPT-4o (2,000 tokens) | ~$0.01 |
| fal.ai Ideogram v3 (thumbnail) | ~$0.04 |
| **Total per post** | **~$0.09** |

### 30-Day Staging Period

- **Posts generated:** 60 (2/day × 30 days)
- **Total cost:** ~$5.40
- **Storage:** Local files (no Webflow API calls)

**Note:** No Webflow publish costs during staging (those are free anyway). No Google Indexing API costs (also free).

---

## Quality Control During Staging

Even though you're not publishing, content is still high-quality:

1. **SEO Checked:** Every post scored 0-100 (min 70 to pass)
2. **Fact-Checked:** Claims verified from authoritative sources
3. **Competitor Research:** Analyzed top 3 ranking pages
4. **Brand Voice:** TradersYard-specific prompts and examples
5. **Thumbnails:** Professional dark fintech design

You can **manually review** staged content before bulk publish:

```bash
# Read a staged article
cat content/approved/prop-firm-challenge-calculator-excel.md

# Check SEO score
grep "seo_score:" content/approved/*.md
```

If a post doesn't meet quality standards, you can:
- Edit it manually before bulk publish
- Delete it and remove from queue
- Regenerate it (mark as `queued` again)

---

## Timeline Example

### Migration + Staging Period (30 days)

| Day | Migration Work | Staging Progress |
|-----|----------------|------------------|
| 1-5 | Webflow setup, redirects | 10 posts staged |
| 6-10 | DNS changes, testing | 10 posts staged (20 total) |
| 11-15 | GSC migration, monitoring | 10 posts staged (30 total) |
| 16-20 | Traffic recovery check | 10 posts staged (40 total) |
| 21-25 | Final validation | 10 posts staged (50 total) |
| 26-30 | Migration complete! | 10 posts staged (60 total) |

**Result:** 60 high-quality, SEO-optimized posts ready to publish on Day 31.

### Bulk Publish Day (Day 31)

```bash
# Morning: Bulk publish all 60 posts
npm run bulk-publish -- --yes

# Afternoon: Submit all to Google Indexing API (handled automatically)

# Evening: Check traffic in GSC
npm run tier:blog
```

**Expected:** Tier 0 → Tier 10 within 2-4 weeks after bulk publish.

---

## Troubleshooting

### "No keywords in queue"

**Problem:** Queue is empty or all items already processed.

**Solution:**
```bash
npm run kgr:add  # Add 45 Tier 0 keywords
```

### "OpenAI API error"

**Problem:** Missing or invalid `OPENAI_API_KEY`.

**Solution:** Check `.env` file:
```bash
OPENAI_API_KEY=sk-proj-...
```

### "Firecrawl API error"

**Problem:** Missing or invalid `FIRECRAWL_API_KEY`.

**Solution:** Check `.env` file:
```bash
FIRECRAWL_API_KEY=fc-...
```

### "fal.ai API error"

**Problem:** Missing or invalid `FAL_KEY`.

**Solution:** Check `.env` file:
```bash
FAL_KEY=uuid:hash
```

### Staged content not in content/approved/

**Problem:** Files saved to `content/drafts/` instead.

**Solution:** This is expected. The `generate.mjs` script saves to `drafts/`, then you manually move to `approved/` or the SEO check moves passing articles. The queue still tracks them as "staged".

### Bulk publish fails with "File not found"

**Problem:** Slug mismatch between queue and actual filename.

**Solution:**
```bash
# List all approved files
ls content/approved/

# Check queue slugs
cat data/keyword-queue.json | grep "slug"

# Manually rename files if needed or regenerate
```

---

## Migration Checklist

### Pre-Staging Setup
- [x] Install dependencies: `npm install googleapis`
- [x] Add Tier 0 keywords: `npm run kgr:add`
- [x] Test staging mode: `npm run staging:once`
- [ ] Deploy to Railway with staging mode enabled

### During Migration
- [ ] Run staging cron continuously: `npm run staging`
- [ ] Monitor progress weekly: `npm run status`
- [ ] Add more keywords as needed: `npm run kgr:add`
- [ ] Review staged content quality (optional)

### Post-Migration
- [ ] Complete blog migration (see BLOG-MIGRATION-GUIDE.md)
- [ ] Verify redirects working: `npm run redirects`
- [ ] Switch Railway back to normal mode
- [ ] Bulk publish staged content: `npm run bulk-publish -- --yes`
- [ ] Verify all posts in Webflow CMS
- [ ] Run tier calculator: `npm run tier:blog`
- [ ] Monitor GSC for indexing and traffic

---

## Alternative: SEO Avalanche (No Migration)

If you decide **NOT to migrate** and stay on `blog.tradersyard.com`, you can still use staging mode to build content, then switch to normal publish mode when ready.

See [TIER-0-KEYWORD-STRATEGY.md](./TIER-0-KEYWORD-STRATEGY.md) for the 12-month SEO Avalanche roadmap.

---

## Summary

**Staging Mode Benefits:**
- ✅ Continue content generation during migration downtime
- ✅ Build 60-day content bank (120 posts)
- ✅ Quality-check everything before publishing
- ✅ Bulk publish on Day 1 after migration
- ✅ Instant tier jump from inherited authority

**Commands:**
```bash
npm run kgr:add           # Add keywords
npm run staging:once      # Test staging
npm run staging           # Run continuous staging
npm run bulk-publish      # Publish after migration
```

**Next Steps:**
1. Add keywords to queue
2. Enable staging mode
3. Complete migration
4. Bulk publish all content
5. Monitor tier progression
