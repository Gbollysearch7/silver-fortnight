import { readFileSync } from 'fs';
const d = JSON.parse(readFileSync('data/ctr-foundation.json','utf8'));
const missing = d.find(p=>!p.itemId);
if (missing) console.log(`!! NOT IN WEBFLOW: ${missing.slug}\n`);
d.forEach((p,i)=>{
  console.log(`${String(i+1).padStart(2)}. ${p.slug}  [pos ${p.position} · CTR ${p.ctr}% · -${p.lostClicks} clk · ${p.titleLen}ch title]`);
  console.log(`    NOW: "${p.currentTitle}"`);
  console.log(`    META(${p.summaryLen}): "${p.currentSummary.slice(0,110)}${p.currentSummary.length>110?'…':''}"`);
  console.log(`    QRY: ${p.topQueries.slice(0,4).map(q=>`"${q.q}"`).join(' | ') || '(none)'}`);
  console.log('');
});
