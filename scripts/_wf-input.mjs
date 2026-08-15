import { readFileSync, writeFileSync } from 'fs';
const d = JSON.parse(readFileSync('data/ctr-foundation.json','utf8'));
// Dedup by slug (some pages appear twice for diff query clusters) — keep highest lostClicks
const bySlug = {};
for (const p of d) {
  if (!bySlug[p.slug] || p.lostClicks > bySlug[p.slug].lostClicks) bySlug[p.slug] = p;
}
const pages = Object.values(bySlug).map(p => ({
  slug: p.slug,
  itemId: p.itemId,
  pos: p.position,
  lostClicks: p.lostClicks,
  currentTitle: p.currentTitle,
  currentMeta: p.currentSummary,
  // clean queries: drop junk/garbled ones, keep real searches
  queries: p.topQueries
    .filter(q => q.q.length > 4 && !/^(ja|both plz|anything else|in belgium\?|site:)/i.test(q.q) && !/["']/.test(q.q.slice(0,1)))
    .slice(0, 8)
    .map(q => q.q),
}));
writeFileSync('data/wf-pages.json', JSON.stringify(pages));
console.log(`${pages.length} unique pages prepared for workflow`);
