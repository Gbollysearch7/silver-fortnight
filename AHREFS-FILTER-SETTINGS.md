# Ahrefs Filter Settings - EXACT PARAMETERS

## 🎯 Tool to Use: Keywords Explorer

**URL**: https://ahrefs.com/keywords-explorer

---

## 🔧 TIER 0 FILTER SETTINGS (0-10 Searches)

### Step-by-Step Configuration

---

### 1️⃣ ENTER SEED KEYWORD

**Location:** Main search box at top

**What to enter:**
```
prop firm challenge calculator
```

**Database:** Select "Google" and your target country (e.g., "United States" or "All countries")

**Click:** "Search"

---

### 2️⃣ NAVIGATE TO "MATCHING TERMS"

**Location:** Left sidebar

**Click:** "Matching terms" (this shows all variations of your seed keyword)

**Why:** This gives you the full keyword pool to filter

---

### 3️⃣ VOLUME FILTER

**Location:** Filter bar (top of results table)

**What to click:** "Volume" dropdown

**What to enter:**
```
Min: 0
Max: 10
```

**Then:** Click "Apply"

**Why:** Tier 0 = ultra-low competition keywords with 0-10 monthly searches

---

### 4️⃣ KEYWORD DIFFICULTY (KD) FILTER

**Location:** Filter bar

**What to click:** "KD" dropdown (Keyword Difficulty)

**What to enter:**
```
Min: 0
Max: 10
```

**Then:** Click "Apply"

**Why:** Ahrefs KD scale is 0-100. 0-10 = extremely easy to rank

**⚠️ IMPORTANT:** Ahrefs KD is MORE STRICT than SEMrush. KD 0-10 in Ahrefs ≈ KD 0-15 in SEMrush.

---

### 5️⃣ WORD COUNT FILTER

**Location:** Filter bar

**What to click:** "Word count" dropdown

**What to enter:**
```
Min: 3
Max: 10
```

**Then:** Click "Apply"

**Why:** Longer phrases = more specific = easier to rank

---

### 6️⃣ INCLUDE/EXCLUDE FILTERS (CRITICAL!)

**Location:** Click "Include" or "Exclude" buttons

**Exclude (remove branded keywords):**

Click "Exclude" → "Any of these words" → Paste:
```
ftmo, the5ers, topstep, earn2trade, fidelcrest, myfundedfx, myforexfunds, funded next, fundednext, blue guardian, blueguardian, lux trading, apex trader, apextrader, surge trader, surgetrader, funded trader plus, alpha capital, bulenox, city traders, e8 funding, fast track, instant funding, maven trading, take profit trader, skilled funded, traders with edge, funded peaks, elite trader, darwinex, oneup trader, opofinance, peak trader, prop trading tech, smart prop trader, tallinex, traders flow, tradex fund, 5percenters, funded futures, hyper funded, phoenix trader, prop firm x, quick funded, swift trader, oanda, fxcm, forex.com, ig markets, etoro, plus500, avatrade, pepperstone, xm, metatrader, mt4, mt5, tradingview, ninjatrader
```

**Include (optional - focus on specific types):**

Click "Include" → "Any of these words" → Paste:
```
calculator, formula, template, spreadsheet, checklist, guide, how to, tips, strategy, example, worksheet
```

**Then:** Click "Apply"

---

### 7️⃣ SEARCH INTENT FILTER (Ahrefs-Specific)

**Location:** Filter bar

**What to click:** "Intent" dropdown

**What to select:**
```
✅ Informational (check this)
✅ Commercial (check this - includes "best", "top", etc.)
❌ Navigational (uncheck - these are brand searches)
❌ Transactional (optional - can include if you want "buy" intent)
```

**Ahrefs Intent Types:**
- **Informational**: How-to, guides, educational
- **Commercial**: Best, top, review, comparison
- **Navigational**: Brand names, specific sites
- **Transactional**: Buy, download, sign up

**Then:** Click "Apply"

---

### 8️⃣ TRAFFIC POTENTIAL (Ahrefs Unique Feature)

**Location:** Filter bar

**What to click:** "TP" (Traffic Potential) dropdown

