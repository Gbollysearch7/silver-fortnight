import { writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';

// dead targets from Ahrefs Error-404_page.csv (main + subdomain variants matched by slug)
const deadSlugs = [
  'funded-trader-profit-split-calculator-calculate-your-earning-2c346',
  'how-prop-firm-challenges-work','prop-firm-challenge-spreadsheet-template','best-crypto-prop-firms',
  'prop-firm-red-flags','prop-firm-profit-split-explained','prop-firm-payout-guide',
  'how-do-prop-firms-make-money','prop-firm-drawdown-rules-explained','position-sizing-for-prop-firm-challenges',
  'prop-firm-leverage-comparison-table-2026','prop-firm-challenge-failed-heres-what-to-do-next-02e7d',
  'prop-firm-risk-management-rules','prop-firm-rules-that-get-traders-banned','crypto-options-vs-futures-trading',
  'prop-firm-no-trailing-drawdown','passing-a-prop-firm-challenge','prohibited-trading-strategies',
  'how-to-pass-forex-prop-firm-challenge-21ab2','prop-firm-trailing-drawdown-explained',
  'how-prop-firm-funded-accounts-work','do-prop-firm-challenges-have-a-time-limit','prop-firm-drawdown-rules',
  'prop-firm-evaluation-process-explained','prop-firm-payout-process-explained','prop-firm-challenge-rules-explained',
  'prop-firm-consistency-rule-explained','funded-trader-profit-split-calculator',
  'how-many-people-fail-prop-firm-challenges-01012','how-prop-firm-funding-works','how-a-trading-challenge-works',
  'daily-drawdown-vs-max-drawdown-explained','prop-firms-that-allow-hft',
];
const deadOther = ['tradersyard.com/community', 'docs.tradersyard.com/traderchallenge/rules/prohibited-trading-practices'];

let offset = 0, all = [];
while (true) {
  const r = await listItems({ limit: 100, offset });
  all = all.concat(r.items || []);
  if (!r.items || r.items.length < 100) break;
  offset += 100;
}
const liveSlugs = new Set(all.filter(i => !i.isDraft && !i.isArchived).map(i => i.fieldData?.slug));
console.log('CMS items:', all.length, '| live slugs:', liveSlugs.size);

// which "dead" slugs actually exist live (Ahrefs may lag)
console.log('\ndead slugs that are actually LIVE in CMS (skip):');
for (const s of deadSlugs) if (liveSlugs.has(s)) console.log('  ', s);

// scan bodies
const hits = [];
for (const it of all) {
  const body = it.fieldData?.['post-body'] || '';
  const slug = it.fieldData?.slug;
  if (!body) continue;
  for (const d of deadSlugs) {
    if (liveSlugs.has(d)) continue;
    const re = new RegExp('href="[^"]*/blog-posts/' + d + '/?"', 'g');
    const m = body.match(re);
    if (m) hits.push({ source: slug, id: it.id, dead: d, count: m.length, isDraft: it.isDraft });
  }
  for (const d of deadOther) {
    const re = new RegExp('href="https?://(www\\.)?' + d.replace(/[/.]/g, '\\$&') + '/?"', 'g');
    const m = body.match(re);
    if (m) hits.push({ source: slug, id: it.id, dead: d, count: m.length, isDraft: it.isDraft });
  }
}
console.log('\ntotal link hits in CMS bodies:', hits.reduce((a, h) => a + h.count, 0), 'across', new Set(hits.map(h => h.source)).size, 'posts');
const byDead = {};
for (const h of hits) { byDead[h.dead] = (byDead[h.dead] || 0) + h.count; }
console.log('\nhits per dead target:');
for (const [d, c] of Object.entries(byDead).sort((a, b) => b[1] - a[1])) console.log(String(c).padStart(4), d);
writeFileSync('data/deadlink-hits.json', JSON.stringify({ hits, liveSlugs: [...liveSlugs] }, null, 1));
console.log('\nsaved data/deadlink-hits.json');
