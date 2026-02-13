# Fact-Checking & Research Agent System

## What This Is

An intelligent research agent that verifies facts from authoritative sources before generating content. Instead of blindly copying potentially stale competitor content, the system:

1. **Identifies fact-check topics** based on keywords (pricing, rules, statistics, regulation)
2. **Pulls fresh data** from TradersYard's Supabase database (real trader stats, payouts)
3. **Scrapes authoritative sources** directly (prop firm websites, regulatory bodies)
4. **Checks content freshness** and flags outdated competitor articles
5. **Feeds verified data** to GPT-4o with explicit instructions to use facts, not guesses

---

## New Files

### `lib/sources.mjs`
**Authoritative Source Registry** — Defines verified sources the AI can query:
- TradersYard (Supabase, Grafana, website)
- Major prop firms (FTMO, The5ers, TopstepTrader, etc.)
- Regulatory bodies (CFTC, NFA, FCA)
- Educational sources (Investopedia, BabyPips, TradingView)
- News sources (Bloomberg, Reuters, ForexLive)

Functions:
- `getSourcesByCategory(category)` — Filter sources by type
- `getPropFirm(name)` — Look up specific prop firm
- `detectFactCheckTopics(keyword, title)` — Detect which topics need verification

### `lib/supabase-client.mjs`
**TradersYard Data Client** — Queries real TradersYard data from Supabase:
- `getTradersYardStats()` — Pull trader statistics (funded traders, pass rates)
- `queryPayoutStats()` — Aggregate payout data (total paid, avg payout)
- `getTradersYardChallengeData()` — Fetch challenge rules and pricing
- `formatStatsForPrompt(stats)` — Format for AI prompt inclusion

**Note**: Update table names in this file to match your actual Supabase schema.

### `lib/fact-checker.mjs`
**Fact-Checking Engine** — Verifies claims and scrapes authoritative sources:
- `factCheck(keyword, title, template)` — Main fact-check orchestrator
- `scrapePropFirm(firm)` — Scrape competitor prop firm websites for pricing/rules
- `extractPropFirmData(markdown)` — Parse pricing and rules from scraped content
- `checkFreshness(competitorContent)` — Flag stale content (>12 months old)
- `formatVerifiedDataForPrompt(result)` — Format verified data for AI writer

---

## Enhanced Files

### `lib/researcher.mjs`
**Before**: Search Google → scrape top 3 → extract structure
**After**: Search → scrape → **fact-check authoritative sources** → check freshness → return verified data

New parameters:
- `title` — For fact-check topic detection
- `template` — To determine fact-check scope

New return value:
- `factCheckResult` — Includes `verifiedData`, `sources`, `warnings`

### `lib/ai-writer.mjs`
**Before**: Use competitor content as reference
**After**: **Prioritize verified data from fact-checker**, use competitor content only for structure

New prompt section:
```
=== VERIFIED DATA (Use these facts exactly) ===
TRADERSYARD VERIFIED DATA:
- Total traders: 1,234
- Funded traders: 567
- Pass rate: 46%
...
VERIFIED COMPETITOR DATA:
FTMO ($159): 10% profit target, 10% max drawdown...
=== END VERIFIED DATA ===
```

### `scripts/generate.mjs`
**Before**: `research(keyword)`
**After**: `research(keyword, { title, template })` — Passes context for fact-checking

New console output:
- "TradersYard data verified from Supabase"
- "3 prop firms verified"
- "Fact-check warnings: 2"

### `data/keyword-queue.json`
**New fields** for content strategy:

```json
{
  "contentType": "pillar",           // pillar | supporting | conversion | educational
  "pillarCluster": "prop-firm-fundamentals",  // Topic cluster this belongs to
  "targetWordCount": 3500,           // Overrides template default
  "minInternalLinks": 5,             // Required internal links (pillar pages need more)
  "ctaType": "educational"           // educational | conversion | hybrid
}
```

**Content type definitions**:
- **Pillar**: 3000+ words, high authority, main resource for a topic cluster
- **Supporting**: 1500-2500 words, covers subtopics, links to pillar
- **Conversion**: Bottom-funnel, drives signups (comparisons, reviews)
- **Educational**: Top-funnel, builds trust and authority

---

## How It Works

### Full Pipeline (with Fact-Checking)

```
Keyword: "best prop firms for beginners"
    ↓
1. Firecrawl search → Top 5 Google results
    ↓
2. Firecrawl scrape → Scrape top 3 for structure/topics
    ↓
3. Detect fact-check topics → "pricing" + "rules" detected
    ↓
4. Pull TradersYard data → Supabase query (real stats)
    ↓
5. Scrape prop firms → FTMO, The5ers, TopstepTrader (fresh pricing/rules)
    ↓
6. Check freshness → Flag articles >12 months old
    ↓
7. Format verified data → Inject into GPT-4o prompt
    ↓
8. GPT-4o generation → Write article using verified facts
    ↓
9. Save draft → Markdown with frontmatter
```

### What Gets Verified

| Topic | Sources | Data Points | Max Age |
|-------|---------|-------------|---------|
| **Pricing** | Prop firm websites | Prices, account sizes, profit targets | 7 days |
| **Rules** | Prop firms + TY | Drawdown, daily limits, time limits | 7 days |
| **Statistics** | TradersYard Supabase | Pass rate, avg payout, funded traders | 24 hours |
| **Regulation** | CFTC, NFA, FCA | License status, warnings | 30 days |

### Example Verified Data in Prompt

