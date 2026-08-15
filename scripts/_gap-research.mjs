import { getKeywordMetrics } from '../lib/seranking.mjs';
import { readFileSync, writeFileSync } from 'fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Keywords competitor templates target that we should check volume on (programmatic candidates)
const candidates=[
  // platform pages
  'prop firms that use mt5','prop firms that use ctrader','prop firms that use mt4','prop firms with tradingview',
  // asset/instrument pages
  'crypto prop firms','stock prop firms','indices prop firms','gold prop firms',
  // challenge-type pages
  'instant funding prop firms','one step prop firms','two step prop firms','no time limit prop firms',
  // practice/feature pages
  'prop firms that allow ea','prop firms that allow news trading','prop firms that allow weekend holding',
  'prop firms with no minimum trading days','cheapest prop firms','prop firms with scaling plan',
  // what we already rank — for gap comparison
  'prop firm demo account','best prop firms','no trailing drawdown prop firm',
];
let metrics=[];
for(let t=0;t<3;t++){ try{ metrics=await getKeywordMetrics(candidates,{source:'us'}); break; }catch(e){ if(/too many/.test(e.message)){await sleep(8000);} else throw e; } }
const vol={}; metrics.forEach(m=>{vol[(m.keyword||'').toLowerCase()]={v:m.volume,kd:m.difficulty};});
const rows=candidates.map(k=>({kw:k,vol:vol[k.toLowerCase()]?.v??null,kd:vol[k.toLowerCase()]?.kd??null})).filter(r=>r.vol).sort((a,b)=>b.vol-a.vol);
writeFileSync('data/gap-research.json',JSON.stringify(rows,null,2));
console.log('=== PROGRAMMATIC PAGE CANDIDATES (with real volume) ===\n');
rows.forEach(r=>console.log(`  ${String(r.vol).padStart(4)}/mo  KD:${String(r.kd??'-').padStart(2)}  ${r.kw}`));
console.log('\nTotal addressable volume:',rows.reduce((s,r)=>s+r.vol,0)+'/mo across '+rows.length+' templatable pages');
