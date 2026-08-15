import { listItems } from '../lib/webflow.mjs';
const slugs = ['which-prop-trading-firms-offer-direct-funding','trading-challenge-profit-target-formula-explained','funded-trader-scaling-plan-strategy-how-to-grow-your-account','prop-firm-payout-schedule-timeline-when-do-you-get-paid','do-prop-firms-allow-scalping'];
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
for (const s of slugs) {
  const it = all.find(i => i.fieldData?.slug === s);
  console.log(s + '\n  name: ' + it.fieldData.name + '\n  meta [' + it.fieldData['post-summary'].length + 'ch]: ' + it.fieldData['post-summary'] + '\n');
}
