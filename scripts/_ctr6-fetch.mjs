import { listItems } from '../lib/webflow.mjs';
const slugs = ['prop-firm-demo-account-practice-best-platforms','best-prop-firms-for-day-trading-in-2026','how-many-people-get-payouts-from-prop-firms','which-prop-firm-gives-real-account','prop-firm-copy-trading','which-futures-prop-trading-firm-offers-the-fastest-payout'];
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
for (const s of slugs) {
  const it = all.find(i => i.fieldData?.slug === s);
  if (!it) { console.log('MISSING:', s); continue; }
  console.log('slug: ' + s);
  console.log('  id:      ' + it.id);
  console.log('  name:    ' + it.fieldData.name + '  [' + it.fieldData.name.length + 'ch]');
  console.log('  summary: ' + (it.fieldData['post-summary'] || '(empty)') + '  [' + (it.fieldData['post-summary'] || '').length + 'ch]');
  console.log('');
}
