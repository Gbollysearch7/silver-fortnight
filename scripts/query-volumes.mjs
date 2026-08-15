#!/usr/bin/env node
/**
 * Attach real monthly search volume (SE Ranking) to the queries you already rank for (GSC).
 * Output: data/query-volumes.json + a ranked console table of "double-down" avalanches.
 *
 * Logic:
 *   - Pull every distinct query from the live page+query GSC pull (re-run gsc-analysis.mjs first if stale)
 *   - Get volume/difficulty/cpc for each from SE Ranking
 *   - Merge: volume × position × impressions → flag the keywords worth doubling down on
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { getKeywordMetrics } from '../lib/seranking.mjs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';

const SOURCE = process.argv.find(a => a.startsWith('--source='))?.split('=')[1] || 'us';
const DAYS = 90;
const fmt = (d) => d.toISOString().slice(0, 10);
const endDate = fmt(new Date(Date.now() - 2 * 864e5));
const startDate = fmt(new Date(Date.now() - (DAYS + 2) * 864e5));

// --- 1. Pull queries from GSC (page+query, blog only), aggregate by query ---
const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf-8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const siteUrl = GSC_SITE_URL || 'sc-domain:tradersyard.com';

console.log(`Pulling GSC queries  ${startDate} → ${endDate}...`);
const res = await sc.searchanalytics.query({
  siteUrl,
  requestBody: { startDate, endDate, dimensions: ['query', 'page'], rowLimit: 25000 },
});
const rows = (res.data.rows || []).filter(r => /\/blog-posts\/|\/blog\//.test(r.keys[1]));

// Aggregate to one row per query: best position, total impressions, the page ranking best
const byQuery = {};
for (const r of rows) {
  const q = r.keys[0], page = r.keys[1];
  const e = (byQuery[q] ||= { query: q, impressions: 0, clicks: 0, bestPos: 999, bestPage: page });
  e.impressions += Math.round(r.impressions);
  e.clicks += Math.round(r.clicks);
  if (r.position < e.bestPos) { e.bestPos = +r.position.toFixed(1); e.bestPage = page; }
}
const queries = Object.values(byQuery).filter(q => q.impressions >= 20);
console.log(`Distinct ranking queries (≥20 impr/90d): ${queries.length}`);

// --- 2. Pull volumes from SE Ranking ---
console.log(`Fetching SE Ranking volumes (source=${SOURCE})...`);
const terms = queries.map(q => q.query);
let metrics = [];
try {
  metrics = await getKeywordMetrics(terms, { source: SOURCE });
} catch (e) {
  console.error('SE Ranking error:', e.message);
  process.exit(1);
}
const volMap = {};
for (const m of metrics) {
  const key = (m.keyword || m.query || '').toLowerCase().trim();
  if (key) volMap[key] = { volume: m.volume ?? m.search_volume ?? null, difficulty: m.difficulty ?? m.competition ?? null, cpc: m.cpc ?? null };
}

// --- 3. Merge + score ---
const merged = queries.map(q => {
  const v = volMap[q.query.toLowerCase().trim()] || {};
  return {
    query: q.query,
    volume: v.volume ?? null,
    difficulty: v.difficulty ?? null,
    cpc: v.cpc ?? null,
    position: q.bestPos,
    impressions: q.impressions,
    clicks: q.clicks,
    page: q.bestPage.split('/').pop(),
  };
});

// "Double down" = real volume AND already within reach (pos <= 20)
const withVol = merged.filter(m => m.volume != null && m.volume > 0);
const doubleDown = withVol
  .filter(m => m.position <= 20)
  .sort((a, b) => b.volume - a.volume);

writeFileSync(resolve(DATA_DIR, 'query-volumes.json'), JSON.stringify({ meta: { source: SOURCE, startDate, endDate }, all: merged, doubleDown }, null, 2));

// --- 4. Console table ---
const band = (v) => v >= 5000 ? 'HEAD' : v >= 1500 ? 'BIG' : v >= 250 ? 'SWEET' : v >= 50 ? 'SMALL' : 'TINY';
console.log(`\nQueries with volume data: ${withVol.length}\n`);
console.log('═══ DOUBLE-DOWN: ranking (pos ≤20) + real volume, by monthly searches ═══\n');
console.log('  Vol/mo  Band   Pos   Impr  KD   Query → page');
console.log('  ' + '─'.repeat(78));
for (const m of doubleDown.slice(0, 45)) {
  const kd = m.difficulty != null ? String(m.difficulty).padStart(3) : '  -';
  console.log(`  ${String(m.volume).padStart(6)}  ${band(m.volume).padEnd(5)}  ${String(m.position).padStart(4)}  ${String(m.impressions).padStart(5)}  ${kd}  "${m.query.slice(0, 38)}" → ${m.page.slice(0, 30)}`);
}

// Volume band summary
const bands = {};
for (const m of withVol) { const b = band(m.volume); (bands[b] ||= { n: 0, impr: 0 }); bands[b].n++; bands[b].impr += m.impressions; }
console.log('\n═══ Your ranking footprint by volume band ═══');
for (const b of ['HEAD', 'BIG', 'SWEET', 'SMALL', 'TINY']) {
  if (bands[b]) console.log(`  ${b.padEnd(6)} ${String(bands[b].n).padStart(3)} queries  ${String(bands[b].impr).padStart(6)} impr/90d`);
}
console.log(`\n→ data/query-volumes.json`);
