/**
 * facts-snapshot.mjs — Loop 3 truth node (source-of-truth snapshot + diff)
 *
 * THE WEBSITE IS THE SINGLE SOURCE OF TRUTH (user directive, 10 Aug 2026).
 * This script snapshots it daily and diffs against the previous snapshot so
 * truth drift becomes a same-day patch queue instead of a stale-fact incident
 * (see: the futures payout caps, removed from docs unnoticed for ~3 weeks).
 *
 * Sources:
 *   - docs.tradersyard.com/*.md         → plain fetch (GitBook serves markdown)
 *   - tradersyard.com landing pages     → Firecrawl (JS-rendered, plain fetch fails)
 *
 * Usage:
 *   node scripts/facts-snapshot.mjs            # snapshot + diff vs previous
 *   node scripts/facts-snapshot.mjs --no-diff  # snapshot only (first run / baseline)
 *
 * Outputs:
 *   data/facts-snapshots/YYYY-MM-DD/<name>.md
 *   data/facts-diff-latest.json   (changed/removed/added lines per source)
 *   Exit code 2 when a diff is found — so cron/agents can trigger the patch flow.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printInfo, printSuccess, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs(process.argv.slice(2));
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || '';

// --- sources ---------------------------------------------------------------
const DOC_PAGES = [
  'https://docs.tradersyard.com/traderchallenge/rules.md',
  'https://docs.tradersyard.com/traderchallenge/faqs.md',
  'https://docs.tradersyard.com/traderchallenge/payout-requests.md',
  'https://docs.tradersyard.com/traderchallenge/account-scaling.md',
  'https://docs.tradersyard.com/traderchallenge/account-reset.md',
  'https://docs.tradersyard.com/traderchallenge/available-futures.md',
  'https://docs.tradersyard.com/traderchallenge/welcome-to-the-yard.md',
  'https://docs.tradersyard.com/traderchallenge/build-your-yard-configurator.md',
  'https://docs.tradersyard.com/tournament/overview.md',
  'https://docs.tradersyard.com/tournament-rules.md',
];
const LANDING_PAGES = [
  'https://tradersyard.com/rules',
  'https://tradersyard.com/',
];

function nameFor(url) {
  return url.replace(/^https?:\/\//, '').replace(/\.md$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '.md';
}

async function fetchDoc(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'TY-facts-snapshot/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function fetchLanding(url) {
  if (!FIRECRAWL_KEY) throw new Error('FIRECRAWL_API_KEY not set');
  const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${FIRECRAWL_KEY}` },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 8000 }),
  });
  if (!res.ok) throw new Error(`Firecrawl HTTP ${res.status}`);
  const j = await res.json();
  const md = j?.data?.markdown;
  if (!md) throw new Error('Firecrawl returned no markdown');
  return md;
}

// Normalize before diffing: kill volatile noise (whitespace, tracking params)
function normalize(text) {
  return text
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0 && !/^!\[/.test(l))          // drop images
    .map(l => l.replace(/\?utm[^)\s]*/g, ''));
}

// --- 1. snapshot -----------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const root = resolve(DATA_DIR, 'facts-snapshots');
const dir = resolve(root, today);
mkdirSync(dir, { recursive: true });

const results = [];
for (const url of DOC_PAGES) {
  try {
    const text = await fetchDoc(url);
    writeFileSync(resolve(dir, nameFor(url)), text);
    results.push({ url, ok: true, kind: 'docs' });
  } catch (e) { results.push({ url, ok: false, kind: 'docs', error: e.message }); }
}
for (const url of LANDING_PAGES) {
  try {
    const text = await fetchLanding(url);
    writeFileSync(resolve(dir, nameFor(url)), text);
    results.push({ url, ok: true, kind: 'landing (firecrawl)' });
  } catch (e) { results.push({ url, ok: false, kind: 'landing (firecrawl)', error: e.message }); }
}
const okCount = results.filter(r => r.ok).length;
printSuccess(`Snapshot ${today}: ${okCount}/${results.length} sources captured → data/facts-snapshots/${today}/`);
for (const r of results.filter(r => !r.ok)) printWarning(`  FAILED ${r.kind}: ${r.url} (${r.error})`);

// --- 2. diff vs previous snapshot -----------------------------------------
if (args['no-diff']) { printInfo('Diff skipped (--no-diff).'); process.exit(0); }

const prevDirs = readdirSync(root).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d < today).sort();
if (!prevDirs.length) { printInfo('No previous snapshot — baseline created. Diffs start tomorrow.'); process.exit(0); }
const prev = resolve(root, prevDirs[prevDirs.length - 1]);
printInfo(`Diffing against ${prevDirs[prevDirs.length - 1]}...`);

const diffs = [];
for (const r of results.filter(r => r.ok)) {
  const fname = nameFor(r.url);
  const prevPath = resolve(prev, fname);
  if (!existsSync(prevPath)) { diffs.push({ url: r.url, change: 'NEW SOURCE', added: [], removed: [] }); continue; }
  const oldLines = new Set(normalize(readFileSync(prevPath, 'utf-8')));
  const newLines = new Set(normalize(readFileSync(resolve(dir, fname), 'utf-8')));
  const added = [...newLines].filter(l => !oldLines.has(l));
  const removed = [...oldLines].filter(l => !newLines.has(l));
  if (added.length || removed.length) diffs.push({ url: r.url, change: 'MODIFIED', added, removed });
}

const report = { date: today, baseline: prevDirs[prevDirs.length - 1], sources_checked: okCount, changes: diffs };
writeFileSync(resolve(DATA_DIR, 'facts-diff-latest.json'), JSON.stringify(report, null, 2));

if (!diffs.length) {
  printSuccess('No changes — source of truth is stable. Content stays valid.');
  process.exit(0);
}

printWarning(`${diffs.length} source(s) CHANGED — review data/facts-diff-latest.json`);
for (const d of diffs) {
  console.log(`\n  ${d.change}: ${d.url}`);
  for (const l of d.removed.slice(0, 6)) console.log(`    - ${l.slice(0, 110)}`);
  for (const l of d.added.slice(0, 6)) console.log(`    + ${l.slice(0, 110)}`);
  const more = Math.max(0, d.removed.length - 6) + Math.max(0, d.added.length - 6);
  if (more) console.log(`    ... +${more} more lines in the report`);
}
console.log('\nNEXT STEP (truth loop): scan the live corpus for posts citing the changed facts,');
console.log('produce exact-string patches, and route them through the content gate before pushing.');
process.exit(2); // non-zero so schedulers/agents can trigger the patch flow
