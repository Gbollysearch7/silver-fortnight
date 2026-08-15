#!/usr/bin/env node
/**
 * GSC Position-Growth Analysis (one-off, for the 90-day plan)
 *
 * Pulls live Search Console data and builds the four data sets the plan needs:
 *   1. Per-page metrics (clicks/impressions/CTR/position)
 *   2. Striking-distance queries (pos 4-20, high impressions, low CTR) — the quick wins
 *   3. CTR-gap pages (page 1, position <=10, CTR well below expected) — title/meta rewrites
 *   4. Cannibalization (one query, multiple ranking URLs) — merge candidates
 *
 * Writes data/gsc-analysis.json for the report builder.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL, DATA_DIR } from '../lib/config.mjs';
import { google } from 'googleapis';

const DAYS = parseInt(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] || '90', 10);
const fmt = (d) => d.toISOString().slice(0, 10);
const endDate = fmt(new Date(Date.now() - 2 * 864e5)); // GSC lags ~2 days
const startDate = fmt(new Date(Date.now() - (DAYS + 2) * 864e5));

// Expected CTR by position (industry-standard curve, used to find CTR gaps)
const EXPECTED_CTR = { 1: 28, 2: 15, 3: 11, 4: 8, 5: 6, 6: 4.5, 7: 3.5, 8: 3, 9: 2.5, 10: 2.2 };

const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf-8'));
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const sc = google.searchconsole({ version: 'v1', auth });
const siteUrl = GSC_SITE_URL || 'sc-domain:tradersyard.com';

console.log(`GSC pull: ${siteUrl}  ${startDate} → ${endDate} (${DAYS}d)\n`);

function isBlog(url) {
  return /\/blog-posts\/|\/blog\//.test(url);
}

async function query(dimensions, extraFilters = []) {
  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate, endDate, dimensions, rowLimit: 25000,
      dimensionFilterGroups: extraFilters.length ? [{ filters: extraFilters }] : undefined,
    },
  });
  return res.data.rows || [];
}

// 1. Per-page
const pageRows = await query(['page']);
const pages = pageRows
  .filter(r => isBlog(r.keys[0]))
  .map(r => ({
    url: r.keys[0],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: +(r.ctr * 100).toFixed(2),
    position: +r.position.toFixed(1),
  }))
  .sort((a, b) => b.impressions - a.impressions);

console.log(`Blog pages with data: ${pages.length}`);
console.log(`Total impressions: ${pages.reduce((s, p) => s + p.impressions, 0).toLocaleString()}`);
console.log(`Total clicks: ${pages.reduce((s, p) => s + p.clicks, 0).toLocaleString()}\n`);

// 2 + 4. Page+query rows
const pqRows = await query(['page', 'query']);
const pq = pqRows
  .filter(r => isBlog(r.keys[0]))
  .map(r => ({
    url: r.keys[0], query: r.keys[1],
    clicks: Math.round(r.clicks),
    impressions: Math.round(r.impressions),
    ctr: +(r.ctr * 100).toFixed(2),
    position: +r.position.toFixed(1),
  }));

// Striking distance: position 4-20, meaningful impressions, room to climb
const strikingDistance = pq
  .filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 30)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 60);

// CTR gap: page-1 pages clicking well below expected for their position
const ctrGap = pages
  .filter(p => p.position <= 10 && p.impressions >= 100)
  .map(p => {
    const exp = EXPECTED_CTR[Math.max(1, Math.round(p.position))] || 2;
    return { ...p, expectedCtr: exp, gap: +(exp - p.ctr).toFixed(1), lostClicks: Math.round(p.impressions * (exp - p.ctr) / 100) };
  })
  .filter(p => p.gap > 1 && p.lostClicks > 5)
  .sort((a, b) => b.lostClicks - a.lostClicks)
  .slice(0, 40);

// Cannibalization: same query ranking on >1 URL with real impressions
const byQuery = {};
for (const r of pq) {
  if (r.impressions < 10) continue;
  (byQuery[r.query] ||= []).push(r);
}
const cannibalization = Object.entries(byQuery)
  .filter(([, urls]) => urls.length > 1)
  .map(([q, urls]) => ({
    query: q,
    urlCount: urls.length,
    totalImpressions: urls.reduce((s, u) => s + u.impressions, 0),
    urls: urls.sort((a, b) => a.position - b.position).map(u => ({ url: u.url, position: u.position, impressions: u.impressions, clicks: u.clicks })),
  }))
  .filter(c => c.totalImpressions >= 50)
  .sort((a, b) => b.totalImpressions - a.totalImpressions)
  .slice(0, 30);

// Position buckets (to confirm/refresh the user's table)
const bucket = (p) => p <= 3 ? '1-3' : p <= 10 ? '4-10' : p <= 20 ? '11-20' : p <= 50 ? '21-50' : '50+';
const buckets = {};
for (const p of pages) {
  const b = bucket(p.position);
  (buckets[b] ||= { pages: 0, impressions: 0, clicks: 0 });
  buckets[b].pages++;
  buckets[b].impressions += p.impressions;
  buckets[b].clicks += p.clicks;
}

const out = {
  meta: { siteUrl, startDate, endDate, days: DAYS, generatedFor: 'position-growth-plan' },
  totals: {
    pages: pages.length,
    impressions: pages.reduce((s, p) => s + p.impressions, 0),
    clicks: pages.reduce((s, p) => s + p.clicks, 0),
  },
  buckets,
  pages,
  strikingDistance,
  ctrGap,
  cannibalization,
};

const outPath = resolve(DATA_DIR, 'gsc-analysis.json');
writeFileSync(outPath, JSON.stringify(out, null, 2));

console.log('Position buckets (live):');
for (const [b, d] of Object.entries(buckets).sort()) {
  console.log(`  ${b.padEnd(6)} ${String(d.pages).padStart(4)} pages  ${String(d.impressions).padStart(8)} impr  ${String(d.clicks).padStart(6)} clicks`);
}
console.log(`\nStriking-distance queries (pos 4-20): ${strikingDistance.length}`);
console.log(`CTR-gap pages (page 1, below expected): ${ctrGap.length}`);
console.log(`Cannibalized queries: ${cannibalization.length}`);
console.log(`\n→ ${outPath}`);
