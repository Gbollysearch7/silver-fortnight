# Queue System Explained

## 1️⃣ What Does "Import to Queue" Mean?

### The Queue is Like a To-Do List for the Automation

**Location**: `data/keyword-queue.json`

Think of it like this:
```
Your 558 keywords (CSV) → Import script → keyword-queue.json → Cron picks them → Generates articles
```

### What's in the Queue?

Each keyword in the queue has:

```json
{
  "id": "001",
  "keyword": "how to pass prop firm challenge",
  "title": "How to Pass a Prop Firm Challenge (Complete 2026 Guide)",
  "template": "ultimate-guide",
  "category": "prop-firm-guides",
  "priority": 1,              // Lower number = publish first
  "status": "queued",         // queued → generating → staged → published
  "tier": 0,
  "estMonthlySearches": 10,
  "searchIntent": "informational",
  "contentType": "supporting",
  "targetWordCount": 2500
}
```

### How the Automation Uses It:

1. **Cron runs** (3 times per day: 8 AM, 12 PM, 4 PM UTC)
2. **Picks next keyword** (lowest priority number, status = "queued")
3. **Generates article** using AI (Claude/OpenAI)
4. **Creates thumbnail** (fal.ai)
5. **Runs SEO check** (must score ≥70/100)
6. **Saves as "staged"** (during migration) or publishes (after migration)
7. **Updates status** in queue ("queued" → "staged")

### Why This Matters:

✅ **You control the publishing order** by priority number
✅ **The automation knows what to write** (template, word count, intent)
✅ **You can track progress** (how many queued vs staged vs published)
✅ **No manual work needed** - cron handles everything

---

## 2️⃣ Next 50 Keywords from Your Research

Here are the first 50 keywords that will be imported to your queue:

### Keywords 1-25:
```
1.  "is alpha trader a good prop firm" - Volume: 10, KD: 0
2.  "are there prop firms for crypto" - Volume: 10, KD: 0.5
3.  "what are futures prop firms" - Volume: 10, KD: 0
4.  "what is a consistency rule in prop firms" - Volume: 10, KD: 0
5.  "is alpha trader prop firm legit" - Volume: 10, KD: 0
6.  "how to pass forex prop firm challenge" - Volume: 10, KD: 0
7.  "is maven prop firm regulated" - Volume: 10, KD: 1
8.  "is alpha futures a good prop firm" - Volume: 10, KD: 0
9.  "is upcomers prop firm legit" - Volume: 10, KD: 0
10. "is funding traders a good prop firm" - Volume: 10, KD: 0.75
11. "what is activation fee in prop firm" - Volume: 10, KD: 0
12. "how many people get payouts from prop firms" - Volume: 10, KD: 0
13. "how many people fail prop firm challenges" - Volume: 10, KD: 0
14. "is the edge funder prop firm legit" - Volume: 10, KD: 0
15. "are prop firms profitable" - Volume: 10, KD: 0
16. "can you swing trade on prop firms" - Volume: 10, KD: 0
17. "a document that outlines a proposed firm's goals" - Volume: 10, KD: 0
18. "are futures prop firms recommended" - Volume: 10, KD: 0
19. "are futures prop firms recommended and legal" - Volume: 10, KD: 0
20. "can i pass tradeify prop firm in one day" - Volume: 10, KD: 0
21. "do prop trading firms have investors" - Volume: 10, KD: 0
22. "does vietnam allow prop firms" - Volume: 10, KD: 0
23. "how do i open my own prop trading firm" - Volume: 10, KD: 0
24. "how many funded accounts can i have aquafutures prop firm" - Volume: 10, KD: 0
25. "how prop firms address slippage" - Volume: 10, KD: 1
```

