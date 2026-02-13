# Keyword Research Results

## 📊 Summary (2026-02-13)

### Raw Data
- **Total CSV files processed:** 7
- **Total rows in CSVs:** 849
- **Branded keywords removed:** 30
- **Invalid rows skipped:** 25
- **Valid keywords extracted:** 794

### After Cleanup
- **Duplicates removed:** 215
- **Unique keywords:** 579

---

## 🎯 Tier Distribution

| Tier | Volume Range | Keywords | Status |
|------|--------------|----------|--------|
| **Tier 0** | 0-10 searches/month | **466** | ✅ Excellent! |
| **Tier 10** | 11-20 searches/month | **0** | ⚠️ Need more research |
| **Tier 20** | 21-50 searches/month | **85** | ✅ Good |
| **Tier 50** | 51-100 searches/month | **28** | ✅ Good |
| **TOTAL** | - | **579** | ✅ |

---

## ✅ What Worked

1. **Brand Exclusion:** Successfully filtered out 30 branded keywords (FTMO, The5ers, Breakout, etc.)
2. **Duplicate Removal:** Removed 215 duplicate keywords (37% reduction)
3. **Tier 0 Gold Mine:** 466 Tier 0 keywords is EXCELLENT (target was 150-200!)
4. **Data Quality:** Clean CSV export with normalized headers

---

## ⚠️ What's Missing

### Tier 10 Keywords (0 found)

**Why:** Your SEMrush exports focused on Tier 0 (0-10) and some higher tiers, but skipped the 11-20 range.

**Solution:**
- Option 1: Go back to SEMrush and do a Tier 10 research round (Volume: 10-20)
- Option 2: Use the 466 Tier 0 keywords and expand later when traffic grows

---

## 🎯 Recommended Action Plan

### Option A: Use What You Have (Recommended)

```
✅ Start with 466 Tier 0 keywords
✅ Use 85 Tier 20 keywords as cluster content
✅ Use 28 Tier 50 keywords as pillar content
✅ Total: 579 keywords (more than enough!)
✅ Do Tier 10 research later (when you hit 10 daily clicks)
```

**Timeline with 3 posts/day:**
- **Days 1-155:** Publish all 466 Tier 0 articles
- **Days 156-185:** Publish 85 Tier 20 cluster articles
- **Days 186-195:** Publish 28 Tier 50 pillar articles
- **Day 195+:** You're at Tier 20-50 already, do Tier 10 research then

### Option B: Do Tier 10 Research Now

```
Go back to SEMrush/Ahrefs:
- Filter: Volume 10-20
- Target: 100-150 Tier 10 keywords
- Time: 15-20 minutes
- Then merge again
```

---

## 📁 Exported Files

Location: `data/keyword-research/processed/`

```
✅ all-keywords-2026-02-13.csv       (579 keywords, all tiers)
✅ tier0-keywords-2026-02-13.csv     (466 keywords)
✅ tier20-keywords-2026-02-13.csv    (85 keywords)
✅ tier50-keywords-2026-02-13.csv    (28 keywords)
```

---

## 🔍 Sample Keywords by Tier

### Tier 0 Examples (0-10 searches):
```
✅ "is alpha trader a good prop firm"
✅ "are there prop firms for crypto"
✅ "what is a consistency rule in prop firms"
✅ "how to pass forex prop firm challenge"
✅ "how many people fail prop firm challenges"
✅ "can you swing trade on prop firms"
✅ "are futures prop firms recommended"
```

**Quality:** Excellent! All are:
- Question-based (high engagement)
- Generic (no brands)
- Informational intent (perfect for Tier 0)
- Easy to rank (KD 0-1)

### Tier 20 Examples (21-50 searches):
```
✅ "best prop firms for day traders"
✅ "prop firm comparison"
✅ "funded trading account"
✅ "how to get funded as a trader"
```

**Quality:** Good cluster content keywords.