**What to enter:**
```
Min: 0
Max: 50
```

**Why:** Traffic Potential shows how much traffic the #1 ranking page gets. For Tier 0, we want low TP (less competition).

**Then:** Click "Apply"

---

### 9️⃣ PARENT TOPIC FILTER (Avoid Duplicates)

**Location:** Top right toggle

**What to do:** Turn ON "One article per parent topic"

**Why:** This removes duplicate keywords that would rank with the same article. Example:
- "prop firm calculator" and "prop firm calculator excel" = same parent topic
- Ahrefs will show only ONE of these

**Result:** Cleaner keyword list, no duplicate content issues

---

### 🔟 SERP FEATURES FILTER (Optional)

**Location:** Filter bar

**What to click:** "SERP features" dropdown

**What to exclude:**
```
❌ Featured snippet (too competitive for Tier 0)
❌ Knowledge panel (branded)
```

**What to include (optional):**
```
✅ People also ask (opportunity for FAQ schema)
```

**Then:** Click "Apply"

---

### 1️⃣1️⃣ SORT RESULTS

**Location:** Click column header

**What to click:** "Volume" column

**Action:** Sort **ascending** (lowest volume first)

**Why:** You want to see the 0-10 volume keywords at the top

---

### 1️⃣2️⃣ EXPORT

**Location:** Top right

**What to click:** "Export" button

**Format:** Select "CSV"

**Columns to include:**
- ✅ Keyword
- ✅ Volume
- ✅ KD (Keyword Difficulty)
- ✅ CPC (shows commercial value)
- ✅ Traffic Potential
- ✅ Parent Topic
- ✅ SERP features
- ✅ Intent

**Filename:** `ahrefs-prop-firm-challenge-calculator-tier0.csv`

**Save to:**
```
/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation/data/ahrefs-exports/tier0/
```

---

## 📋 COMPLETE TIER 0 FILTER CHECKLIST

Before exporting, verify:

- [ ] Volume: 0 to 10
- [ ] KD: 0 to 10 (Ahrefs scale)
- [ ] Word count: 3 to 10
- [ ] Exclude: Branded keywords list pasted
- [ ] Intent: Informational + Commercial selected
- [ ] Traffic Potential: 0 to 50
- [ ] Parent Topic: "One article per parent topic" ON
- [ ] Sorted by: Volume (ascending)
- [ ] Result count: 30-150 keywords (depends on seed)

---

## 🎯 VISUAL REFERENCE (Ahrefs UI)

```
┌─────────────────────────────────────────────────────────────────┐
│  Volume ▼  │  KD ▼  │  Intent ▼  │  TP ▼  │  [ ] One per topic │
│  Vol: 0-10 │  0-10  │  I, C      │  0-50  │  [x] One per topic │
└─────────────────────────────────────────────────────────────────┘

Include/Exclude section:
┌──────────────────────────────────────┐
│ Exclude: Any of these words          │
│   ftmo, the5ers, topstep...          │
│                                      │
│ Include: Any of these words          │
│   calculator, formula, guide...      │
│                                      │
│   [Apply]  [Clear]                   │
└──────────────────────────────────────┘
```

---

## 🔄 TIER 10, 20, 50 FILTER SETTINGS

### TIER 10 (10-20 Searches)

```
Volume: 10 to 20
KD: 0 to 15
Word count: 3 to 8
Traffic Potential: 0 to 100
Intent: Informational + Commercial + Transactional
Exclude: [Same brand list]
Parent Topic: ON
```

### TIER 20 (20-50 Searches)

```
Volume: 20 to 50
KD: 0 to 20
Word count: 2 to 6
Traffic Potential: 0 to 200
Intent: Commercial + Transactional + Informational
Exclude: [Same brand list]
Parent Topic: ON
```

### TIER 50 (50-100 Searches)

```
Volume: 50 to 100
KD: 0 to 25
Word count: 2 to 5
Traffic Potential: 0 to 500
Intent: Commercial + Transactional
Exclude: [Same brand list]
Parent Topic: ON
SERP Features: Include "People also ask"
```

---

