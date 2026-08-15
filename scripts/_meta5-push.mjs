import { writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';
const U = {
  'which-prop-trading-firms-offer-direct-funding': 'Which prop trading firms offer direct funding with no challenge? How instant funding works, what it costs, and the trade-offs to weigh before you pay.',
  'trading-challenge-profit-target-formula-explained': 'A trading challenge profit target is starting balance times the target percent. See the formula, dollar examples, phase percentages, and the rules that count.',
  'funded-trader-scaling-plan-strategy-how-to-grow-your-account': 'A funded trader scaling plan grows your account balance and profit split as you stay consistent. See how scaling works, the rules, and a progression table.',
  'prop-firm-payout-schedule-timeline-when-do-you-get-paid': 'Prop firm payout schedule explained: payout frequency, first-payout timeline, eligibility gates, processing time, methods, and when you actually get paid.',
  'do-prop-firms-allow-scalping': 'Prop firms that allow scalping in 2026: the minimum hold time, microscalping, EA/bot, news and consistency rules that decide if your strategy survives.',
};
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
for (const [slug, meta] of Object.entries(U)) {
  const it = all.find(i => i.fieldData?.slug === slug);
  writeFileSync(`data/seo-fixes/backup-meta5-${slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, { 'post-summary': meta });
  await publishItems([it.id]);
  console.log('PUSHED', slug, '[' + meta.length + 'ch]');
}
