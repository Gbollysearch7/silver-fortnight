# Tier 0 KGR Keyword Strategy

## Current Situation

**Blog Traffic**: 0 clicks/day (Tier 0)
**Target Keywords**: 0-10 monthly searches
**Goal**: Build to 10 daily clicks to advance to Tier 10

---

## How to Find Tier 0 KGR Keywords

### Method 1: Manual Research (Free)

**Step 1: Seed Keyword Generation**

Start with your main topics and add modifiers:

**Base Topics**:
- Prop firm challenge
- Funded trading
- Prop firm rules
- Trading drawdown
- Profit targets

**Long-tail Modifiers**:
- Calculator
- Formula
- Excel template
- Spreadsheet
- Checklist
- Worksheet
- PDF
- Guide
- Strategy
- Tips
- Example
- Template
- Step by step
- For beginners
- Reddit
- 2026

**Combine them**:
- "prop firm challenge calculator excel"
- "funded trader profit target formula"
- "drawdown calculation spreadsheet"
- "prop firm rules checklist pdf"

**Step 2: Check Search Volume**

Use free tools:
1. **Google Keyword Planner** (requires Google Ads account, can be $0)
   - Search your keywords
   - Filter: 0-10 monthly searches

2. **Ubersuggest** (Free tier: 3 searches/day)
   - Enter seed keyword
   - Filter by volume: 0-10

3. **AnswerThePublic** (Free tier)
   - Shows question-based keywords
   - Many will be 0-10 volume

**Step 3: Calculate KGR**

For each keyword with 0-10 monthly searches:

1. Google: `allintitle:"your exact keyword"`
2. Count results (shown at top)
3. Calculate: **KGR = Results ÷ Monthly Volume**
4. Keep if: **KGR ≤ 0.25**

**Example**:
```
Keyword: "prop firm challenge profit target calculator"
Monthly searches: 8
Allintitle results: 2
KGR = 2 ÷ 8 = 0.25 ✅ (exactly at threshold)
```

---

### Method 2: Fiverr Keyword Research ($5-50)

**Recommended Fiverr Search**: "KGR keyword research"

**What to Request**:
```
I need 30-45 KGR keywords for a prop trading blog.

Requirements:
- Monthly search volume: 0-10
- KGR score ≤ 0.25
- Topics: prop firm challenges, funded trading, trading rules, profit targets, drawdown
- Must include allintitle count and KGR calculation

Deliver as CSV with columns:
- Keyword
- Monthly searches
- Allintitle results
- KGR score
- Search intent (informational/commercial)
```

**Expected cost**: $10-30 for 30-45 keywords

---

### Method 3: SEMrush/Ahrefs (If You Have Access)

**SEMrush**:
1. Keyword Magic Tool
2. Enter seed: "prop firm"
3. Filter: Volume 0-10
4. Filter: KD (difficulty) 0-20
5. Export 100+ keywords
6. Manual allintitle check for top 45

**Ahrefs**:
1. Keywords Explorer
2. Enter seed: "funded trading"
3. Filter: Volume 0-10
4. Filter: KD 0-10
5. Check "Parent Topic" to avoid duplicates
6. Export and verify KGR manually

---

## Example Tier 0 Keywords (Prop Trading)

Here are 20 example keywords I'd target (you need 30-45 total):

| Keyword | Est. Volume | Intent | Article Type |
|---------|-------------|--------|--------------|
| prop firm challenge calculator excel | 5 | Transactional | How-to + download |
| funded trader profit split calculator | 8 | Informational | Tool/calculator |
| drawdown calculation formula prop firm | 6 | Informational | Educational |
| how to pass ftmo challenge reddit | 9 | Informational | Guide |
| prop firm daily loss limit calculation | 7 | Informational | How-to |
| funded trading account rules checklist | 4 | Informational | Checklist/PDF |
| prop firm evaluation phase tips | 8 | Informational | Listicle |
| trading challenge profit target formula | 6 | Informational | Educational |
| prop firm trailing drawdown explained | 9 | Informational | Guide |
| how to calculate max drawdown prop firm | 7 | Informational | How-to |
| funded trader consistency rule example | 5 | Informational | Guide |
| prop firm challenge spreadsheet template | 8 | Transactional | Template/download |
| ftmo challenge profit calculator | 9 | Transactional | Tool |
| prop firm account size selection guide | 6 | Informational | Comparison |
| funded trading minimum days rule | 7 | Informational | Educational |
| prop firm weekend holding allowed | 5 | Informational | Guide |
| trading challenge news trading rules | 6 | Informational | Guide |
| prop firm ea allowed policy | 4 | Informational | Guide |
| funded trader scaling plan strategy | 8 | Informational | How-to |
| prop firm payout schedule timeline | 7 | Informational | Guide |

---

## Content Strategy for Tier 0 Keywords

### Article Structure