## 📊 EXPECTED RESULTS PER SEED (Ahrefs)

| Seed Keyword | Tier 0 Expected | Tier 10 Expected | Tier 20 Expected |
|--------------|----------------|------------------|------------------|
| prop firm challenge calculator | 40-80 keywords | 30-60 keywords | 20-40 keywords |
| funded trader profit split | 30-60 keywords | 25-50 keywords | 15-30 keywords |
| trading drawdown calculation | 25-50 keywords | 20-40 keywords | 10-25 keywords |
| prop firm rules checklist | 20-40 keywords | 15-35 keywords | 10-20 keywords |
| ftmo challenge tips | 30-60 keywords | 25-50 keywords | 15-30 keywords |

**Total Expected (5 seeds, all tiers):**
- **Tier 0**: 145-290 keywords
- **Tier 10**: 115-235 keywords
- **Tier 20**: 70-145 keywords
- **TOTAL**: 330-670 keywords across all tiers

---

## ⚙️ AHREFS-SPECIFIC FEATURES TO USE

### 1. Parent Topic Clustering
**What it does:** Groups keywords that would rank with the same article

**Example:**
- "prop firm calculator"
- "prop firm calculator excel"
- "prop firm challenge calculator"

All three = same parent topic. Ahrefs shows just ONE.

**Action:** Always turn ON "One article per parent topic"

### 2. Traffic Potential (TP)
**What it does:** Shows actual traffic the #1 page gets (better than volume)

