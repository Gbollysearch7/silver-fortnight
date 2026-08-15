/**
 * monitor.mjs — Loop 1 monitor node (GSC → CTR ticket queue)
 *
 * Pulls blog-only GSC data (28-day window), snapshots it, and builds the
 * CTR-rewrite ticket queue with the agreed guardrails enforced via the
 * rewrite ledger:
 *   1. COOLDOWN   — never ticket a page rewritten in the last 42 days
 *   2. DATA-GATED — a repeat rewrite requires measured non-improvement
 *   3. ITERATION  — after 3 attempts with no lift, route to depth loop
 *
 * Usage:
 *   node scripts/monitor.mjs              # snapshot + build ticket queue
 *   node scripts/monitor.mjs --dry-run    # print, write nothing
 *   node scripts/monitor.mjs --limit 10   # max tickets (default 10)
 *
 * Outputs:
 *   data/gsc-snapshots/YYYY-MM-DD.json    # raw per-page + per-page-query data
 *   data/ctr-tickets.json                 # the Loop 1 work queue
 *   data/depth-tickets.json               # pages routed to Loop 2
 *   data/rewrite-ledger.json              # created if missing (append-only)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL, DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printInfo, printSuccess, printWarning } from '../lib/utils.mjs';
import { google } from 'googleapis';

const args = parseArgs(process.argv.slice(2));
const DRY = !!args['dry-run'];
const LIMIT = parseInt(args.limit || '10', 10);
const COOLDOWN_DAYS = 42;           // 6 weeks
const MAX_ATTEMPTS = 3;
const MIN_IMPRESSIONS = 100;        // per 28d, below this the data is noise
const IMPROVEMENT_THRESHOLD = 0.2;  // +20% relative CTR = "improved"

// CTR benchmarks by position band (conservative, informational SERPs)
function benchmark(pos) {
  if (pos <= 5) return 0.04;
  if (pos <= 8) return 0.025;
  if (pos <= 11) return 0.015;
  return 0.01;
}

const auth = new google.auth.GoogleAuth({
  keyFile: GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const sc = google.searchconsole({ version: 'v1', auth });

const blogFilter = {
  dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog-posts/' }] }],
};

async function gscQuery(startDate, endDate, dimensions, extra = {}) {
  const res = await sc.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: { startDate, endDate, dimensions, rowLimit: 25000, dataState: 'final', ...extra },
  });
  return res.data.rows || [];
}

function iso(d) { return d.toISOString().slice(0, 10); }
const end = new Date(Date.now() - 3 * 864e5);          // GSC finalizes ~3 days back
const start = new Date(end.getTime() - 27 * 864e5);    // 28-day window
const [S, E] = [iso(start), iso(end)];

// Strip #fragments and aggregate to the base page
function basePage(url) { return url.split('#')[0]; }

printInfo(`GSC window: ${S} → ${E} (blog only)`);

// ---- 1. Pull data --------------------------------------------------------
const pageRowsRaw = await gscQuery(S, E, ['page'], blogFilter);
const pages = new Map();
for (const r of pageRowsRaw) {
  const p = basePage(r.keys[0]);
  const agg = pages.get(p) || { clicks: 0, impressions: 0, posW: 0 };
  agg.clicks += r.clicks; agg.impressions += r.impressions; agg.posW += r.position * r.impressions;
  pages.set(p, agg);
}
for (const [p, a] of pages) { a.position = a.posW / a.impressions; delete a.posW; a.ctr = a.clicks / a.impressions; }

const queryRows = await gscQuery(S, E, ['page', 'query'], blogFilter);
const topQueries = new Map(); // basePage -> [{query, clicks, impressions, position}]
for (const r of queryRows) {
  const p = basePage(r.keys[0]);
  const list = topQueries.get(p) || [];
  list.push({ query: r.keys[1], clicks: r.clicks, impressions: r.impressions, position: +r.position.toFixed(1) });
  topQueries.set(p, list);
}
for (const list of topQueries.values()) list.sort((a, b) => b.impressions - a.impressions);

// ---- 2. Snapshot ---------------------------------------------------------
const snapDir = resolve(DATA_DIR, 'gsc-snapshots');
if (!DRY) {
  mkdirSync(snapDir, { recursive: true });
  const snapshot = {
    window: { start: S, end: E },
    pages: Object.fromEntries([...pages].map(([p, a]) => [p, { ...a, ctr: +a.ctr.toFixed(4), position: +a.position.toFixed(1) }])),
  };
  writeFileSync(resolve(snapDir, `${E}.json`), JSON.stringify(snapshot, null, 2));
  printSuccess(`Snapshot saved: data/gsc-snapshots/${E}.json (${pages.size} pages)`);
}

// ---- 3. Load / init rewrite ledger --------------------------------------
const ledgerPath = resolve(DATA_DIR, 'rewrite-ledger.json');
let ledger = { _schema: 'page → [{date, attempt, ctr_before, ctr_after (filled at next run ≥42d later), title_after}]', pages: {} };
if (existsSync(ledgerPath)) ledger = JSON.parse(readFileSync(ledgerPath, 'utf-8'));

// Fill in ctr_after for past rewrites whose cooldown has elapsed
const now = Date.now();
let ledgerUpdated = false;
for (const [page, entries] of Object.entries(ledger.pages)) {
  for (const e of entries) {
    if (e.ctr_after == null && (now - new Date(e.date).getTime()) / 864e5 >= COOLDOWN_DAYS) {
      const cur = pages.get(page);
      if (cur) { e.ctr_after = +cur.ctr.toFixed(4); ledgerUpdated = true; }
    }
  }
}
if (ledgerUpdated && !DRY) writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));

// ---- 4. Build ticket queue with guardrails ------------------------------
const tickets = [], depth = [], skipped = { cooldown: 0, improved: 0, capped: 0, noise: 0 };
for (const [page, a] of pages) {
  if (a.position < 4 || a.position > 15) continue;
  if (a.impressions < MIN_IMPRESSIONS) { skipped.noise++; continue; }
  if (a.ctr >= benchmark(a.position)) continue;

  const history = ledger.pages[page] || [];
  const last = history[history.length - 1];

  // Guardrail 1: cooldown
  if (last && (now - new Date(last.date).getTime()) / 864e5 < COOLDOWN_DAYS) { skipped.cooldown++; continue; }
  // Guardrail 3: iteration cap → depth loop
  if (history.length >= MAX_ATTEMPTS) {
    depth.push({ page, reason: `${history.length} rewrites, still ${(a.ctr * 100).toFixed(2)}% CTR at pos ${a.position.toFixed(1)} — title is not the problem`, ...fmt(a) });
    skipped.capped++; continue;
  }
  // Guardrail 2: data-gated repeats — if the last rewrite measurably improved CTR, leave it alone
  if (last && last.ctr_before != null && last.ctr_after != null) {
    const rel = last.ctr_before > 0 ? (last.ctr_after - last.ctr_before) / last.ctr_before : 1;
    if (rel >= IMPROVEMENT_THRESHOLD) { skipped.improved++; continue; }
  }

  tickets.push({
    page,
    attempt: history.length + 1,
    ...fmt(a),
    benchmark_ctr: benchmark(a.position),
    est_monthly_clicks_at_benchmark: Math.round(a.impressions * benchmark(a.position)),
    top_queries: (topQueries.get(page) || []).slice(0, 8),
    prior_rewrites: history.map(h => ({ date: h.date, ctr_before: h.ctr_before, ctr_after: h.ctr_after })),
  });
}
function fmt(a) { return { clicks: a.clicks, impressions: a.impressions, ctr: +(a.ctr * 100).toFixed(2), position: +a.position.toFixed(1) }; }

tickets.sort((a, b) => b.impressions - a.impressions);
const queue = tickets.slice(0, LIMIT);

// ---- 5. Write + report ---------------------------------------------------
if (!DRY) {
  writeFileSync(resolve(DATA_DIR, 'ctr-tickets.json'), JSON.stringify({ generated: E, window: { start: S, end: E }, guardrails: { cooldown_days: COOLDOWN_DAYS, max_attempts: MAX_ATTEMPTS, improvement_threshold: IMPROVEMENT_THRESHOLD }, tickets: queue, overflow: tickets.length - queue.length }, null, 2));
  writeFileSync(resolve(DATA_DIR, 'depth-tickets.json'), JSON.stringify({ generated: E, tickets: depth }, null, 2));
}

printInfo(`Qualifying pages: ${tickets.length + skipped.cooldown + skipped.improved + skipped.capped} | ticketed: ${queue.length} (limit ${LIMIT}, overflow ${Math.max(0, tickets.length - queue.length)})`);
printInfo(`Guardrail skips — cooldown: ${skipped.cooldown} · improved (leave alone): ${skipped.improved} · iteration-capped → depth: ${skipped.capped}`);
if (depth.length) printWarning(`Depth loop tickets: ${depth.length} (data/depth-tickets.json)`);
console.log('');
for (const t of queue) {
  console.log(`  [#${t.attempt}] ${t.impressions} impr | pos ${t.position} | CTR ${t.ctr}% (bench ${(t.benchmark_ctr * 100).toFixed(1)}%) | ~${t.est_monthly_clicks_at_benchmark} clicks/28d at bench | ${t.page.replace('https://tradersyard.com/blog-posts/', '')}`);
}
printSuccess(DRY ? 'Dry run — nothing written.' : 'Ticket queue written: data/ctr-tickets.json');
