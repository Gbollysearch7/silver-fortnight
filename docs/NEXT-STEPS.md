# Next Steps for TY Blog Automation

## ✅ Just Completed

### 1. In-Article Graphics Generator
**Status:** ✅ Installed and tested

**What it does:**
- Generates comparison charts for "X vs Y" articles
- Creates process flowcharts for how-to guides
- Builds data visualizations for statistics
- Designs concept diagrams for educational content

**Usage:**
```bash
npm run graphics -- --type comparison --topic "FTMO vs Funded Trader" --dry-run
```

**Cost:** ~$0.04 per image (~$2.40/month at 2 posts/day)

### 2. Anthropic SDK Installed
**Status:** ✅ Installed (`@anthropic-ai/sdk@^0.74.0`)

**Next:** Add your Claude API key to `.env`:
```bash
CLAUDE_API_KEY=sk-ant-...  # ← Add your key here
```

---

## 🚨 Critical Next Steps (Priority Order)

### 1. AI Content Generation Integration ⚡
**Status:** ⚠️ BLOCKING - System generates templates, not real articles

**Why critical:**
Your system currently creates **placeholder content** from templates. To run autonomously, you need real AI-generated articles.

**Implementation:**
```javascript
// In scripts/generate.mjs
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

// After loading template, call Claude:
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 4000,
  messages: [{
    role: "user",
    content: `Write a ${template} article about "${title}"
    targeting keyword "${keyword}".

    Requirements:
    - ${wordCount} words
    - Include TradersYard context
    - Natural keyword integration
    - Fact-check all claims
    - Follow SEO best practices`
  }]
});

// Replace template placeholders with real content
const article = message.content[0].text;
```

**Cost:** ~$0.015 per article (60 articles/month = $0.90/month)

**Timeline:** 1-2 hours implementation

---

### 2. KGR Keyword Research Pipeline
**Status:** ⚠️ Missing KGR data in keyword queue

**Current gap:**
```json
// data/keyword-queue.json currently missing:
{
  "tier": 0,              // ← Need this
  "kgr": 0.18,           // ← Need this
  "monthlySearches": 8,   // ← Need this
  "linkToPillar": "prop-firm-comparison"  // ← Need this
}
```

**Options:**

**Option A: Fiverr (Recommended for speed)**
- Cost: $50-100 for 100+ KGR keywords
- Turnaround: 3-5 days
- Search: "KGR keyword research trading"

**Option B: SEMrush API (Automated)**
- Your `.env` already has `SEMRUSH_API_KEY`
- Build script to calculate KGR automatically
- Formula: `allintitle:keyword` ÷ monthly searches ≤ 0.25

**Option C: Manual**
- Use Ahrefs/SEMrush manually
- Time-consuming but free

**Timeline:** 3-7 days (depending on option)

---

### 3. Fact-Checking Integration
**Status:** ⚠️ No verification system yet

**Why important:**
Per your memory notes, you must verify:
- Pricing data (max age: 7 days)
- Challenge rules (max age: 7 days)
- Statistics (max age: 24 hours)

**Implementation:**
```javascript
// Use Firecrawl MCP to scrape competitor sites
const competitorPricing = await mcp__claude_ai_firecrawl__firecrawl_scrape({
  url: 'https://ftmo.com/pricing',
  formats: ['markdown']
});

// Flag stale data
if (isOlderThan(competitorPricing.lastModified, 7, 'days')) {
  console.warn('⚠️  Competitor pricing may be stale');
}

// Verify against TradersYard Supabase
const realData = await querySupabase('prop_firms', { name: 'FTMO' });
```

**Sources priority:**
1. TradersYard Supabase (real trader data)
2. Prop firm websites (Firecrawl)
3. Regulatory bodies (CFTC, NFA, FCA)

**Timeline:** 2-3 hours implementation

---

## 🎯 Medium-Term Goals (Next 30 Days)

### 4. Migration to Main Domain
**Status:** 🚧 In progress (staging mode active)

**Current state:**
- System generating 2 posts/day in **staging mode**
- Posts saved to `content/approved/` (not published)
- Migration from `blog.tradersyard.com` → `tradersyard.com/blog/`

**Timeline:**
- Days 1-30: Staging (60 posts ready)
- Day 30: Migration complete
- Day 31: Bulk publish all 60 posts
- Result: Instant tier jump from Tier 0 → Tier 50

**Commands:**
```bash
# Monitor staging progress
npm run status

# After migration
npm run bulk-publish -- --yes
npm run tier:blog  # Verify tier jump
```

---

### 5. SERP Tracking Setup
**Status:** ⏳ Not started

**What you need:**
- Track rankings for all published keywords
- Alert when articles rank top 20
- Identify which need internal linking boost