**Why better:** Keyword with 10 volume might have TP of 50 (because #1 page ranks for 10 related keywords)

**Sweet spot for Tier 0:** TP 0-50

### 3. Keyword Difficulty vs Volume
**Ahrefs KD scale is stricter:**
- KD 0-10 = extremely easy (equivalent to SEMrush KD 0-15)
- KD 11-20 = easy (equivalent to SEMrush KD 16-30)
- KD 21-30 = medium (equivalent to SEMrush KD 31-45)

**For Tier 0, stick to KD 0-10 max.**

### 4. SERP Overview
**What to check:** Click any keyword to see SERP preview

**Look for:**
- ✅ Low DR (Domain Rating) sites in top 10
- ✅ Forum results (Reddit, Quora)
- ✅ Weak content (thin pages, poor formatting)
- ❌ High DR sites (Investopedia, Forbes)
- ❌ Featured snippets

### 5. Content Gap Analysis (Advanced)
**After exporting Tier 0:**

1. Go to "Content Gap" tool
2. Enter top 3 competitor blogs
3. Find keywords they rank for but you don't
4. Filter by: Volume 0-10, KD 0-10
5. Export additional Tier 0 opportunities

---

## 🎨 AHREFS PRO TIPS

### Tip 1: Use "Questions" Filter
**Location:** Filter bar → "Questions"

**Action:** Select "Yes"

**Result:** Shows only question-based keywords like:
- "how to calculate prop firm drawdown"
- "what is a prop firm challenge"
- "why do prop firms have profit targets"

**Why gold:** Questions = featured snippet opportunities + high engagement

### Tip 2: Check "Return Rate"
**What it shows:** How often people search this keyword again

**High return rate** = evergreen content (people search monthly/yearly)

**Low return rate** = one-time search

**For Tier 0, prefer high return rate** (shows sustained interest)

### Tip 3: Use "Newly Discovered" Keywords
**Location:** Top filter → "Newly discovered"

**What it shows:** Keywords Ahrefs found in the last 30-60 days

**Why valuable:**
- Low competition (others haven't found them yet)
- Often 0 volume (not enough data) but real search intent
- Early mover advantage

### Tip 4: Export "Also Rank For"
**For each keyword:**
1. Click keyword
2. Scroll to "SERP overview"
3. Click top result
4. See "Also ranks for" section
5. Export related low-volume keywords

**This finds hidden Tier 0 gems!**

---

## 🚨 COMMON AHREFS MISTAKES TO AVOID

### Mistake 1: Using "Phrase Match" Instead of "Matching Terms"
❌ **Wrong:** "Phrase match" (shows only exact phrase)
✅ **Right:** "Matching terms" (shows all variations)

### Mistake 2: Not Using "Parent Topic" Filter
❌ **Without:** 150 keywords, 80% duplicates
✅ **With:** 50 keywords, all unique articles

### Mistake 3: Trusting Volume Over Traffic Potential
❌ **Volume 10** might = TP 5 (low value)
✅ **Volume 5** might = TP 80 (high value because #1 ranks for many related)

**Always check TP!**

### Mistake 4: Ignoring "Clicks" Column
**Clicks** shows actual clicks from search results

**Example:**
- Volume: 10
- Clicks: 2

**Why?** Featured snippet answers the query (no click needed)

**Action:** Skip keywords with Clicks < 30% of Volume

### Mistake 5: Not Checking SERP Features
Some Tier 0 keywords have:
- Featured snippets (hard to beat)
- Knowledge panels (informational, low CTR)
- "People also ask" (opportunity!)

**Always review SERP features column before finalizing list.**

---

## ⏱️ TIME PER SEED KEYWORD (Ahrefs)

- Enter seed keyword: 10 seconds
- Apply all filters: 60 seconds (Ahrefs has more options than SEMrush)
- Review "Parent Topic" grouping: 30 seconds
- Check SERP features: 20 seconds
- Export CSV: 10 seconds
- **Total per seed: ~2 minutes**
- **All 5 Tier 0 seeds: ~10 minutes**

---

## 📂 FILE ORGANIZATION (Ahrefs Exports)

Save exports to:
```
data/ahrefs-exports/
├── tier0/
│   ├── ahrefs-prop-firm-challenge-calculator-tier0.csv
│   ├── ahrefs-funded-trader-profit-split-tier0.csv
│   ├── ahrefs-trading-drawdown-calculation-tier0.csv
│   ├── ahrefs-prop-firm-rules-checklist-tier0.csv
│   └── ahrefs-ftmo-challenge-tips-tier0.csv
├── tier10/
│   ├── ahrefs-how-to-pass-prop-firm-challenge-tier10.csv
│   └── ...
├── tier20/
│   └── ...
└── tier50/
    └── ...
```

---

## ✅ AHREFS VS SEMRUSH COMPARISON

| Feature | Ahrefs | SEMrush |
|---------|--------|---------|
| **KD Scale** | 0-100 (stricter) | 0-100 (lenient) |
| **Parent Topic** | ✅ Yes (auto-clusters) | ❌ No |
| **Traffic Potential** | ✅ Yes (unique!) | ❌ No |
| **Clicks Data** | ✅ Yes | ❌ No |
| **Return Rate** | ✅ Yes | ❌ No |
| **SERP Preview** | ✅ Better | ✅ Good |
| **Ease of Use** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Keyword Volume** | ⭐⭐⭐⭐⭐ (larger) | ⭐⭐⭐⭐ |
| **Brand Exclusion** | Include/Exclude | Exclude only |

**Winner for Tier 0 research:** **Ahrefs** (Parent Topic + TP make it superior)

---

## 🎯 QUICK START CHECKLIST

Ready to start? Follow these steps:

1. [ ] Open Ahrefs Keywords Explorer
2. [ ] Enter seed: "prop firm challenge calculator"
3. [ ] Click "Matching terms"
4. [ ] Apply Volume filter: 0-10
5. [ ] Apply KD filter: 0-10
6. [ ] Apply Word count: 3-10
7. [ ] Exclude branded keywords (paste list)
8. [ ] Turn ON "One article per parent topic"
9. [ ] Sort by Volume (ascending)
10. [ ] Review first 20 results manually
11. [ ] Export CSV to data/ahrefs-exports/tier0/
12. [ ] Repeat for 4 more Tier 0 seeds

---

## 🚀 AFTER EXPORT

When you're done with all 5 Tier 0 seeds:

1. Let me know - I'll build a CSV merge script
2. We'll combine all exports into one master list
3. Remove duplicates (Ahrefs parent topic helps, but not perfect)
4. Calculate KGR for top 100 keywords
5. Import to keyword-queue.json
6. Start staging mode!

**Ready to start your first Ahrefs export?** 🎯
