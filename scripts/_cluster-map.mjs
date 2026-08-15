import { readFileSync } from 'fs';
const v = JSON.parse(readFileSync('data/query-volumes.json','utf8'));
const all = v.all.filter(m => m.volume > 0);

// Define clusters by theme keyword in the query
const clusters = {
  'PILLAR: Best Prop Firms (head terms)': /^(best |top )?prop ?firms?$|^prop trading firms?$|^proprietary trading firms?$|^best prop (trading )?firms?$|^top prop firms?$/i,
  'PILLAR: What Is a Prop Firm / How They Work': /what (is|are).*prop|how (do|does).*prop firm.*work|prop firm meaning|prop trading explained|prop firm.*explained/i,
  'PILLAR: Prop Firm Demo / Practice Accounts': /demo|practice|practise/i,
  'CLUSTER: Day Trading': /day trad/i,
  'CLUSTER: Profit Split': /profit split/i,
  'CLUSTER: Country pages': /nigeria|kenya|pakistan|france|belgium|austria|netherland|philippines|europe|usa|india|germany|canada|australia|singapore|malaysia|ireland|italy|south africa|uk|united kingdom/i,
  'CLUSTER: Options/Futures/HFT (instrument)': /option|futures|hft|scalp/i,
  'CLUSTER: Payouts/Withdrawals': /payout|withdraw|refund/i,
};

console.log('=== YOUR CLUSTER MAP (queries you already rank for, by volume) ===\n');
for (const [name, rx] of Object.entries(clusters)) {
  const matches = all.filter(m => rx.test(m.query)).sort((a,b)=>b.volume-a.volume);
  if (!matches.length) continue;
  const vol = matches.reduce((s,m)=>s+m.volume,0);
  console.log(`${name}`);
  console.log(`   ${matches.length} queries · ${vol}/mo combined volume`);
  console.log(`   top: ${matches.slice(0,4).map(m=>`"${m.query}"(${m.volume}, pos${m.position})`).join(', ')}`);
  console.log('');
}