**Options:**
- **SERPWatcher** (Mangools): $30/month
- **SEMrush Position Tracking**: Already have API key
- **Google Search Console**: Free (already integrated)

**Timeline:** 1-2 days setup

---

### 6. Internal Linking Audit
**Status:** ⏳ Not started

**Why important:**
Per SEO Avalanche strategy:
- KGR articles → Supporting articles → Pillar articles → Money pages

**Implementation:**
```javascript
// scripts/internal-linking-audit.mjs
const linkMap = buildLinkMap(allPublishedPosts);

// Find orphan posts (no incoming links)
const orphans = findOrphans(linkMap);

// Suggest linking opportunities
const suggestions = suggestLinks(orphans, linkMap);
```

**Timeline:** 1 day implementation

---

## 📊 Advanced Features (Next 60-90 Days)

### 7. A/B Testing for Thumbnails
Generate 3 variants per post, track CTR:

```javascript
const variants = ['bold', 'minimal', 'data-driven'];
const thumbnails = await Promise.all(
  variants.map(style => generateThumbnail(title, style))
);
// Rotate via Webflow, track winner in GA4
```

---

### 8. Social Media Graphics
Extend graphics.mjs to generate multiple sizes:

```javascript
const sizes = [
  { aspect: '16:9', use: 'blog OG image' },
  { aspect: '1:1', use: 'Instagram' },
  { aspect: '4:5', use: 'LinkedIn/Pinterest' }
];
```

---

### 9. Web Dashboard
Build admin panel for:
- Keyword queue management
- Performance metrics
- SEO scores
- Tier progression tracker

**Stack:** Next.js + Supabase + Shadcn UI

---

### 10. Pillar Content Creation
**Trigger condition:**
- 10+ supporting articles in cluster
- Average daily traffic > 50
- Supporting articles ranking top 20

**Process:**
1. Claude API generates 3,000+ word pillar
2. Links to all 10+ supporting articles
3. Advanced graphics (multiple charts)
4. Video embedding (optional)

---

## 💰 Cost Breakdown (Monthly)

| Service | Current | With AI Content |
|---------|---------|-----------------|
| Railway | $5 | $5 |
| fal.ai (thumbnails) | $2.40 | $2.40 |
| fal.ai (graphics) | $0 | $2.40 |
| Claude API | $0 | **$0.90** |
| **Total** | **$7.40** | **$10.70** |

**ROI:** Fully autonomous blog for **$10.70/month** vs hiring writers ($500+/month)

---

## 🎯 This Week's Action Items

- [ ] Add `CLAUDE_API_KEY` to `.env`
- [ ] Integrate Claude API into `scripts/generate.mjs`
- [ ] Test full pipeline with real AI content
- [ ] Order KGR keyword research (Fiverr or SEMrush)
- [ ] Implement fact-checking for pricing data
- [ ] Monitor staging mode progress

---

## 🤖 The Vision: Autonomous Agent

**Current state:**
- ✅ Autonomous scheduling (cron)
- ✅ Autonomous thumbnails (fal.ai)
- ✅ Autonomous SEO checks
- ✅ Autonomous publishing (Webflow)
- ✅ Autonomous indexing (Google)
- ⚠️ **Manual content** (templates only)

**After Claude API integration:**
- ✅ Autonomous content generation
- ✅ Autonomous fact-checking
- ✅ Autonomous graphics generation
- ✅ **Fully autonomous end-to-end**

**The agent will:**
1. Pick next KGR keyword from queue
2. Research topic via Firecrawl
3. Generate 1,500-3,000 word article via Claude API
4. Fact-check against Supabase + live sources
5. Generate thumbnail + comparison graphics
6. Run SEO audit (must score 70+)
7. Publish to Webflow
8. Submit to Google Indexing API
9. Track performance in GSC/GA4
10. Send weekly report via email

**All without human intervention.**

---

## 📚 Documentation

New docs created:
- [docs/GRAPHICS-GENERATION.md](./GRAPHICS-GENERATION.md) - Graphics system guide
- [docs/NEXT-STEPS.md](./NEXT-STEPS.md) - This file

Existing docs:
- [CLAUDE.md](../CLAUDE.md) - Main project guide
- [STAGING-WORKFLOW.md](../STAGING-WORKFLOW.md) - Migration workflow
- [TIER-0-KEYWORD-STRATEGY.md](../TIER-0-KEYWORD-STRATEGY.md) - SEO Avalanche
- [FACT-CHECKING-SYSTEM.md](../FACT-CHECKING-SYSTEM.md) - Verification system

---

**Ready to build a true AI agent that thinks on its own? Start with Claude API integration.** 🚀
