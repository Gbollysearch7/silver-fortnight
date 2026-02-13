# SEMrush Filter Settings - EXACT PARAMETERS

## 🎯 Seed Keyword: "prop firm"

### Step-by-Step Filter Configuration

---

## 1️⃣ VOLUME FILTER

**Location:** Filter bar (top section)

**What to click:** "Volume" dropdown button

**What to enter:**
```
From: 0
To: 10
```

**Then:** Click "Apply" button

**Why:** This gives you Tier 0 keywords (0-10 monthly searches)

---

## 2️⃣ KEYWORD DIFFICULTY (KD %)

**Location:** Filter bar (next to Volume)

**What to click:** "KD %" dropdown button

**What to enter:**
```
From: 0
To: 15
```

**Then:** Click "Apply" button

**Why:** Low difficulty = easier to rank

---

## 3️⃣ INTENT FILTER

**Location:** Filter bar

**What to click:** "Intent" dropdown button

**What to select:**
```
✅ I (Informational) - CHECK THIS
✅ T (Transactional) - CHECK THIS
❌ N (Navigational) - UNCHECK THIS
❌ C (Commercial) - OPTIONAL (you can include or exclude)
```

**Then:** Click "Apply" button

**Why:** Informational + Transactional = best for Tier 0 content

---

## 4️⃣ ADVANCED FILTERS

**Location:** Click "Advanced filters" dropdown

### A. Word Count

**Box name:** "Word count"

**What to enter:**
```
From: 3
To: 10
```

**Why:** Longer phrases = more specific = easier to rank

### B. Competitive Density

**Box name:** "Competitive Density"

**What to enter:**
```
From: 0
To: 0.3
```

**Why:** Low competition in paid ads = better organic opportunity

### C. SERP Features (Optional - Advanced)

**Box name:** "SERP Features"

**What to select:**
```
❌ EXCLUDE "Featured Snippets" (too competitive for Tier 0)
✅ You can leave this blank for now
```

**Then:** Click "Apply" button at bottom of Advanced filters dropdown

---

## 5️⃣ SORT RESULTS

**Location:** Results table

**What to click:** Click on the "Volume" column header

**Action:** Make sure it's sorted **ASCENDING** (lowest volume first)

**Why:** You want to see 0-10 volume keywords at the top

---

## 6️⃣ EXPORT

**Location:** Top right of results table

**What to click:** "Export" button

**Format:** Select "CSV"

**Filename:** `semrush-prop-firm-tier0.csv`

**Save to:**
```
/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation/data/semrush-exports/
```

---

## 📋 COMPLETE SETTINGS CHECKLIST

Before exporting, verify all these are set:

- [ ] Volume: 0 to 10
- [ ] KD %: 0 to 15
- [ ] Intent: I + T selected
- [ ] Word count: 3 to 10
- [ ] Competitive Density: 0 to 0.3
- [ ] Sorted by Volume (ascending)
- [ ] Result count: 50-500 keywords

---

## 🎯 VISUAL REFERENCE

Here's what each box should show:

```
┌─────────────────────────────────────────────────────────────┐
│  Volume ▼  │  KD % ▼  │  Intent ▼  │  Advanced filters ▼   │
│  Vol: 0-10 │  0-15    │  I, T      │  ···                  │
└─────────────────────────────────────────────────────────────┘

Advanced filters dropdown (when opened):
┌──────────────────────────────────────┐
│ Word count                           │
│   From: 3        To: 10              │
│                                      │
│ Competitive Density                  │
│   From: 0        To: 0.3             │
│                                      │
│ SERP Features                        │
│   [Any]                              │
│                                      │
│   [Apply]  [Clear all fields]        │
└──────────────────────────────────────┘
```

---

## 🔄 REPEAT FOR REMAINING SEEDS

Apply EXACT same settings for:

1. ✅ prop firm → semrush-prop-firm-tier0.csv
2. ⏳ funded trading → semrush-funded-trading-tier0.csv
3. ⏳ prop firm challenge → semrush-challenge-tier0.csv
4. ⏳ trading drawdown → semrush-drawdown-tier0.csv
5. ⏳ profit target → semrush-profit-target-tier0.csv
6. ⏳ funded trader → semrush-funded-trader-tier0.csv
7. ⏳ prop firm rules → semrush-rules-tier0.csv
8. ⏳ trading challenge → semrush-trading-challenge-tier0.csv

---

## ⚠️ IMPORTANT NOTES

### What You Should See After Filters:

- **Before filters:** 5,000-7,000 keywords
- **After filters:** 50-500 keywords
- **Volume range:** All between 0-10 searches/month
- **KD range:** All between 0-15%

### If You See Too Many Results (>500):

**Option 1:** Tighten Volume to 0-5 instead of 0-10

**Option 2:** Add more word count (change From 3 to From 4)

**Option 3:** Lower KD % max to 10 instead of 15

### If You See Too Few Results (<50):

**Option 1:** Increase Volume to 0-20

**Option 2:** Increase KD % to 0-25

**Option 3:** Remove Competitive Density filter

---

## 🎨 VISUAL QUALITY CHECKS

### Good Keywords (Keep These):

✅ "prop firm challenge calculator excel" - Volume: 8, KD: 12%
✅ "how to pass ftmo challenge reddit" - Volume: 9, KD: 10%
✅ "funded trader profit split calculator" - Volume: 6, KD: 8%
✅ "trading challenge profit target formula" - Volume: 7, KD: 11%

### Bad Keywords (Skip These):

❌ "ftmo" - Volume: 4400, KD: 70% (too competitive)
❌ "prop firm" - Volume: 4400, KD: 70% (too broad)
❌ "best prop firms" - Volume: 880, KD: 45% (wrong tier)

---

## 📊 EXPECTED RESULTS PER SEED

| Seed Keyword | Expected Export Count |
|--------------|----------------------|
| prop firm | 80-150 keywords |
| funded trading | 60-120 keywords |
| prop firm challenge | 100-200 keywords |
| trading drawdown | 40-80 keywords |
| profit target | 30-60 keywords |
| funded trader | 50-100 keywords |
| prop firm rules | 40-70 keywords |
| trading challenge | 60-100 keywords |
| **TOTAL** | **460-880 keywords** |

After deduplication: **~400-600 unique keywords**

---

## ⏱️ TIME PER SEED

- Enter seed keyword: 10 seconds
- Apply all filters: 30 seconds
- Review results: 20 seconds
- Export CSV: 10 seconds
- **Total per seed: ~1 minute**
- **All 8 seeds: ~10 minutes**

---

## ✅ SUCCESS CRITERIA

You've done it right when:

1. All exports show 50-200 keywords each
2. All keywords have 0-10 monthly volume
3. All keywords have 0-15% KD
4. 8 CSV files saved in data/semrush-exports/
5. Total unique keywords: 400-600

---

## 🚀 AFTER ALL EXPORTS

Run this to see what you got:
```bash
ls -lh data/semrush-exports/
```

Then I'll build a script to:
1. Combine all 8 CSVs
2. Remove duplicates
3. Calculate KGR for top 100
4. Import to keyword queue
5. Generate content calendar

**Ready? Start with "prop firm" and tell me when you're done!** 🎯
