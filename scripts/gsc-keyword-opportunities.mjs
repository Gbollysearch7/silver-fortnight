#!/usr/bin/env node
/**
 * GSC Keyword Opportunity Miner
 *
 * Answers two questions directly from live Search Console data:
 *
 *   A. NEW KEYWORDS — queries already earning impressions for which NO existing
 *      post is targeted (content gaps). These are net-new posts to write, ranked
 *      by impressions × opportunity. We strip queries already "owned" by a post
 *      whose targeted keyword matches.
 *
 *   B. RE-TARGET — existing pages where GSC shows a *different, stronger* query
 *      than the keyword the post was optimized for. Swap the on-page target
 *      (title/H1/meta) to the query that's actually pulling impressions/position.
 *
 * Read-only. Writes data/gsc-opportunities.json + prints a summary.
 *
 *   node scripts/gsc-keyword-opportunities.mjs --days=90
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL, DATA_DIR } from '../lib/config.mjs';
import { google } from 'googleapis';

const DAYS = parseInt(process.argv.find(a => a.startsWith('--days='))?.split('=')[1] || '90', 10);
const fmt = (d) => d.toISOString().slice(0, 10);
const endDate = fmt(new Date(Date.now() - 2 * 864e5));
const startDate = fmt(new Date(Date.now() - (DAYS + 2) * 864e5));

const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf-8'));
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const sc = google.searchconsole({ version: 'v1', auth });
const siteUrl = GSC_SITE_URL || 'sc-domain:tradersyard.com';

const isBlog = (url) => /\/blog-posts\/|\/blog\//.test(url);
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const slugFromUrl = (url) => (url.match(/\/blog-posts\/([^/?#]+)/) || url.match(/\/blog\/([^/?#]+)/) || [])[1] || url;

// Word-overlap: how much of the query is covered by a target keyword's words
function overlap(query, target) {
  const q = new Set(norm(query).split(' ').filter(Boolean));
  const t = new Set(norm(target).split(' ').filter(Boolean));
  if (!q.size || !t.size) return 0;
  let hit = 0;
  for (const w of q) if (t.has(w)) hit++;
  return hit / q.size; // fraction of query words present in the target
}

async function query(dimensions) {
  const res = await sc.searchanalytics.query({
    siteUrl,
    requestBody: { startDate, endDate, dimensions, rowLimit: 25000 },
  });
  return res.data.rows || [];
}

console.log(`GSC opportunity mine: ${siteUrl}  ${startDate} → ${endDate} (${DAYS}d)\n`);

// --- Load what we already target -----------------------------------------
const queue = JSON.parse(readFileSync(resolve(DATA_DIR, 'keyword-queue.json'), 'utf-8')).queue || [];
const tracker = JSON.parse(readFileSync(resolve(DATA_DIR, 'blog-tracker.json'), 'utf-8')).posts || {};

// All keywords we've deliberately targeted (queue + tracker), normalized.
const targetedKeywords = new Set();
for (const k of queue) if (k.keyword) targetedKeywords.add(norm(k.keyword));
for (const p of Object.values(tracker)) if (p.keyword) targetedKeywords.add(norm(p.keyword));

// Map slug -> the keyword the post was optimized for (prefer tracker, then queue)
const slugTarget = {};
for (const p of Object.values(tracker)) if (p.slug && p.keyword) slugTarget[p.slug] = p.keyword;
for (const k of queue) if (k.slug && k.keyword && !slugTarget[k.slug]) slugTarget[k.slug] = k.keyword;

// --- Pull GSC ------------------------------------------------------------
const queryRows = (await query(['query']))
  .map(r => ({ query: r.keys[0], clicks: Math.round(r.clicks), impressions: Math.round(r.impressions), ctr: +(r.ctr * 100).toFixed(2), position: +r.position.toFixed(1) }));

const pqRows = (await query(['page', 'query']))
  .filter(r => isBlog(r.keys[0]))
  .map(r => ({ url: r.keys[0], slug: slugFromUrl(r.keys[0]), query: r.keys[1], clicks: Math.round(r.clicks), impressions: Math.round(r.impressions), ctr: +(r.ctr * 100).toFixed(2), position: +r.position.toFixed(1) }));

// =========================================================================
// A. NEW KEYWORDS — impressions exist, but no post targets this query
// =========================================================================
// A query is "covered" if some targeted keyword overlaps it heavily (>=0.7 of
// the query words present). Otherwise it's a gap worth a new post.
const isCovered = (q) => {
  const nq = norm(q);
  if (targetedKeywords.has(nq)) return true;
  for (const t of targetedKeywords) if (overlap(q, t) >= 0.7) return true;
  return false;
};

const newKeywords = queryRows
  .filter(r => r.impressions >= 20)          // enough demand to matter
  .filter(r => r.position <= 40)             // we already surface for it — real intent match
  .filter(r => !isCovered(r.query))
  // skip branded / navigational — incl. our own brand misspellings (high-CTR, pos ~1)
  .filter(r => !/trader|tradeyard|tradyard|forexyard|forex yard|propfirms?$|traderslake/.test(norm(r.query)))
  // a query sitting at pos <=2 with high CTR is navigational (brand), not a content gap
  .filter(r => !(r.position <= 2 && r.ctr >= 15))
  .map(r => ({ ...r, opportunityScore: Math.round(r.impressions * (r.position <= 20 ? 1.5 : 1)) }))
  .sort((a, b) => b.opportunityScore - a.opportunityScore)
  .slice(0, 60);

// =========================================================================
// B. RE-TARGET — page's best-impression query differs from its on-page target
// =========================================================================
// For each blog page, find the query pulling the most impressions. If that
// query is materially different from the keyword the post was optimized for
// (low overlap) AND it's stronger (more impressions / better position than the
// current target's query), recommend re-targeting the page to it.
const byPage = {};
for (const r of pqRows) (byPage[r.url] ||= []).push(r);

const retarget = [];
for (const [url, rows] of Object.entries(byPage)) {
  const slug = slugFromUrl(url);
  const currentTarget = slugTarget[slug];
  if (!currentTarget) continue;

  rows.sort((a, b) => b.impressions - a.impressions);
  const top = rows[0];
  if (!top || top.impressions < 30) continue;

  const targetOverlap = overlap(top.query, currentTarget);
  // The query the page actually ranks best for is NOT what we optimized for
  if (targetOverlap >= 0.6) continue;

  // How does the current target keyword itself perform on this page (if at all)?
  const currentRow = rows.find(r => overlap(r.query, currentTarget) >= 0.6);
  const currentImpr = currentRow ? currentRow.impressions : 0;

  // Only recommend swap if the discovered query clearly out-pulls the target.
  // If the target keyword pulls ~nothing on this page, any strong off-target
  // query (>=30 impr, handled above) is a swap candidate.
  if (currentImpr > 0 && top.impressions < currentImpr * 1.25) continue;

  retarget.push({
    url, slug,
    currentTarget,
    currentTargetImpressions: currentImpr,
    suggestedTarget: top.query,
    suggestedImpressions: top.impressions,
    suggestedPosition: top.position,
    suggestedClicks: top.clicks,
    suggestedCtr: top.ctr,
    overlap: +targetOverlap.toFixed(2),
    // secondary queries on the page worth adding as H2s
    secondaryQueries: rows.slice(1, 5).map(r => ({ query: r.query, impressions: r.impressions, position: r.position })),
  });
}
retarget.sort((a, b) => b.suggestedImpressions - a.suggestedImpressions);

// =========================================================================
const out = {
  meta: { siteUrl, startDate, endDate, days: DAYS, generatedAt: new Date().toISOString() },
  summary: {
    totalQueries: queryRows.length,
    newKeywordOpportunities: newKeywords.length,
    retargetRecommendations: retarget.length,
  },
  newKeywords,
  retarget: retarget.slice(0, 50),
};

const outPath = resolve(DATA_DIR, 'gsc-opportunities.json');
writeFileSync(outPath, JSON.stringify(out, null, 2));

// --- Print ---------------------------------------------------------------
console.log('═══ A. NEW KEYWORD OPPORTUNITIES (no post targets these) ═══\n');
console.log('  impr   pos   ctr%  query');
for (const k of newKeywords.slice(0, 25)) {
  console.log(`  ${String(k.impressions).padStart(5)}  ${String(k.position).padStart(4)}  ${String(k.ctr).padStart(5)}  ${k.query}`);
}

console.log('\n═══ B. RE-TARGET EXISTING POSTS (swap on-page keyword) ═══\n');
for (const r of retarget.slice(0, 20)) {
  console.log(`  /${r.slug}`);
  console.log(`     now targets : "${r.currentTarget}"  (${r.currentTargetImpressions} impr)`);
  console.log(`     should target: "${r.suggestedTarget}"  (${r.suggestedImpressions} impr, pos ${r.suggestedPosition}, ${r.suggestedClicks} clk)`);
}

console.log(`\nNew keyword opportunities: ${newKeywords.length}`);
console.log(`Re-target recommendations: ${retarget.length}`);
console.log(`\n→ ${outPath}`);
