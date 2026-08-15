import { listItems } from '../lib/webflow.mjs';
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }

// Related guides block format
const sample = all.find(i => (i.fieldData?.['post-body'] || '').includes('Related guides'));
const b = sample.fieldData['post-body'];
const i0 = b.indexOf('Related guides');
console.log('=== Related guides block sample (' + sample.fieldData.slug + ') ===');
console.log(b.slice(i0 - 100, i0 + 700).replace(/></g, '>\n<'));

const targets = {
  'prop-firm-demo-account-practice-best-platforms': /demo|practice|paper.trad/i,
  'best-prop-firms-for-day-trading-in-2026': /day.trad|scalp|intraday/i,
  'how-many-people-get-payouts-from-prop-firms': /payout|withdraw|profit.split|get.paid/i,
  'which-prop-firm-gives-real-account': /real.account|real.capital|sim|funded.account|legit/i,
  'prop-firm-copy-trading': /copy.trad|social.trad|signal/i,
  'which-futures-prop-trading-firm-offers-the-fastest-payout': /futures/i,
};
console.log('\n=== candidates per target (live, has Related guides, not already linking) ===');
for (const [target, re] of Object.entries(targets)) {
  const cands = [];
  for (const it of all) {
    const slug = it.fieldData?.slug, body = it.fieldData?.['post-body'] || '';
    if (!slug || slug === target || !body) continue;
    if (!re.test(slug) && !re.test(it.fieldData?.name || '')) continue;
    if (body.includes('/blog-posts/' + target)) continue; // already links
    if (!body.includes('Related guides')) continue;
    cands.push(slug);
  }
  console.log('\n' + target + '  (' + cands.length + ')');
  console.log('  ' + cands.slice(0, 10).join('\n  '));
}
