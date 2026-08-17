# TY Blog Graph — Scheduled Routine Prompts

> **DEPLOYED LOCALLY 17 Aug 2026** via macOS crontab + `scripts/run-routine.sh`
> (headless `claude -p` against this working tree; secrets from local `.env`;
> git push authenticated). Schedule (Europe/London local): truth-check daily
> 07:03 · CTR rewrites Mon 08:07 · production Tue+Thu 08:11 (STAGES only,
> publishes on human "go") · link sweep 1st 09:07 · depth run 15th 09:11.
> Caveat: the Mac must be awake at fire time; missed fires are skipped.
> Manage: `crontab -l` / `crontab -e`. Kill switch: `crontab -r` (removes all)
> or delete a line. Logs: `logs/routines/`. Cloud routines remain the upgrade
> path once the Claude GitHub App is installed (creation currently 401s).

Five routines that run the whole system. Each prompt is self-contained: paste it as
the task when creating a scheduled cloud agent (via `/schedule` in Claude Code or the
routines UI on claude.ai/code), attach this GitHub repo, and set the cron shown.

**Modes:** Production (new posts) is SEMI-AUTO — it stages and waits for your "go".
Truth patches, CTR rewrites, and link inserts are AUTO — they are gated, backed up,
reversible, and capped; flip any of them to semi-auto by changing one line in its prompt.
**Kill switch:** pause the routine(s). Nothing else touches the site.

---

## SHARED PREAMBLE (include at the top of every routine prompt)

```
You are operating the TradersYard blog automation graph in this repo.
Before anything else, read runbooks/graph-workflow.md (the operating manual)
and docs/BLOG-WRITER-BRIEF.md (writing contract + verified facts).

Standing rules that override everything:
- tradersyard.com + docs.tradersyard.com are the ONLY source of truth for
  TradersYard claims. Never state a TY figure the docs do not currently back.
- Never mention AgenaTrader, anywhere, in any form.
- No em dashes in any content. No competitor prop firm names in content.
- Every live write: backup first, verify after, save receipts with item IDs.
- Fail loudly: if a gate fails or data is missing, STOP and report. Never
  improvise around a failed step, never publish partial work.
- Stay within scope caps stated below. When done, write a short run report
  to runbooks/routine-runs.md (append: date, routine, actions, receipts).
- STATE PERSISTENCE (critical): you run in an ephemeral clone. At the end of
  every run, `git add` and commit + push every state file you changed —
  data/rewrite-ledger.json, data/*-tickets.json, receipts, blogs/ frontmatter,
  output/thumbnails-html/*.jpg, runbooks/routine-runs.md — with a message like
  "routine: <name> <date>". If you cannot push, say so LOUDLY in your report:
  unpushed state means the next run's guardrails are blind.
- SECRETS: publishing needs WEBFLOW_API_KEY, indexing needs the Google service
  account (GOOGLE_SERVICE_ACCOUNT_PATH or GOOGLE_SERVICE_ACCOUNT_JSON), truth
  loop landing pages need FIRECRAWL_API_KEY — all from the environment, never
  from the repo. If a needed secret is missing, STOP that step and report it;
  do not work around it.
```

---

## 1 · daily-truth-check — cron `0 6 * * *` (daily 06:00 UTC) — AUTO

```
[SHARED PREAMBLE]

TASK: Truth loop (Loop 3).
1. Run: node scripts/facts-snapshot.mjs
2. Exit 0 → append "no drift" to the run report. Done.
3. Exit 2 → read data/facts-diff-latest.json. For each changed/removed fact:
   scan live post bodies (lib/webflow.mjs listItems) for posts citing it.
   Produce exact-string patches per playbook B in runbooks/graph-workflow.md:
   state only what the source NOW backs; if a fact vanished, replace with
   "check the plan-specific terms in the TradersYard docs".
4. Gate the patches with a content-review pass (accuracy only), then apply:
   per-item JSON backup to data/truth-backups/<date>/ → updateItem →
   publishItems → verify zero remaining matches.
5. Cap: 20 patched posts per run. More than 20 → patch the 20 highest-traffic,
   list the rest in the report, and flag for the next run.
6. Report what changed at the source and every post touched, with item IDs.
```

## 2 · weekly-ctr-rewrites — cron `0 7 * * 1` (Mondays 07:00 UTC) — AUTO

```
[SHARED PREAMBLE]

TASK: CTR rewrite loop (Loop 1).
1. Run: node scripts/monitor.mjs   (this snapshots GSC, fills ctr_after in
   data/rewrite-ledger.json, and builds data/ctr-tickets.json with the
   guardrails already enforced: 42-day cooldown, data-gated repeats, max 3
   attempts then depth routing).
2. No tickets → report "queue empty" plus any ledger ctr_after updates
   (these are the results of past rewrites — always include a before/after
   table in the report when new ctr_after values appear). Done.
3. Tickets → for each (max 10), write a rewrite using docs/LOOP1-REWRITE-PROMPT.md.
   Titles must mirror the top-impression queries in the ticket. Attempt #2+
   must change ANGLE, not wording.
4. Gate all rewrites with a content-review pass (recount every char limit;
   verify every promise against the live page; no clickbait, no new claims).
5. Write the approved set to data/rewrites-approved.json, then:
   node scripts/apply-rewrite.mjs --dry-run   (review output)
   node scripts/apply-rewrite.mjs             (backup/patch/publish/verify/
                                               ledger/reindex is automatic)
6. Report: each page, old → new title, and the CTR baseline it must beat.
```

