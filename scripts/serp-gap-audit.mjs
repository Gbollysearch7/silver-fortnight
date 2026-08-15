#!/usr/bin/env node
/**
 * SERP gap audit: for each rewrite, pull top-competitor word counts + intent
 * and compare to our published word count. Tells us if we're long enough to compete.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { research } from '../lib/researcher.mjs';

const files = readdirSync('content/rewrites').filter(f => f.endsWith('.md'));
const results = [];

function intentFromUrls(urls) {
  const u = urls.join(' ').toLowerCase();
  const tool = /calculator|\/tools?\/|omnicalc|calculatorsoup|calculator\.net/.test(u);
  const forum = /reddit|quora|forexfactory/.test(u);
  return tool ? 'TOOL-heavy' : forum ? 'FORUM-heavy' : 'ARTICLE';
}

for (const f of files) {
  const raw = readFileSync('content/rewrites/' + f, 'utf8');
  const kw = (raw.match(/primary: "(.+?)"/) || [])[1] || '';
  const slug = (raw.match(/slug: "(.+?)"/) || [])[1] || '';
  const body = raw.split(/^---$/m).slice(2).join('---');
  const ourWords = body.split(/\s+/).filter(Boolean).length;
  if (!kw) { console.log('skip (no kw):', f); continue; }
  try {
    const r = await research(kw, { searchLimit: 5, scrapeLimit: 3 });
    const wcs = (r.competitorContent || []).map(c => c.wordCount).filter(Boolean);
    const max = wcs.length ? Math.max(...wcs) : 0;
    const avg = wcs.length ? Math.round(wcs.reduce((a, b) => a + b, 0) / wcs.length) : 0;
    const urls = (r.searchResults || []).map(s => s.url || s.link || '');
    const intent = intentFromUrls(urls);
    const verdict = ourWords >= avg ? (ourWords >= max ? 'LONGEST' : 'OK (≥avg)') : 'SHORT';
    results.push({ kw, slug, ourWords, avg, max, comps: wcs.join('/'), intent, verdict });
    console.log(`${verdict.padEnd(10)} | ours:${String(ourWords).padStart(4)} avg:${String(avg).padStart(4)} max:${String(max).padStart(4)} | ${intent.padEnd(12)} | ${kw}`);
  } catch (e) {
    console.log('ERR', kw, '-', e.message.slice(0, 60));
    results.push({ kw, slug, ourWords, avg: 0, max: 0, intent: 'ERR', verdict: 'ERR' });
  }
  await new Promise(r => setTimeout(r, 1500));
}

writeFileSync('data/keyword-map/serp-gap-audit.json', JSON.stringify(results, null, 2));
const short = results.filter(r => r.verdict === 'SHORT').length;
const tool = results.filter(r => r.intent === 'TOOL-heavy').length;
console.log(`\n=== ${results.length} audited | ${short} too short vs avg | ${tool} need a tool (intent mismatch) ===`);
