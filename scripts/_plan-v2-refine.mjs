import { readFileSync, writeFileSync } from 'fs';
const p=JSON.parse(readFileSync('data/plan-v2.json','utf8'));
const b2b=/how to start a prop|start a prop (firm|trading)|white label|prop firm crm|prop firm (software|technology|platform provider|liquidity|broker)|liquidity provider|automate marketing|matching engine|become a prop firm|open a prop firm|prop firm for sale|launch a prop firm|risk management software|prop firm business|prop firm company/i;
const isB2B=k=>b2b.test(k.kw);

const netNew=p.enriched.filter(k=>!k.exists && !isB2B(k));
const excluded=p.enriched.filter(k=>!k.exists && isB2B(k));

// re-wave (easy-first)
const wave=k=>k.kd<=10?'Wave 1 — Quick Wins (KD 0-10)':k.kd<=20?'Wave 2 — Easy (KD 11-20)':k.kd<=30?'Wave 3 — Medium (KD 21-30)':'Wave 4 — Competitive (KD 31+)';
const waves={'Wave 1 — Quick Wins (KD 0-10)':[],'Wave 2 — Easy (KD 11-20)':[],'Wave 3 — Medium (KD 21-30)':[],'Wave 4 — Competitive (KD 31+)':[]};
for(const k of netNew)waves[wave(k)].push(k);
for(const w of Object.values(waves))w.sort((a,b)=>a.kd-b.kd||b.vol-a.vol);

// also group each wave by pillar (so architecture is preserved within the easy-first ordering)
const byWavePillar={};
for(const [w,arr] of Object.entries(waves)){
  byWavePillar[w]={};
  for(const k of arr){(byWavePillar[w][k.pillar] ||= []).push(k);}
}
writeFileSync('data/plan-v2-final.json',JSON.stringify({netNew:netNew.length,excludedB2B:excluded.length,waves,byWavePillar,enriched:p.enriched},null,2));
console.log('=== PLAN VIEW 2 (refined, easy-first) ===\n');
console.log('Net-new content pages:',netNew.length,'(excluded',excluded.length,'B2B/operator queries)\n');
for(const [w,arr] of Object.entries(waves)){
  if(!arr.length)continue;
  console.log(`${w}: ${arr.length} pages · ${arr.reduce((s,k)=>s+k.vol,0).toLocaleString()}/mo`);
  // pillar breakdown
  const pc={};arr.forEach(k=>pc[k.pillar]=(pc[k.pillar]||0)+1);
  Object.entries(pc).sort((a,b)=>b[1]-a[1]).forEach(([pl,c])=>console.log('     '+String(c).padStart(3)+'  '+pl));
}