```
=== VERIFIED DATA ===

TRADERSYARD VERIFIED DATA:
- Total traders: 2,847
- Funded traders: 1,203
- Pass rate: 42%
- Total payouts: $1,847,230
- Average payout: $1,536
- Data last updated: 2/12/2026

TRADERSYARD CHALLENGE DETAILS:
- Standard Challenge: $100,000 account, $499 price, 10,000 profit target
- Rapid Challenge: $50,000 account, $299 price, 3000 profit target

VERIFIED COMPETITOR DATA:

FTMO (https://ftmo.com/en/):
  Pricing: $155, $250, $540, $1,080
  Profit target: 10%
  Max drawdown: 10%
  (Verified: 2/12/2026)

The5ers (https://the5ers.com/):
  Pricing: $75, $150, $300
  Profit target: 6%
  Max drawdown: 5%
  (Verified: 2/12/2026)

=== END VERIFIED DATA ===

IMPORTANT: Use the verified data above instead of relying on potentially outdated competitor content.
```

---

## Testing the System

### 1. Test fact-checking directly:

```bash
node -e "
import('./lib/fact-checker.mjs').then(async (m) => {
  const result = await m.factCheck('best prop firms', 'Best Prop Firms 2026', 'listicle');
  console.log(JSON.stringify(result, null, 2));
});
"
```

### 2. Test TradersYard data pull:

```bash
node -e "
import('./lib/supabase-client.mjs').then(async (m) => {
  const stats = await m.getTradersYardStats();
  console.log(m.formatStatsForPrompt(stats));
});
"
```

### 3. Test full generation with fact-checking:

```bash
node scripts/generate.mjs --topic "Best Prop Firms for Beginners" --template listicle --keyword "best prop firms for beginners" --category prop-firm-guides
```

Watch the console output:
- "Researching competitors + fact-checking..."
- "TradersYard data verified from Supabase"
- "3 prop firms verified"

---

## Configuration

### Supabase Setup
**Update** `lib/supabase-client.mjs` with your actual table names:
- Line 36: Replace `traders` table with your actual trader table
- Line 68: Replace `payouts` table with your actual payout table

### Add More Prop Firms
**Edit** `lib/sources.mjs` → `AUTHORITATIVE_SOURCES.propFirms`:

```javascript
{
  name: 'NewPropFirm',
  domain: 'newpropfirm.com',
  url: 'https://newpropfirm.com/',
  pricingPage: 'https://newpropfirm.com/pricing/',
  verifyPricing: true,
  verifyRules: true,
  lastVerified: null,
},
```

### Disable Fact-Checking for Specific Articles
Use the `--no-research` flag:

```bash
node scripts/generate.mjs --topic "..." --keyword "..." --no-research
```

---

## Content Strategy Framework

### Pillar vs Supporting Content

**Pillar Articles** (contentType: "pillar"):
- Comprehensive, 3000+ words
- Main resource for a topic cluster
- High internal linking (5+ links)
- Educational CTA
- Examples: "Complete Guide to Prop Trading", "Everything About Prop Firm Rules"

**Supporting Articles** (contentType: "supporting"):
- 1500-2500 words
- Cover specific subtopics
- Link back to pillar pages
- Examples: "How to Choose Account Size", "Understanding Drawdown Rules"

**Conversion Articles** (contentType: "conversion"):
- Bottom-of-funnel
- Direct CTA to pricing/signup
- Comparisons, reviews, "best X" lists
- Examples: "Best Prop Firms for Beginners", "TradersYard vs FTMO"

### Topic Clusters

Define clusters in `keyword-queue.json`:

```json
{
  "pillarCluster": "prop-firm-fundamentals",
  "contentType": "pillar"
}
```

All supporting articles should reference the same cluster:

```json
{
  "pillarCluster": "prop-firm-fundamentals",
  "contentType": "supporting"
}
```

This ensures the AI includes internal links to related articles in the cluster.

---

## Cost Impact

| Operation | Cost | Per Article |
|-----------|------|-------------|
| Firecrawl search | ~$0.01 | 1x |
| Firecrawl scrape (3 pages) | ~$0.03 | 3x |
| Prop firm verification (3 firms) | ~$0.03 | 3x |
| GPT-4o generation | ~$0.05-0.10 | 1x |
| **Total** | **~$0.12-0.17** | per article |

Fact-checking adds ~$0.06 per article (Firecrawl scrapes for prop firm verification).

**Worth it?** Yes — the cost of publishing one article with wrong pricing is far higher than $0.06.

---

## Next Steps

1. **Update Supabase table names** in `lib/supabase-client.mjs`
2. **Test the pipeline** with a real generation (see Testing section above)
3. **Review generated content** to verify facts are accurate
4. **Add more prop firms** to the source registry as needed
5. **Define topic clusters** for your content strategy
6. **Deploy to Railway** when ready

---

## Troubleshooting

### "Failed to fetch TradersYard data"
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify table names in `lib/supabase-client.mjs` match your schema
- Check Supabase RLS policies allow service role access

### "No prop firms verified"
- Check `FIRECRAWL_API_KEY` in `.env`
- Verify prop firm URLs are accessible (some may block scrapers)
- Check Firecrawl API quota/limits

### "Fact-check warnings"
- Review warnings in console output
- Some warnings are informational (stale competitor content)
- Critical warnings (failed verifications) should be investigated

---

## Future Enhancements

- [ ] Cache verified data (prop firm pricing) for 7 days to reduce scraping
- [ ] Add Google Sheets integration for manual fact overrides
- [ ] Build a web UI for reviewing/approving verified data before generation
- [ ] Add Slack/Discord notifications on fact-check failures
- [ ] Implement A/B testing for verified vs non-verified content performance
