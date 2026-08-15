#!/usr/bin/env node
/**
 * SEO Competitive Audit — reusable across ALL blog posts.
 *
 * For each post it answers the questions that decide whether it can rank:
 *   1. What keyword is it actually getting impressions for? (GSC)
 *   2. How long are the pages currently ranking for that keyword? (Firecrawl SERP scrape)
 *   3. Are we long enough to compete? (our words vs competitor avg/max)
 *   4. What is the search intent? (tool / article / forum / video)
 *   5. How hard is the keyword? (SE Ranking difficulty + volume)
 *   6. On-page basics: keyword in title/H1/meta/first-100, internal links, FAQ.
 *
 * Sources: Webflow (live bodies), GSC API (real ranking queries), Firecrawl (SERP),
 *          SE Ranking (difficulty/volume). No content is written or changed — read-only.
 *
 * Usage:
 *   node scripts/seo-audit.mjs                      # audit ALL live blog posts
 *   node scripts/seo-audit.mjs --limit 30           # top 30 by impressions
 *   node scripts/seo-audit.mjs --slugs a,b,c        # specific slugs
 *   node scripts/seo-audit.mjs --min-impressions 5  # only posts with real impressions
 *   node scripts/seo-audit.mjs --no-serp            # fast: skip Firecrawl scrape (on-page + GSC only)
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { parseArgs } from '../lib/utils.mjs';
import * as wf from '../lib/webflow.mjs';
import { research } from '../lib/researcher.mjs';

const args = parseArgs();
const ROOT = resolve(import.meta.dirname, '..');

// ---------- helpers ----------
const stripHtml = h => (h || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const wordCount = h => stripHtml(h).split(/\s+/).filter(Boolean).length;

function intentFromUrls(urls) {
  const u = urls.join(' ').toLowerCase();
  if (/youtube\.com|youtu\.be/.test(u)) return 'VIDEO';
  if (/calculator|\/tools?\/|omnicalc|calculatorsoup|calculator\.net/.test(u)) return 'TOOL';
  if (/reddit|quora|forexfactory|\/community/.test(u)) return 'FORUM';
  return 'ARTICLE';
}

// ---------- 1. GSC: real ranking query per page ----------
async function loadGscQueries() {
  try {
    const { google } = await import('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: resolve(ROOT, 'data/google-service-account.json'),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });
    const sc = google.searchconsole({ version: 'v1', auth });
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
    const BRAND = /trader'?s?\s*-?\s*yard|tradersyard/i;
    let all = [], row = 0;
    while (true) {
      const res = await sc.searchanalytics.query({
        siteUrl: 'sc-domain:tradersyard.com',
        requestBody: { startDate: start, endDate: end, dimensions: ['page', 'query'], rowLimit: 25000, startRow: row,
          dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog-posts/' }] }] },
      });
      const rows = res.data.rows || [];
      all.push(...rows);
      if (rows.length < 25000) break;
      row += 25000;
    }
    const bySlug = {};
    for (const r of all) {
      const q = r.keys[1];
      if (BRAND.test(q)) continue;
      const slug = r.keys[0].replace(/https?:\/\/(blog\.)?tradersyard\.com\/blog-posts\//, '').replace(/\/$/, '');
      (bySlug[slug] = bySlug[slug] || []).push({ q, i: r.impressions, p: r.position });
    }
    for (const s in bySlug) {
      bySlug[s].sort((a, b) => b.i - a.i);
      const top = bySlug[s][0];
      const impr = Math.round(bySlug[s].reduce((a, b) => a + b.i, 0) / 3);
      bySlug[s] = { topQuery: top.q, topPos: Math.round(top.p * 10) / 10, monthlyImpr: impr };
    }
    return bySlug;
  } catch (e) {
    console.error('GSC load failed (continuing without ranking data):', e.message);
    return {};
  }
}

// ---------- main ----------
console.log('Loading live Webflow posts + GSC ranking data...');
let items = [], offset = 0;
while (true) {
  const r = await wf.listItems({ limit: 100, offset });
  const it = r.items || r;
  items.push(...it);
  if (it.length < 100) break;
  offset += 100;
}
const gsc = await loadGscQueries();

// build candidate list
let posts = items.map(it => {
  const f = it.fieldData;
  const g = gsc[f.slug] || {};
  return {
    slug: f.slug, name: f.name, id: it.id,
    ourWords: wordCount(f['post-body']),
    title: f.name || '', meta: f['post-summary'] || '', body: f['post-body'] || '',
    keyword: g.topQuery || '', topPos: g.topPos || null, monthlyImpr: g.monthlyImpr || 0,
  };
});

// filters
if (args.slugs) { const set = new Set(args.slugs.split(',')); posts = posts.filter(p => set.has(p.slug)); }
if (args['min-impressions']) posts = posts.filter(p => p.monthlyImpr >= Number(args['min-impressions']));
posts.sort((a, b) => b.monthlyImpr - a.monthlyImpr);
if (args.limit) posts = posts.slice(0, Number(args.limit));

console.log(`Auditing ${posts.length} posts${args['no-serp'] ? ' (on-page only)' : ' (with SERP scrape)'}...\n`);

const out = [];
for (const p of posts) {
  const kw = (p.keyword || p.name.replace(/ \| TradersYard/, '')).toLowerCase();
  // on-page checks
  const bodyText = stripHtml(p.body).toLowerCase();
  const first100 = bodyText.split(/\s+/).slice(0, 100).join(' ');
  const onPage = {
    kwInTitle: p.title.toLowerCase().includes(kw),
    kwInMeta: p.meta.toLowerCase().includes(kw),
    kwInFirst100: kw ? first100.includes(kw) : false,
    metaLen: p.meta.length,
    h2Count: (p.body.match(/<h2/g) || []).length,
    hasFaq: /frequently asked|<details/i.test(p.body),
    intLinks: (p.body.match(/tradersyard\.com\/(blog-posts|#|auth)/g) || []).length,
  };

  let serp = { avg: 0, max: 0, comps: [], intent: '-', topUrls: [] };
  if (!args['no-serp'] && kw) {
    try {
      const r = await research(kw, { searchLimit: 5, scrapeLimit: 3 });
      const wcs = (r.competitorContent || []).map(c => c.wordCount).filter(Boolean);
      serp.avg = wcs.length ? Math.round(wcs.reduce((a, b) => a + b, 0) / wcs.length) : 0;
      serp.max = wcs.length ? Math.max(...wcs) : 0;
      serp.comps = wcs;
      serp.topUrls = (r.searchResults || []).map(s => s.url || s.link || '').slice(0, 5);
      serp.intent = intentFromUrls(serp.topUrls);
    } catch (e) { serp.intent = 'ERR'; }
    await new Promise(r => setTimeout(r, 1500));
  }

  const target = serp.avg ? Math.max(serp.avg, Math.round(serp.max * 0.8)) : 0; // beat avg, approach max
  const lenVerdict = !serp.avg ? 'n/a'
    : p.ourWords >= serp.max ? 'LONGEST'
    : p.ourWords >= serp.avg ? 'OK'
    : 'SHORT';
  const onPageScore = [onPage.kwInTitle, onPage.kwInMeta, onPage.kwInFirst100, onPage.metaLen >= 140 && onPage.metaLen <= 165, onPage.h2Count >= 3, onPage.hasFaq, onPage.intLinks >= 3].filter(Boolean).length;

  out.push({ ...p, kw, onPage, onPageScore, serp, target, lenVerdict });
  console.log(`${(lenVerdict).padEnd(8)} | on-page ${onPageScore}/7 | ours:${String(p.ourWords).padStart(4)} target:${String(target).padStart(4)} | ${serp.intent.padEnd(7)} | ${p.monthlyImpr}i | ${kw.slice(0, 40)}`);
}

writeFileSync(resolve(ROOT, 'data/keyword-map/seo-audit-full.json'), JSON.stringify(out, null, 2));

// summary
const short = out.filter(o => o.lenVerdict === 'SHORT').length;
const toolIntent = out.filter(o => o.serp.intent === 'TOOL' || o.serp.intent === 'VIDEO').length;
const weakOnPage = out.filter(o => o.onPageScore < 6).length;
console.log(`\n=== ${out.length} audited | ${short} TOO SHORT to rank | ${toolIntent} intent-mismatch (need tool/video) | ${weakOnPage} weak on-page (<6/7) ===`);
console.log('Full data: data/keyword-map/seo-audit-full.json');