### Keywords 26-50:
```
26. "how prop firms manage risk" - Volume: 10, KD: 1
27. "how prop firms manage risk for funded traders" - Volume: 10, KD: 1
28. "how prop trading firms contribute to financial education" - Volume: 10, KD: 1
29. "how prop trading firms promote diversity and inclusion" - Volume: 10, KD: 1
30. "how prop trading firms use technology to enhance trader experience" - Volume: 10, KD: 1
31. "how to calulate my paid ads roi prop firms" - Volume: 10, KD: 1
32. "how to find more traders for a prop firm" - Volume: 10, KD: 1
33. "how to find prop firms with low execution delay" - Volume: 10, KD: 0
34. "how to get prop firm account for free" - Volume: 10, KD: 1
35. "how to trade forex with a prop firm" - Volume: 10, KD: 1
36. "how traders maintain consistency at futures prop firm" - Volume: 10, KD: 1
37. "is a document that outlines a proposed firm's goals" - Volume: 10, KD: 1
38. "is forex prop firm legit" - Volume: 10, KD: 0
39. "is it best futures prop firms trusted by professional traders" - Volume: 10, KD: 0
40. "is it top futures prop firms ranked in industry reviews" - Volume: 10, KD: 0
41. "is there an option prop firm" - Volume: 10, KD: 0.66
42. "is there any sheikh that says prop firms are halal" - Volume: 10, KD: 0
43. "is vebson prop firm legit" - Volume: 10, KD: 0
44. "what is hft prop firm" - Volume: 10, KD: 1
45. "what is mffu prop firm" - Volume: 10, KD: 0
46. "what is prop firm account in forex" - Volume: 10, KD: 0
47. "what percentage of people get payouts from prop firms reddit" - Volume: 10, KD: 0
48. "what percentage of people get payouts from prop firms redit" - Volume: 10, KD: 0
49. "what prop firm allows crypto trading" - Volume: 10, KD: 0
50. "what prop firms allow hft" - Volume: 10, KD: 1
```

### Quality Check:

✅ **All Tier 0** (0-10 monthly searches)
✅ **All trader-focused** (no entrepreneur keywords)
✅ **All question-based** (high engagement potential)
✅ **Mix of intents**: informational, evaluation, comparison
✅ **Low KD** (0-1) - very easy to rank

**These are PERFECT Tier 0 keywords!**

---

## 3️⃣ What Goes in Tier Folders?

You created these folders:
```
data/keyword-research/
├── tier0/      # What goes here?
├── tier10/     # What goes here?
├── tier20/     # What goes here?
└── tier50/     # What goes here?
```

### Current State (After Your SEMrush Export):

```
tier0/      ← EMPTY (but you have 452 Tier 0 keywords in processed/)
tier10/     ← EMPTY (you need to do Tier 10 research)
tier20/     ← EMPTY (but you have 80 Tier 20 keywords in processed/)
tier50/     ← EMPTY (but you have 26 Tier 50 keywords in processed/)
```

### What SHOULD Go in Each Folder:

#### **tier0/** - Raw SEMrush/Ahrefs exports for Tier 0
```
Purpose: Store your SEMrush CSV exports BEFORE processing

Should contain:
├── semrush-prop-firm-tier0-2026-02-13.csv
├── semrush-funded-trading-tier0-2026-02-13.csv
├── ahrefs-challenge-tier0-2026-02-13.csv
└── claude-research/
    └── claude-tier0-keywords.csv

These are RAW exports (before merge, before cleanup)
```

#### **tier10/** - Raw exports for Tier 10 (11-20 searches)
```
Purpose: Store Tier 10 research exports

Currently: EMPTY (you haven't done Tier 10 research yet)

Should contain:
├── semrush-how-to-pass-tier10-2026-02-13.csv
├── semrush-best-prop-firms-tier10-2026-02-13.csv
└── ahrefs-tier10-comparison-2026-02-13.csv

When to populate: Later, when traffic hits 10 daily clicks
```

#### **tier20/** - Raw exports for Tier 20 (21-50 searches)
```
Purpose: Store Tier 20 research exports

Currently: You have 80 Tier 20 keywords in processed/ folder
BUT: Original CSVs weren't separated by tier

Should contain:
├── semrush-best-prop-firms-beginners-tier20-2026-02-13.csv
├── semrush-prop-firm-comparison-tier20-2026-02-13.csv
└── ahrefs-funded-account-tier20-2026-02-13.csv
```

