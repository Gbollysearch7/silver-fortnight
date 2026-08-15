import { listItems } from '../lib/webflow.mjs';
const slugs = ['prop-firm-demo-account-practice-best-platforms','which-prop-firm-gives-real-account','best-prop-firms-in-france','which-futures-prop-trading-firm-offers-the-fastest-payout'];
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
for (const s of slugs) {
  const it = all.find(i => i.fieldData?.slug === s);
  const body = it.fieldData['post-body'];
  const h2s = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log('## ' + s + '  [' + body.length + ' chars]');
  console.log('   H2s: ' + h2s.join(' | '));
  // where does FAQ/conclusion start?
  for (const marker of ['Frequently Asked', 'FAQ', 'Conclusion', 'Final ', 'Bottom Line']) {
    const i = body.indexOf(marker);
    if (i > 0) console.log('   marker "' + marker + '" at char ' + i);
  }
  console.log('');
}
