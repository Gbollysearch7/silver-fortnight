#!/usr/bin/env node
/**
 * GSC 3-Month Story — pulls clicks, impressions, CTR, position across
 * time, queries, and pages. Compares first 6 weeks vs last 6 weeks.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';

const SITE = GSC_SITE_URL;
const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const end = new Date(today.getTime() - 2 * 864e5);        // GSC lags ~2-3 days
const start = new Date(end.getTime() - 90 * 864e5);
const mid = new Date(end.getTime() - 45 * 864e5);

const credentials = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf-8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const sc = google.searchconsole({ version: 'v1', auth });

async function query(body) {
  const res = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: body });
  return res.data.rows || [];
}

function agg(rows) {
  const c = rows.reduce((s, r) => s + r.clicks, 0);
  const i = rows.reduce((s, r) => s + r.impressions, 0);
  const p = rows.length ? rows.reduce((s, r) => s + r.position * r.impressions, 0) / i : 0;
  return { clicks: c, impressions: i, ctr: i ? (c / i) * 100 : 0, position: p };
}

(async () => {
  console.log(`Site: ${SITE}`);
  console.log(`Window: ${fmt(start)} → ${fmt(end)} (90 days)\n`);

  // Totals + period comparison
  const p1 = await query({ startDate: fmt(start), endDate: fmt(mid) });
  const p2 = await query({ startDate: fmt(mid), endDate: fmt(end) });
  const a1 = agg(p1), a2 = agg(p2);

  // Weekly trend
  const weekly = await query({ startDate: fmt(start), endDate: fmt(end), dimensions: ['date'], rowLimit: 25000 });

  // Top queries
  const queries = await query({ startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: 250 });

  // Top pages
  const pages = await query({ startDate: fmt(start), endDate: fmt(end), dimensions: ['page'], rowLimit: 250 });

  // Striking distance: position 4-20 with impressions
  const striking = queries.filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 20)
    .sort((a, b) => b.impressions - a.impressions);

  // Position buckets
  const buckets = { '1-3': agg([]), '4-10': agg([]), '11-20': agg([]), '21-50': agg([]), '50+': agg([]) };
  const bk = (p) => p <= 3 ? '1-3' : p <= 10 ? '4-10' : p <= 20 ? '11-20' : p <= 50 ? '21-50' : '50+';
  const bcount = { '1-3': 0, '4-10': 0, '11-20': 0, '21-50': 0, '50+': 0 };
  for (const r of queries) bcount[bk(r.position)]++;

  const out = {
    window: { start: fmt(start), end: fmt(end), mid: fmt(mid) },
    period1: a1, period2: a2,
    weekly: weekly.map(r => ({ date: r.keys[0], ...r, keys: undefined })),
    topQueries: queries.slice(0, 40),
    topPages: pages.slice(0, 30),
    striking: striking.slice(0, 40),
    queryCount: queries.length,
    pageCount: pages.length,
    positionBuckets: bcount,
  };
  writeFileSync('output/gsc-story.json', JSON.stringify(out, null, 2));

  // Print summary
  const tot = agg(queries);
  console.log('=== 90-DAY TOTALS (by query) ===');
  console.log(`Clicks: ${tot.clicks}  Impressions: ${tot.impressions}  CTR: ${tot.ctr.toFixed(2)}%  Avg Pos: ${tot.position.toFixed(1)}`);
  console.log(`Distinct queries: ${queries.length}  Distinct pages: ${pages.length}\n`);

  console.log('=== FIRST 45 DAYS vs LAST 45 DAYS ===');
  const d = (x, y) => y === 0 ? 'n/a' : ((x - y) / y * 100).toFixed(0) + '%';
  console.log(`Clicks:      ${a1.clicks} → ${a2.clicks}  (${d(a2.clicks, a1.clicks)})`);
  console.log(`Impressions: ${a1.impressions} → ${a2.impressions}  (${d(a2.impressions, a1.impressions)})`);
  console.log(`CTR:         ${a1.ctr.toFixed(2)}% → ${a2.ctr.toFixed(2)}%`);
  console.log(`Avg Pos:     ${a1.position.toFixed(1)} → ${a2.position.toFixed(1)}\n`);

  console.log('=== POSITION DISTRIBUTION (queries) ===');
  for (const [k, v] of Object.entries(bcount)) console.log(`  Pos ${k}: ${v} queries`);
  console.log('');

  console.log('=== TOP 15 QUERIES (by clicks) ===');
  for (const r of [...queries].sort((a, b) => b.clicks - a.clicks).slice(0, 15))
    console.log(`  ${String(r.clicks).padStart(4)} clk  ${String(r.impressions).padStart(6)} imp  pos ${r.position.toFixed(1).padStart(5)}  ${r.keys[0]}`);
  console.log('');

  console.log('=== TOP 15 STRIKING-DISTANCE (pos 4-20, high impr) ===');
  for (const r of striking.slice(0, 15))
    console.log(`  pos ${r.position.toFixed(1).padStart(5)}  ${String(r.impressions).padStart(6)} imp  ${String(r.clicks).padStart(3)} clk  ${r.keys[0]}`);
  console.log('');

  console.log('=== TOP 10 PAGES (by clicks) ===');
  for (const r of [...pages].sort((a, b) => b.clicks - a.clicks).slice(0, 10))
    console.log(`  ${String(r.clicks).padStart(4)} clk  ${String(r.impressions).padStart(6)} imp  pos ${r.position.toFixed(1).padStart(5)}  ${r.keys[0].replace('https://tradersyard.com', '')}`);

  console.log('\nFull data → output/gsc-story.json');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