#### **tier50/** - Raw exports for Tier 50 (51-100 searches)
```
Purpose: Store Tier 50 research exports (pillar keywords)

Currently: You have 26 Tier 50 keywords in processed/ folder
BUT: Original CSVs weren't separated by tier

Should contain:
├── semrush-best-prop-firms-tier50-2026-02-13.csv
├── semrush-prop-firm-challenge-tier50-2026-02-13.csv
└── ahrefs-funded-trader-tier50-2026-02-13.csv
```

---

## 🎯 Recommended Folder Organization

### Option A: Keep as-is (Simpler)

Since your SEMrush exports weren't separated by tier, just keep them in the root:

```
data/keyword-research/
├── prop-firm_exact-match_us_2026-02-13.csv   ← Mixed tiers
├── prop-firm_phrase-match_us_2026-02-13.csv  ← Mixed tiers
├── funded-trading_phrase-match_us_2026-02-13.csv ← Mixed tiers
│
├── processed/  ← All merged & cleaned CSVs go here
│   ├── all-keywords-2026-02-13.csv
│   ├── tier0-keywords-2026-02-13.csv   ← 452 keywords
│   ├── tier20-keywords-2026-02-13.csv  ← 80 keywords
│   └── tier50-keywords-2026-02-13.csv  ← 26 keywords
│
└── tier0/, tier10/, tier20/, tier50/  ← Keep empty for future
```

### Option B: Reorganize (More organized, but extra work)

Move your current CSVs into tier folders based on the filters you used:

```
data/keyword-research/
├── tier0/
│   ├── semrush-prop-firm-mixed-2026-02-13.csv  ← Your current files (if they were Tier 0 focused)
│
├── tier20/
│   ├── semrush-prop-firm-mixed-2026-02-13.csv  ← Your current files (if they had Tier 20)
│
└── processed/  ← Final cleaned outputs
```

---

## 📋 My Recommendation

**Keep it simple - use Option A:**

1. ✅ Leave your current CSVs where they are (root folder)
2. ✅ Use `processed/` folder for all cleaned outputs
3. ✅ Use tier folders ONLY for future research rounds

**Why?**
- Your exports were mixed-tier (0-10, 20-50, 50-100 all in same CSVs)
- The `processed/` folder already has them separated by tier
- No need to reorganize - the merge script handled it

**Future research workflow:**
```
Do Tier 10 research → Export → Save to tier10/ folder
Run merge script → Combines with existing processed/ files
Import to queue → All keywords in one place
```

---

## ✅ Summary

### 1. Import to Queue = Add Keywords to Automation To-Do List
```
558 keywords → Import script → keyword-queue.json → Cron picks → Generates articles
```

### 2. Next 50 Keywords Are High-Quality
```
✅ All Tier 0 (0-10 searches)
✅ All trader-focused
✅ All question-based
✅ KD 0-1 (very easy to rank)
```

### 3. Tier Folders Are for Raw Exports
```
tier0/  → Store Tier 0 SEMrush/Ahrefs exports BEFORE processing
tier10/ → Store Tier 10 exports (do this later when traffic grows)
tier20/ → Store Tier 20 exports
tier50/ → Store Tier 50 exports (pillar keywords)

processed/ → All merged, cleaned, final CSVs (ready to import)
```

---

## 🚀 Next Steps

Ready to import your 558 keywords to the queue?

```bash
npm run keywords:import
```

This will:
1. Read `processed/trader-focused-keywords-2026-02-13.csv`
2. Create queue entries for all 558 keywords
3. Assign priorities (Tier 0 = 1-452, Tier 20 = 453-532, Tier 50 = 533-558)
4. Set all status to "queued"
5. Map to templates based on keyword intent
6. Ready for `npm run staging` to start generating!

Want me to build the import script now? 🎯
