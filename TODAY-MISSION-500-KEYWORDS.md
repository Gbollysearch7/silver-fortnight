# TODAY'S MISSION: 500 Keywords in Pipeline

## 🎯 Goal
Get 250-500 verified KGR keywords into the content pipeline and build a strategic content calendar.

---

## ✅ Step 1: SEMrush Keyword Research (NOW - Your Browser)

### Current Filter Settings (Copy These Exactly):

```
✅ Volume: Min 0, Max 10
✅ KD %: Min 0, Max 15
✅ Word Count: Min 3, Max 10
✅ Competitive Density: Max 0.3
✅ Intent: Select "I" (Informational) and "T" (Transactional)
✅ Trend: Visually check (avoid declining)
```

### Actions in SEMrush:

1. **Volume Filter:**
   - Click "Volume" dropdown
   - Custom range: 0 to 10
   - Click "Apply"

2. **KD % Filter:**
   - Click "KD %" dropdown
   - Custom range: 0 to 15
   - Click "Apply"

3. **Advanced Filters (click the dropdown):**
   - Word count: From 3, To 10
   - Competitive Density: From 0, To 0.3
   - Click "Apply"

4. **Intent Filter:**
   - Click "Intent" dropdown
   - Select: "I" (Informational) + "T" (Transactional)
   - Unselect: "N" (Navigational)
   - Click "Apply"

5. **Sort Results:**
   - Click "Volume" column header
   - Sort ascending (lowest first)

6. **Export:**
   - Click "Export" button (top right)
   - Choose "CSV"
   - Save as: `semrush-prop-firm-tier0.csv`

---

## 📋 Seed Keywords to Research (8 total)

Do the above steps for each seed keyword:

1. `prop firm` → semrush-prop-firm-tier0.csv
2. `funded trading` → semrush-funded-trading-tier0.csv
3. `prop firm challenge` → semrush-challenge-tier0.csv
4. `trading drawdown` → semrush-drawdown-tier0.csv
5. `profit target` → semrush-profit-target-tier0.csv
6. `funded trader` → semrush-funded-trader-tier0.csv
7. `prop firm rules` → semrush-rules-tier0.csv
8. `trading challenge` → semrush-trading-challenge-tier0.csv

**Time estimate:** 5 minutes per seed = 40 minutes total

---

## 📁 Save Location

Save all CSVs to:
```
/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation/data/semrush-exports/
```

---

## 🤖 Step 2: Your SEO Agents (Built & Ready!)

### SEO Keyword Research Agent
```bash
npm run agent:seo              # Full guide
npm run agent:seo -- --filters # Just show filters
npm run agent:seo -- --kgr     # KGR validation guide
npm run agent:seo -- --tips    # Pro SEO tips
```

### Content Calendar Agent
```bash
npm run agent:calendar             # Full strategy
npm run agent:calendar -- --strategy  # Content hierarchy
npm run agent:calendar -- --clusters  # Topic cluster examples
npm run agent:calendar -- --generate  # Generate calendar from queue
```

---

## 📊 What the Agents Will Teach You

### SEO Agent Shows:
- ✅ Optimal filter combinations
- ✅ Intent signal recognition
- ✅ Trend analysis
- ✅ KGR calculation & validation
- ✅ Content type mapping
- ✅ Quick win identification

### Calendar Agent Shows:
- ✅ Cluster → Pillar → Supporting architecture
- ✅ Topic clustering methodology
- ✅ Internal linking strategy
- ✅ Publishing cadence (when to publish what)
- ✅ 5 complete topic clusters for prop trading

---

## 🗓️ Content Calendar Strategy (Agent Output)

### Phase 1: Supporting Pages (60 days)
- Publish 60 Tier 0 articles (2/day)
- Word count: 800-1200 words
- Target: 0-10 monthly searches
- Focus: Build foundation

### Phase 2: Cluster Pages (15 days)
- Publish 5 cluster articles (1 every 3 days)
- Word count: 1500-2000 words
- Target: 10-50 monthly searches
- Focus: Group related content

### Phase 3: Pillar Page (1 day)
- Publish 1 comprehensive pillar article
- Word count: 3000-5000 words
- Target: 50-100 monthly searches
- Focus: Authority piece linking to ALL supporting

---

## 📈 Topic Clusters (From Calendar Agent)

### Cluster 1: Prop Firm Challenge Process
- Pillar: "Ultimate Guide to Prop Firm Challenges"
- 3 cluster pages
- 25-30 supporting pages
- **Total: ~35 articles**

### Cluster 2: Profits & Payouts
- Pillar: "Funded Trading Profit Guide"
- 3 cluster pages
- 20-25 supporting pages
- **Total: ~25 articles**

### Cluster 3: Risk Management & Drawdown
- Pillar: "Prop Firm Risk Management Guide"
- 3 cluster pages
- 20-25 supporting pages
- **Total: ~25 articles**

### Cluster 4: Rules & Requirements
- Pillar: "Prop Firm Rules Requirements Guide"
- 3 cluster pages
- 20-25 supporting pages
- **Total: ~25 articles**

### Cluster 5: Tools & Calculators
- Pillar: "Prop Firm Trading Tools Collection"
- 3 cluster pages
- 15-20 supporting pages
- **Total: ~20 articles**

**Grand Total: 130 articles across 5 clusters**

---

## ⏱️ Timeline for Today

| Time | Task | Duration |
|------|------|----------|
| Now | SEMrush research (8 seeds) | 40 mins |
| +40m | Save CSVs, organize | 5 mins |
| +45m | Review agent outputs | 15 mins |
| +60m | Understand content strategy | 30 mins |
| **Total** | **~90 minutes** |

---

## 🚀 Next Steps After Research

1. **Combine CSVs** (I'll build a script for this)
2. **KGR Validation** (manual allintitle checks for top 100)
3. **Import to Queue** (automated script)
4. **Generate Calendar** (run calendar agent)
5. **Start Staging Mode** (generate content during migration)

---

## 💡 Pro Tips from SEO Agent

### Intent Signals to Look For:
- **Transactional**: calculator, template, download, tool, spreadsheet
- **Commercial**: best, top, review, vs, comparison
- **Informational**: how to, what is, guide, explained, tips

### Quick Wins (Prioritize These):
- Volume 0-3 = fastest to rank
- Question keywords = featured snippet opportunities
- Calculator/template = high conversion
- Year modifiers (2026) = freshness signal

### Avoid:
- Declining trends (seasonal/dying)
- Navigational intent (brand searches)
- Featured snippet keywords (too competitive for Tier 0)
- High competitive density (>0.5)

---

## ✅ Success Criteria

By end of today you should have:

- [x] 8 CSV exports from SEMrush (~700 total keywords)
- [x] Understanding of SEO filter combinations
- [x] Knowledge of content hierarchy (cluster → pillar → supporting)
- [x] Clear topic clusters identified
- [x] Ready to import keywords and generate calendar tomorrow

---

## 🎯 Tomorrow's Tasks

1. Combine & deduplicate CSVs (script I'll build)
2. KGR validation (manual check top 100)
3. Import to keyword queue
4. Generate publishing calendar
5. Start staging mode (if migration in progress)
6. OR start normal publishing (if no migration)

---

## 📞 Need Help?

Run the agents anytime:
```bash
npm run agent:seo -- --help
npm run agent:calendar -- --help
```

Both agents are your co-pilots - they know SEO better than most humans! 🤖

---

## Let's Go! 🚀

**Your current task:** Apply those filters in SEMrush and export the first CSV.

Tell me when you're done with "prop firm" export and I'll guide you through the next steps!