**Word Count**: 800-1,200 words (don't overkill for low volume)

**H1**: Exact keyword match
**Example**: "Prop Firm Challenge Calculator Excel"

**Structure**:
```markdown
# [Exact Keyword]

[2-3 sentence intro addressing the search intent directly]

## What is [topic]?

[Definition + context]

## How to [do the thing]

[Step-by-step or explanation]

## [Related subtopic]

[Supporting info]

## FAQs

### Q: [Related question]?
[Answer]

## Conclusion

[Summary + soft CTA]
```

### Internal Linking

**For Tier 0 articles**:
- Link to 1-2 other Tier 0 articles (if they exist)
- Link to main site (tradersyard.com homepage or pricing)
- DON'T link to high-competition articles you haven't published yet

**Build upward**:
- Once you have 10+ Tier 0 articles, create a Tier 10 article
- That Tier 10 article links DOWN to all relevant Tier 0 articles
- This passes authority UP from the foundation

---

## Publishing Schedule

**Current capacity**: 2 posts/day

### Month 1 (60 posts)
- **Tier 0 only** (0-10 monthly searches)
- Publish 2/day for 30 days
- Track rankings weekly
- Target: 5-10 daily clicks by end of month

### Month 2 (60 posts)
- **Continue Tier 0** if not yet at 10 daily clicks
- **OR** start mixing Tier 10 (10-20 searches) if traffic growing
- Target: 10+ daily clicks to advance tier

### Month 3 (60 posts)
- **Tier 10** (10-20 monthly searches)
- First pillar article (2,500+ words) linking to Tier 0/10 foundation
- Target: 20 daily clicks

---

## Tracking & Progression

### Week 1-2 After Publishing

**Expected**: Articles enter top 50 for target keyword

**Check**:
```bash
npm run tier
```

Should start seeing clicks in GSC.

### Week 3-4 After Publishing

**Expected**: Articles climb to top 20

**What to track**:
- Impressions (GSC)
- Average position (should be 15-25)
- Click-through rate (1-3% is normal for position 15-20)

### Month 2+

**Expected**: Top 10 rankings for 60-80% of Tier 0 keywords

**When to advance**:
```bash
node scripts/tier-calculator-blog-only.mjs
```

If average daily clicks ≥ 10 → Move to Tier 10 keywords

---

## What If Articles Don't Rank?

### Diagnostics

**If 30+ Tier 0 articles published but NOT ranking top 20:**

1. **Check KGR scores** — were they really ≤ 0.25?
2. **Check indexing** — are pages actually indexed? (GSC Coverage report)
3. **Check content quality** — are you fully answering the query?
4. **Check technical SEO** — title tags, meta descriptions, H1 present?
5. **Check competition** — did you target keywords with high-authority competitors?

### Common Fixes

**Problem**: Pages not indexed
**Solution**: Submit sitemap, request indexing in GSC

**Problem**: Ranking position 25-50 (not top 20)
**Solution**: Add 200-300 more words, improve content quality

**Problem**: Zero impressions
**Solution**: Keyword has no actual search volume (happens with 0-10 tier)

**Problem**: High bounce rate
**Solution**: Improve content relevance, add visuals, better formatting

---

## Tier Progression Timeline

### Conservative Estimate (Based on SEO Avalanche Data)

| Month | Tier | Articles | Target Volume | Expected Traffic |
|-------|------|----------|---------------|------------------|
| 1 | 0 | 60 | 0-10 | 0-5 daily clicks |
| 2 | 0 | 120 | 0-10 | 5-10 daily clicks |
| 3 | 10 | 180 | 10-20 | 10-15 daily clicks |
| 4 | 10 | 240 | 10-20 | 15-20 daily clicks |
| 5 | 20 | 300 | 20-50 | 20-30 daily clicks |
| 6 | 20 | 360 | 20-50 | 30-50 daily clicks |
| 9 | 50 | 540 | 50-100 | 50-75 daily clicks |
| 12 | 50 | 720 | 50-100 | 75-100 daily clicks |

**By month 12**: Ready to compete for "best prop firms for beginners" type keywords

---

## Budget Estimate

### Option 1: DIY (Free)
- Manual KGR research: Free (time-intensive)
- Content: AI-generated via existing pipeline
- Total: $0 (just your time)

### Option 2: Fiverr Keywords ($10-30/month)
- Fiverr KGR research: $10-30 for 30-45 keywords
- Repeat monthly as you advance tiers
- Total: $120-360/year

### Option 3: SEMrush/Ahrefs ($99-199/month)
- Professional keyword research
- Competitor analysis
- Rank tracking
- Total: $1,188-2,388/year

**Recommendation**: Start with Option 2 (Fiverr) for first 3 months, then reassess based on results.

---

## Next Steps

1. **Choose research method** (Manual, Fiverr, or tool)
2. **Find 30-45 Tier 0 KGR keywords** (0-10 monthly searches)
3. **Update keyword-queue.json** with tier/KGR fields
4. **Publish 2 articles/day** for 30 days
5. **Track rankings** weekly in GSC
6. **Run tier calculator** monthly to check for progression

---

## Comparison: Migration vs SEO Avalanche

### Migration to Subdirectory
- **Timeline**: Instant Tier 50 authority
- **Effort**: 3-5 days of migration work
- **Risk**: Temporary traffic dip
- **Long-term**: Compete for valuable keywords immediately

### SEO Avalanche (Stay on Subdomain)
- **Timeline**: 12 months to Tier 50
- **Effort**: 360-720 articles over 12 months
- **Risk**: Low (proven technique)
- **Long-term**: Same end result, just takes longer

**Verdict**: If migration is possible → do it. If not → SEO Avalanche works, just slower.