### Tier 50 Examples (51-100 searches):
```
✅ "best prop firms"
✅ "prop firm challenge"
✅ "funded trader"
```

**Quality:** Perfect pillar content keywords.

---

## 🚀 Next Steps

### Step 1: Add Claude's Pre-Researched Keywords (Optional)

I have 35 additional Tier 0 keywords pre-researched. Want to add them?

```bash
# Move them to tier0/claude-research/ folder
# Then run merge again
npm run keywords:merge
```

### Step 2: Import to Queue

```bash
npm run keywords:import
```

This will:
- Read all processed CSVs
- Add keywords to `data/keyword-queue.json`
- Assign priorities (Tier 0 = highest priority)
- Set status to "queued"
- Ready for staging mode!

### Step 3: Start Staging Mode

```bash
npm run staging
```

This will:
- Generate content from queue (3 posts/day)
- Create thumbnails
- Run SEO checks
- Save as "staged" (not published yet)
- Build content buffer for migration

---

## 📈 Expected Publishing Timeline (3 posts/day)

### Phase 1: Tier 0 Foundation (155 days)
```
Day 1-30:   90 Tier 0 articles
Day 31-60:  180 Tier 0 articles
Day 61-90:  270 Tier 0 articles
Day 91-120: 360 Tier 0 articles
Day 121-155: 466 Tier 0 articles ✅ COMPLETE
```

**Expected traffic by Day 155:** 20-30 daily clicks (Tier 20 threshold!)

### Phase 2: Tier 20 Clusters (28 days)
```
Day 156-185: 85 Tier 20 articles
```

**Expected traffic by Day 185:** 40-60 daily clicks (Tier 50 approaching!)

### Phase 3: Tier 50 Pillars (9 days)
```
Day 186-195: 28 Tier 50 articles
```

**Expected traffic by Day 195:** 60-100 daily clicks (Tier 50+!)

### Total Timeline: 195 days (6.5 months)

**Result:** From 0 to Tier 50+ in 6.5 months with 579 articles! 🚀

---

## 💡 Pro Tips

### Tip 1: Prioritize Question Keywords
Your Tier 0 list has tons of question keywords ("how to", "what is", "can you", "are there"). These are GOLD because:
- Featured snippet opportunities
- High engagement
- Clear search intent
- Easy to write FAQ-style content

### Tip 2: Group by Topic for Internal Linking
As you publish, group similar keywords:
- Consistency rules (5-10 articles) → link to each other
- Prop firm challenges (20-30 articles) → link to each other
- Payouts/profit splits (10-15 articles) → link to each other

### Tip 3: Use Tier 50 as Pillar Pages
Your 28 Tier 50 keywords are perfect pillar pages. Publish these LAST (after all supporting content is live) so you can link from 500+ supporting pages!

### Tip 4: Track in SEMrush Position Tracking
You have SEMrush Starter plan with 500 keyword tracking. Use the top 500 keywords from this list to track rankings weekly!

---

## ✅ Success Metrics

You've succeeded when:

- [x] 579 unique keywords extracted
- [x] All branded keywords removed
- [x] All duplicates removed
- [x] Keywords organized by tier
- [ ] Keywords imported to queue
- [ ] Staging mode started
- [ ] First 90 articles generated

---

## 🎯 My Recommendation

**START WITH WHAT YOU HAVE!**

You have 466 Tier 0 keywords - that's **3X more than the target** (150-200). You're in an amazing position!

**Action Plan:**
1. ✅ Run `npm run keywords:import` to add all 579 keywords to queue
2. ✅ Start staging mode: `npm run staging`
3. ✅ Let it generate 90 articles (30 days worth)
4. ✅ Review quality of first 10 articles
5. ✅ If good → bulk publish after migration
6. ✅ Do Tier 10 research later (when traffic hits 10 daily clicks)

**Don't overthink it - you're ready to go!** 🚀
