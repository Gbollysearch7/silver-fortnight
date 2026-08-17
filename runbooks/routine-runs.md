# TY Blog Graph — Routine Run Log

Append-only. One entry per scheduled routine run: date, routine, actions, receipts, failures.

---

## 2026-08-17 — daily-truth-check

**Actions:**
1. Ran `node scripts/facts-snapshot.mjs`. Result: 12/12 sources captured → `data/facts-snapshots/2026-08-17/`. Exit code **2** (drift found vs 2026-08-15 baseline).
2. Read `data/facts-diff-latest.json`. One source changed: `https://tradersyard.com/` (homepage pricing block). The struck-through "was" price on each account-size card dropped while the coupon-applied sale price stayed identical:

   | Account | Was (old) | Was (new) | Sale price (unchanged) |
   |---|---|---|---|
   | $100K | $5,612 | $2,822 | $509 |
   | $50K | $3,216 | $1,644 | $269 |
   | $25K | $2,071 | $1,076 | $159 |
   | $10K | $1,404 | $742 | $99 |
   | $5K | $760 | $407 | $49 |

   This is a promo/list-price anchor change under the same `WELCOME30` coupon — the actual purchase prices traders pay ($509/$269/$159/$99/$49) did not move.
3. Scanned the live corpus per playbook B: fetched all 249 items via `lib/webflow.mjs listItems`, searched `post-body` (and name/summary) for every removed figure in digit and comma-formatted form (5612/5,612, 3216/3,216, 2071/2,071, 1404/1,404, 760).
   - 1 raw substring hit: "3216" inside `drawdown-calculation-formula-for-prop-firm-challenges` (item `69c3cef40c3bd9887e51cd75`) — verified by reading surrounding context: it's part of a CDN image filename hash (`...ac323216_...`), not a price citation. Not a real match.
   - 0 posts cite any of the removed "was" prices as a fact.
4. No patches produced (nothing to gate or apply). No live writes made, no backups needed.

**Receipts:** `data/facts-snapshots/2026-08-17/` (raw snapshot), `data/facts-diff-latest.json` (diff record).

**Posts touched:** none.

**Failures:** none. Drift was real (source changed) but had zero blast radius on published content — routine correctly stopped short of any live write since nothing needed patching.
