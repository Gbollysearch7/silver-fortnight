# Publishing Schedule: 3 Posts Per Day

## 📅 Publishing Windows (UTC)

```
┌──────────────────────────────────────┐
│ 8:00 AM UTC  → Tier 0 Article       │
│ 12:00 PM UTC → Tier 0 Article       │
│ 4:00 PM UTC  → Tier 0/10 Article    │
└──────────────────────────────────────┘
```

**Local Time Conversions:**
- **WAT (Nigeria)**: 9:00 AM, 1:00 PM, 5:00 PM
- **EST (New York)**: 3:00 AM, 7:00 AM, 11:00 AM
- **PST (Los Angeles)**: 12:00 AM, 4:00 AM, 8:00 AM

---

## 🎯 Timeline with 3 Posts/Day

### Month 1: Foundation (90 articles)
```
Week 1: 21 Tier 0 articles
Week 2: 42 Tier 0 articles (total)
Week 3: 63 Tier 0 articles (total)
Week 4: 84 Tier 0 articles (total)

Expected by Day 30:
✅ 90 Tier 0 articles published
✅ 8-12 average daily clicks
✅ Ready to start Tier 10
```

### Month 2: Mixed Growth (90 articles)
```
Week 5-8: Mix of Tier 0 and Tier 10

Daily distribution:
- 8 AM: Tier 0 (0-5 volume)
- 12 PM: Tier 0 (5-10 volume)
- 4 PM: Tier 10 (10-20 volume)

Expected by Day 60:
✅ 180 total articles (120 T0 + 60 T10)
✅ 15-20 average daily clicks
✅ Approaching Tier 20 threshold
```

### Month 3: Authority Building (90 articles)
```
Week 9-12: Mix of Tier 10 and Tier 20

Daily distribution:
- 8 AM: Tier 10 (10-15 volume)
- 12 PM: Tier 10 (15-20 volume)
- 4 PM: Tier 20 (20-50 volume)

Expected by Day 90:
✅ 270 total articles
✅ 25-35 average daily clicks
✅ Solid Tier 20 foundation
```

---

## 📊 Expected Traffic Growth (3 Posts/Day)

| Day | Articles | Tier | Avg Daily Clicks | Status |
|-----|----------|------|------------------|--------|
| **7** | 21 | 0 | 0-2 | Indexing begins |
| **14** | 42 | 0 | 2-4 | Early rankings |
| **21** | 63 | 0 | 4-6 | Momentum builds |
| **30** | 90 | 0 | 8-12 | **Tier 10 ready** |
| **45** | 135 | 10 | 12-16 | Mixed publishing |
| **60** | 180 | 10 | 16-22 | **Tier 20 ready** |
| **75** | 225 | 20 | 22-30 | Authority phase |
| **90** | 270 | 20 | 28-40 | **Tier 50 prep** |

---

## 🔧 Cron Configuration

**File**: `scripts/cron.mjs`

```javascript
const POSTS_PER_DAY = 3;
const PUBLISH_HOURS_UTC = [8, 12, 16]; // 8 AM, 12 PM, 4 PM UTC
```

**How it works:**
1. Cron checks every 5 minutes if current hour matches publish window
2. Picks next keyword from queue (sorted by priority)
3. Runs 4-step pipeline: generate → thumbnail → seo → publish
4. Stops after 3 posts published in a day
5. Resets counter at midnight UTC

---

## 📋 Weekly Monitoring Checklist

### Every Sunday Evening:
```bash
# Check current tier status
npm run tier:blog

# Preview weekly report
npm run report -- --preview

# Check queue status
node scripts/status.mjs
```

**Look for:**
- ✅ Average daily clicks increasing
- ✅ 3 articles published per day (21/week)
- ✅ SEO scores averaging 70+
- ✅ Indexing happening within 7 days

---

## 🎨 Content Mix Strategy

### Phase 1: Days 1-30 (Pure Tier 0)
```
All 3 posts = Tier 0 keywords
Volume: 0-10 searches/month
KD: 0-15%
Word count: 800-1200
```

### Phase 2: Days 31-60 (Mixed T0/T10)
```
Post 1 (8 AM): Tier 0 (0-5 volume)
Post 2 (12 PM): Tier 0 (5-10 volume)
Post 3 (4 PM): Tier 10 (10-20 volume)
```

