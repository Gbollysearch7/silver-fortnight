# Keyword Research Folder Structure

This folder contains all keyword research exports from SEMrush/Ahrefs organized by tier.

## 📁 Folder Organization

```
data/keyword-research/
├── README.md                    # This file
│
├── tier0/                       # Tier 0 exports (0-10 searches/month)
│   ├── semrush-tier0-YYYY-MM-DD.csv
│   ├── ahrefs-tier0-YYYY-MM-DD.csv
│   └── ...
│
├── tier10/                      # Tier 10 exports (10-20 searches/month)
│   ├── semrush-tier10-YYYY-MM-DD.csv
│   ├── ahrefs-tier10-YYYY-MM-DD.csv
│   └── ...
│
├── tier20/                      # Tier 20 exports (20-50 searches/month)
│   ├── semrush-tier20-YYYY-MM-DD.csv
│   ├── ahrefs-tier20-YYYY-MM-DD.csv
│   └── ...
│
├── tier50/                      # Tier 50 exports (50-100 searches/month)
│   ├── semrush-tier50-YYYY-MM-DD.csv
│   ├── ahrefs-tier50-YYYY-MM-DD.csv
│   └── ...
│
└── processed/                   # Merged & cleaned exports
    ├── all-tiers-merged.csv     # All tiers combined
    ├── all-tiers-deduplicated.csv  # After removing duplicates
    ├── kgr-validated.csv        # After KGR validation
    └── final-500-keywords.csv   # Final list for queue import
```

---

## 📋 Naming Convention

When you export from SEMrush/Ahrefs, save files using this format:

```
{tool}-tier{X}-{YYYY-MM-DD}.csv

Examples:
- semrush-tier0-2026-02-12.csv
- ahrefs-tier10-2026-02-12.csv
- semrush-tier20-2026-02-13.csv
```

**Why this format?**
- Easy to identify source tool
- Clear tier classification
- Date-stamped for version control
- Sorts chronologically in file browser

---

## 🎯 Workflow

### Step 1: Export from SEMrush/Ahrefs
1. Run Tier 0 research
2. Export CSV
3. Save to: `data/keyword-research/tier0/semrush-tier0-2026-02-12.csv`

### Step 2: Repeat for All Tiers
1. Tier 10 → Save to `tier10/`
2. Tier 20 → Save to `tier20/`
3. Tier 50 → Save to `tier50/`

### Step 3: Process & Merge
Run the merge script (I'll build this):
```bash
npm run keywords:merge
```

This will:
- Combine all tier CSVs
- Remove duplicates
- Validate KGR (optional)
- Save to `processed/all-tiers-merged.csv`

### Step 4: Import to Queue
Run the import script:
```bash
npm run keywords:import
```

This will:
- Read `processed/final-500-keywords.csv`
- Add to `data/keyword-queue.json`
- Assign priorities by tier
- Ready for staging mode!

---

## 📊 Expected File Sizes

| Tier | Keywords | File Size (CSV) |
|------|----------|-----------------|
| Tier 0 | 150-200 | ~50-80 KB |
| Tier 10 | 150-200 | ~50-80 KB |
| Tier 20 | 100-150 | ~30-50 KB |
| Tier 50 | 50-100 | ~20-40 KB |
| **Merged** | 450-650 | ~150-250 KB |
| **Final 500** | 500 | ~160-200 KB |

---

## ✅ Current Status

- [ ] Tier 0 export (0-10 searches)
- [ ] Tier 10 export (10-20 searches)
- [ ] Tier 20 export (20-50 searches)
- [ ] Tier 50 export (50-100 searches)
- [ ] Merge all tiers
- [ ] Remove duplicates
- [ ] KGR validation
- [ ] Import to keyword queue

---

## 🛠️ Scripts Available

### Merge CSVs
```bash
npm run keywords:merge
```

### Import to Queue
```bash
npm run keywords:import
```

### Validate KGR
```bash
npm run keywords:kgr-check
```

### Clean/Reset
```bash
npm run keywords:clean
```

---

## 📝 Notes

- **Keep raw exports**: Never delete files in tier0/, tier10/, tier20/, tier50/
- **Version control**: Date-stamped files allow you to compare exports over time
- **Backup**: Git will track these CSVs automatically
- **Tools**: You can mix SEMrush + Ahrefs exports - merge script handles both

---

## 🚀 Quick Start

**Just exported your first CSV?**

1. Save it to the correct tier folder (e.g., `tier0/`)
2. Use the naming convention: `semrush-tier0-2026-02-12.csv`
3. Tell me when all 4 tiers are exported
4. I'll build the merge + import scripts for you

That's it! 🎯
