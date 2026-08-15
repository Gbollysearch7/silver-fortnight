# TY Blog Graph — Operations Runbook

The whole workflow from `TY-BLOG-GRAPH-WORKFLOW.html`, as runnable operations.
Deterministic nodes are scripts; judgment nodes are agent playbooks that use the
prompts in `docs/`. THE WEBSITE/DOCS ARE THE SINGLE SOURCE OF TRUTH for every
TradersYard claim. Never mention retired platform names. No em dashes in content.

## Scheduled nodes (cron or cloud-agent routine)

| Node | Command | Cadence | Output | On failure |
|---|---|---|---|---|
| Truth snapshot + diff (Loop 3) | `node scripts/facts-snapshot.mjs` | Daily 06:00 UTC | `data/facts-snapshots/`, `data/facts-diff-latest.json`; **exit 2 = drift found** | Exit 2 triggers the Truth-patch playbook. Fetch failures are listed in output; docs pages are primary, landing pages best-effort (the /rules accordion only exposes its first section). |
| Monitor + CTR queue (Loop 1) | `node scripts/monitor.mjs` | Weekly Mon 07:00 UTC | `data/gsc-snapshots/`, `data/ctr-tickets.json`, `data/depth-tickets.json`; fills `ctr_after` in the ledger | GSC auth errors: check service account at `data/google-service-account.json`. Guardrails (42d cooldown, data-gated repeats, max 3 attempts) are enforced HERE — downstream nodes trust the queue. |
| Link sweep (Loop 4) | `node scripts/link-sweep.mjs` | Monthly, 1st | `data/link-tickets.json` (orphans, under-linked, pillar in-link gaps) | Read-only; safe to re-run. NOTE: filter out `-xxxxx` dedup-killed slugs before acting (they 404 publicly). |

## Agent playbooks (judgment work — run by Claude with this repo)

### A. CTR rewrite run (Loop 1)
1. Read `data/ctr-tickets.json`. For each ticket, generate a rewrite with `docs/LOOP1-REWRITE-PROMPT.md` (top-impression queries drive the title; attempt #>1 must change ANGLE, not wording).
2. Gate every rewrite through the content reviewer (accuracy vs source of truth, char limits, no clickbait).
3. Write approved set to `data/rewrites-approved.json`, then: `node scripts/apply-rewrite.mjs --dry-run` → review → `node scripts/apply-rewrite.mjs`.
4. The applier does backup → patch (name, post-summary, body h1 sync) → publish → verify → ledger append → Google resubmit. Batch cap 15.

### B. Truth patch run (Loop 3, triggered by exit 2)
1. Read `data/facts-diff-latest.json`. For each removed/changed fact: scan live corpus (listItems bodies) for posts citing it.
2. Produce exact-string patches (state only what the source NOW backs; if a fact vanished, replace with "check the plan-specific terms in the TradersYard docs").
3. Gate patches → apply via updateItem with per-item JSON backups (pattern: `data/caps-fix-backup-*`) → publish → verify zero remaining matches.

### C. Link insertion run (Loop 4)
1. Read `data/link-tickets.json`. Priority: (1) new posts with 0 inbound, (2) pillar in-link gaps (payouts pillar needs most), (3) old orphans.
2. For each target pick 2-4 topically-related live posts; insert natural anchors (target's keyword as anchor, links flow UP supporting→hub→pillar). Never competitor links, never blog.tradersyard.com.
3. Gate → apply with backups → publish → verify.

### D. Publish wave (spine)
Per `memory` playbook: pick gated drafts from `blogs/` → verify facts fresh (≤7d, else re-check docs) → render thumbnails → commit → CDN 200 check → live slug-collision check → `publish.mjs --file <f> --live --no-move` (highest-value post LAST — featured rotation) → verify 200 + body → `index.mjs --file <f>` → update report + tracker. Cadence: 3-5 posts, 2-3×/week.

### E. Depth run (Loop 2)
Read `data/depth-tickets.json` (iteration-capped pages) + monitor pages stuck >20 after 90d. Expand/restructure/merge through the full writer→gates flow. Merges need human approval (they delete/redirect a URL).

## Standing rules
- Human gates: publish waves and any live mutation batch >15 items need explicit approval. Kill switch = pause the scheduler (Railway/routine off), nothing else publishes.
- Every live write: backup first, verify after, receipt with item IDs.
- Prompt changes are versioned; measure reviewer fix-rate per batch (target <10%; batch 1-3 baseline ~33%).
- Rewrite ledger (`data/rewrite-ledger.json`) is append-only; `monitor.mjs` fills `ctr_after` when cooldowns elapse.
