import { discoverKeywords } from '../lib/seranking.mjs';
import { writeFileSync } from 'fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const seeds=['prop firm for beginners','prop firm comparison','prop firm payout','prop firm rules','forex prop firm','futures prop firm'];
const out={};
console.log('=== PROGRAMMATIC PATTERN RESEARCH ===\n');
for(const seed of seeds){
  let ok=false;
  for(let try_=0;try_<3&&!ok;try_++){
    try{
      const r=await discoverKeywords(seed,'related',{limit:50,filters:{volume:[10,3000]}});
      const kws=(r.keywords||r||[]).filter(k=>k.volume).sort((a,b)=>b.volume-a.volume);
      out[seed]=kws.map(k=>({kw:k.keyword,vol:k.volume,kd:k.difficulty}));
      const total=kws.reduce((s,k)=>s+(k.volume||0),0);
      console.log(`"${seed}" → ${kws.length} kws, ${total} vol`);
      kws.slice(0,5).forEach(k=>console.log(`   ${String(k.volume).padStart(4)}  KD:${String(k.difficulty??'-').padStart(2)}  ${k.keyword}`));
      console.log('');
      ok=true;
    }catch(e){ if(/too many/.test(e.message)){await sleep(8000);} else {console.log(`  "${seed}": ${e.message}`);break;} }
  }
  await sleep(5000);
}
writeFileSync('data/prog-research.json',JSON.stringify(out,null,2));
console.log('saved data/prog-research.json');