## 3 · production-run — cron `0 7 * * 2,4` (Tue + Thu 07:00 UTC) — SEMI-AUTO

```
[SHARED PREAMBLE]

TASK: Write and stage new posts (the spine). PUBLISHING WAITS FOR HUMAN "GO".

PHASE 1 — write and stage (do this now):
1. Pick the next 3 unwritten keywords: first any gated drafts already in
   blogs/ without webflow_item_id, else the next safest entries in
   data/planned-keywords.json (Wave order; skip navigational/competitor-brand
   keywords and anything wrong-audience per docs/BLOG-WRITER-BRIEF.md).
2. Dedup EVERY candidate against the live collection (fuzzy title + slug
   scan via listItems) — skip and log anything that collides.
3. Re-verify the TY facts you will cite against docs.tradersyard.com TODAY
   (fetch the relevant docs .md pages; the brief's facts section lists them).
4. Write each post per docs/BLOG-WRITER-BRIEF.md (v2 rules: the five
   failure modes, SERP context, meta_title <60 incl " | TY").
5. Gate: mechanical sweep (dashes, brands, char limits, live link targets,
   schema) then an adversarial content review per post. Apply fixes.
6. Run node scripts/seo-check.mjs --file on each (must be ≥85).
7. Render thumbnails (scripts/render-thumbnail.mjs), commit + push the jpgs,
   set frontmatter featured_image.url to the jsDelivr URL, verify HTTP 200
   (purge via purge.jsdelivr.net if 404).
8. STOP. Send me the batch report: per post — keyword, volume/KD, score,
   review verdict, live-slug check result. Then wait.

PHASE 2 — only after I reply "go" (or "go <slugs>") in this session:
9. Publish each approved post: node scripts/publish.mjs --file blogs/<slug>.md
   --live --no-move (highest-volume post LAST — featured rotation), verify
   HTTP 200 + body, then node scripts/index.mjs --file blogs/<slug>.md.
10. Apply any pending internal-link inserts whose targets just went live
    (build a plan, validate with scripts/apply-links.mjs --dry-run, apply).
11. Report receipts: URLs, item IDs, index confirmations.
Cap: 4 posts per run. If the keyword pool is exhausted or every candidate
fails dedup, report that instead of forcing weak topics.
```

## 4 · monthly-link-sweep — cron `0 8 1 * *` (1st of month 08:00 UTC) — AUTO

```
[SHARED PREAMBLE]

TASK: Link graph maintenance (Loop 4).
1. Run: node scripts/link-sweep.mjs → read data/link-tickets.json.
2. Build a link plan (max 15 hosts): priorities are (a) live posts with 0
   inbound links, (b) pillar in-link gaps (targets: pillars 15-30+), then
   (c) oldest orphans. EXCLUDE slugs matching -[a-z0-9]{5}$ (dedup-killed
   duplicates) and anything in data/unpublished-keepout.json.
3. Anchors = the target page's keyword. Links flow UP (supporting → hub →
   pillar) or hub → cluster member. Never competitor links, never
   blog.tradersyard.com.
4. Validate: node scripts/apply-links.mjs --plan <plan> --dry-run
   Apply:    node scripts/apply-links.mjs --plan <plan>
   (backups, publish, verification are automatic).
5. Report: hosts touched, links added, updated pillar in-link counts.
```

## 5 · monthly-depth-run — cron `0 8 15 * *` (15th of month 08:00 UTC) — SEMI-AUTO

```
[SHARED PREAMBLE]

TASK: Depth loop (Loop 2). STAGING ONLY — live changes wait for my "go".
1. Read data/depth-tickets.json (iteration-capped pages from the monitor)
   plus data/gsc-snapshots/ history: pages stuck at position >20 for 90+
   days with ≥50 impressions/28d.
2. Pick the 2-3 highest-impression cases. Diagnose each: thin content,
   intent mismatch, or cannibalization with a sibling (check the live
   corpus for competing pages on the same queries).
3. For thin/mismatch: rewrite or expand the page through the full writer +
   gate flow (brief rules apply; facts re-verified against docs same day).
   For cannibalization: prepare a merge proposal (which URL wins, what
   moves, what redirects) — NEVER execute a merge without approval.
4. Known standing tickets to consider first: the which-prop-firm-gives-
   real-account page promises a "slippage test" section that does not exist
   in the body; the two options pages (which-prop-firms-allow-options-trading
   and options-trading-prop-firms) overlap in body content.
5. STOP and send me the staged work + proposals. Publish only after "go".
```

---

## After scheduling
- First runs to watch: give routine 2 two Mondays and routine 3 two cycles
  before considering flipping production to full-auto.
- The ~26 Sep monitor run scores the first 10 rewrites (ledger before/after).
- Keyword supply: ~8 gated drafts remain, then Wave 1's remaining safe pool;
  when routine 3 reports the pool is thin, that's the trigger to decide on
  Wave 2 (competitor-review strategy) with a human.
```