### Phase 3: Days 61-90 (Mixed T10/T20)
```
Post 1 (8 AM): Tier 10 (10-15 volume)
Post 2 (12 PM): Tier 10 (15-20 volume)
Post 3 (4 PM): Tier 20 (20-50 volume)
```

### Phase 4: Days 91+ (Cluster Building)
```
Monday-Saturday: Supporting pages (Tier 10/20)
Sunday: Cluster page (Tier 20, 2000+ words)

Ratio: 6 supporting → 1 cluster
```

---

## 🚀 Staging Mode Timeline

**Current Status**: In staging mode during blog migration

### Staging Phase (30-60 days)
```
✅ Generate 90-180 articles
✅ Build content buffer
✅ Don't publish to Webflow yet
✅ Status: "staged" in queue

Command: npm run staging
```

### Bulk Publish (After Migration)
```
When migration complete:
1. Run: npm run bulk-publish -- --dry-run
2. Review: Check all staged articles
3. Publish: npm run bulk-publish -- --yes
4. Result: 90-180 articles go live in ~2 hours
```

**Why this works:**
- Migration happens without pressure
- Content quality can be reviewed
- Instant Tier 0 foundation when live
- Google sees active blog from Day 1

---

## ⚠️ Important Notes

### Quality Control with 3/Day
- **SEO threshold**: Keep minimum at 70/100
- **Manual review**: Spot-check 1 article per week (3 total/month)
- **KGR validation**: Verify top 20 keywords have KGR ≤ 0.25
- **Content depth**: Don't sacrifice quality for speed

### Scaling Decision Points

**Scale to 4/day if:**
- ✅ SEO scores averaging 75+
- ✅ Articles indexing in <7 days
- ✅ Rankings hitting top 20 consistently
- ✅ Content quality remains high

**Drop to 2/day if:**
- ❌ SEO scores below 70
- ❌ Indexing taking >14 days
- ❌ Rankings stuck at position 50+
- ❌ Quality concerns

### Google Spam Thresholds
- **Safe zone**: 2-4 posts/day
- **Caution zone**: 5-6 posts/day
- **Risk zone**: 7+ posts/day

**Current 3/day = Safe zone** ✅

---

## 📈 Competitive Advantage

### vs. 2 Posts/Day (Avalanche Method)
```
Day 30:
- 2/day: 60 articles, 5-8 clicks
- 3/day: 90 articles, 8-12 clicks
Advantage: +50% more content, +40% more traffic

Day 60:
- 2/day: 120 articles, 10-15 clicks
- 3/day: 180 articles, 16-22 clicks
Advantage: +50% more content, +50% more traffic

Day 90:
- 2/day: 180 articles, Tier 10
- 3/day: 270 articles, Tier 20
Advantage: ONE TIER AHEAD
```

**Conclusion**: 3/day gets you to **Tier 20 in 90 days** vs. 120-150 days with 2/day.

---

## ✅ Success Metrics

### Week 1-2
- [ ] 42 articles published
- [ ] All articles indexed
- [ ] SEO scores 70+
- [ ] 2-4 daily clicks

### Month 1
- [ ] 90 articles published
- [ ] 8-12 daily clicks
- [ ] Top 20 rankings for 60%+ of keywords
- [ ] Ready to start Tier 10

### Month 2
- [ ] 180 articles total
- [ ] 16-22 daily clicks
- [ ] Mix of Tier 0 and Tier 10
- [ ] Approaching Tier 20

### Month 3
- [ ] 270 articles total
- [ ] 28-40 daily clicks
- [ ] Tier 20 foundation
- [ ] First topic clusters built

---

## 🎯 Next Steps

1. **Complete SEMrush research** (150-200 Tier 0 keywords)
2. **Add keywords to queue** (priority 1-200)
3. **Start staging mode**: `npm run staging`
4. **Monitor weekly**: `npm run tier:blog` every Sunday
5. **When migration complete**: `npm run bulk-publish -- --yes`

**Ready to start your keyword research?** Follow [MULTI-TIER-RESEARCH-STRATEGY.md](MULTI-TIER-RESEARCH-STRATEGY.md) to get those keywords! 🚀
