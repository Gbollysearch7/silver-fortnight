import { getKeywordMetrics } from '../lib/seranking.mjs';
// pilot: thin posts with a clear target keyword
const pilots=[
  {slug:'prop-firm-challenge-discount-codes-2026-active-deals-568fc',kw:'prop firm challenge discount codes'},
  {slug:'why-your-trading-strategy-fails-and-the-5-step-fix-every-pro-uses-z3l7z',kw:'why trading strategies fail'},
  {slug:'five-pro-moves-to-help-you-join-the-top-10-of-investors',kw:'how to be a top trader'},
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let metrics=[];
for(let t=0;t<3;t++){try{metrics=await getKeywordMetrics(pilots.map(p=>p.kw),{source:'us'});break;}catch(e){if(/too many/.test(e.message)){await sleep(8000);}else{console.log('err',e.message);break;}}}
const vol={};metrics.forEach(m=>{vol[(m.keyword||'').toLowerCase()]={v:m.volume,kd:m.difficulty};});
console.log('=== PILOT KEYWORD DATA (what depth is needed to rank) ===\n');
pilots.forEach(p=>{const d=vol[p.kw.toLowerCase()]||{};console.log(p.slug.slice(0,40));console.log('  target: "'+p.kw+'"  vol:'+(d.v??'?')+'  KD:'+(d.kd??'?'));});
