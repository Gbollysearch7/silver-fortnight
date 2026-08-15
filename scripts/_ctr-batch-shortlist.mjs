import { readFileSync, writeFileSync, existsSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
import { listItems } from '../lib/webflow.mjs';

const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const site = GSC_SITE_URL || 'sc-domain:tradersyard.com';
const fmt = d => d.toISOString().slice(0, 10);
const start = fmt(new Date(Date.now() - 30 * 864e5)), end = fmt(new Date(Date.now() - 2 * 864e5));

// exclusions: June 31-batch + today's pages
const exclude = new Set(['prop-firm-demo-account-practice-best-platforms','best-prop-firms-for-day-trading-in-2026','how-many-people-get-payouts-from-prop-firms','which-prop-firm-gives-real-account','prop-firm-copy-trading','which-futures-prop-trading-firm-offers-the-fastest-payout','which-prop-trading-firms-offer-direct-funding','trading-challenge-profit-target-formula-explained','funded-trader-scaling-plan-strategy-how-to-grow-your-account','prop-firm-payout-schedule-timeline-when-do-you-get-paid','do-prop-firms-allow-scalping']);
if (existsSync('data/ctr-rewrites-final.json')) {
  const j = JSON.parse(readFileSync('data/ctr-rewrites-final.json', 'utf8'));
  for (const r of (Array.isArray(j) ? j : j.rewrites || [])) { const s = r.slug || (r.url || '').split('/').pop(); if (s) exclude.add(s); }
}
console.log('excluded (recently rewritten):', exclude.size);

// pages by impressions
const pr = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, dimensions: ['page'], rowLimit: 500, dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog-posts/' }] }] } });
const pages = (pr.data.rows || []).map(r => ({ url: r.keys[0], slug: r.keys[0].split('/blog-posts/')[1]?.replace(/\/$/, ''), imp: r.impressions, clk: r.clicks, pos: r.position }))
  .filter(p => p.slug && !p.slug.includes('#') && p.url.startsWith('https://tradersyard.com') && !exclude.has(p.slug))
  .filter(p => p.imp >= 80 && p.clk <= 1 && p.pos <= 22);
pages.sort((a, b) => b.imp - a.imp);
const short = pages.slice(0, 18);

// top queries per page
for (const p of short) {
  const qr = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, dimensions: ['query'], rowLimit: 3, dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: p.url }] }] } });
  p.queries = (qr.data.rows || []).map(r => ({ q: r.keys[0], imp: r.impressions, pos: +r.position.toFixed(1) }));
}

// current title/meta from CMS
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
for (const p of short) {
  const it = all.find(i => i.fieldData?.slug === p.slug);
  p.id = it?.id; p.title = it?.fieldData?.name; p.meta = it?.fieldData?.['post-summary'];
}
writeFileSync('data/ctr-batch2-shortlist.json', JSON.stringify(short, null, 1));
for (const p of short) {
  console.log(`${p.slug}  imp:${p.imp} clk:${p.clk} pos:${p.pos.toFixed(1)}`);
  console.log(`   title: ${p.title}`);
  for (const q of p.queries || []) console.log(`   q: "${q.q}" (${q.imp} imp, pos ${q.pos})`);
}
console.log('\nshortlist:', short.length);
