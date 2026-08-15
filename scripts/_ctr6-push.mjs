import { writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

const UPDATES = {
  'prop-firm-demo-account-practice-best-platforms': {
    name: 'Prop Firm Demo Accounts: Free Practice & Funded Demos 2026',
    'post-summary': 'Most prop firm challenges run on a demo account. How prop firm demo accounts work, whether a funded demo account exists, and where to practice free in 2026.',
  },
  'best-prop-firms-for-day-trading-in-2026': {
    name: 'Best Prop Firms for Day Traders in 2026: Ranked & Reviewed',
    'post-summary': 'We ranked the best prop firms for day trading in 2026: no minimum trading days, fast payouts, and the funded accounts worth your fee. See which firm wins.',
  },
  'how-many-people-get-payouts-from-prop-firms': {
    'post-summary': 'Yes, prop firms really pay out, but most traders never reach one. How often do prop firms pay out, the real pass rates, and who actually gets paid in 2026.',
  },
  'which-prop-firm-gives-real-account': {
    name: 'Which Prop Firms Give Real Capital? Real vs Demo Accounts',
  },
};

let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }

for (const [slug, fields] of Object.entries(UPDATES)) {
  const it = all.find(i => i.fieldData?.slug === slug);
  if (!it) { console.log('MISSING:', slug); continue; }
  writeFileSync(`data/seo-fixes/backup-ctr6-${slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, fields);
  await publishItems([it.id]);
  console.log('PUSHED:', slug);
  for (const [k, v] of Object.entries(fields)) console.log(`   ${k}: ${v.slice(0, 80)}${v.length > 80 ? '…' : ''} [${v.length}ch]`);
}
console.log('\nDone.');
