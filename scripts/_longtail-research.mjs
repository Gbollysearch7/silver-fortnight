import { discoverKeywords } from '../lib/seranking.mjs';
import { writeFileSync } from 'fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Templatable seed patterns for programmatic pages
const seeds=['prop firms that allow','prop firm for','best prop firm for','prop firms with','can you'];
const out={};
console.log('=== LONG-TAIL / PROGRAMMATIC PATTERNS ===\n');
for(const seed of seeds){
  let ok=false;
  for(let t=0;t<3&&!ok;t++){
    try{
      const r=await discoverKeywords(seed,'longtail',{limit:50});
      let kws=(r.keywords||r||[]);
      if(Array.isArray(kws)) kws=kws.filter(k=>k.volume).sort((a,b)=>(b.volume||0)-(a.volume||0));
      out[seed]=kws.map(k=>({kw:k.keyword,vol:k.volume,kd:k.difficulty}));
      console.log(`"${seed}..." → ${kws.length} long-tail`);
      kws.slice(0,8).forEach(k=>console.log(`   ${String(k.volume||0).padStart(4)}  ${k.keyword}`));
      console.log('');
      ok=true;
    }catch(e){ if(/too many/.test(e.message)){await sleep(8000);} else {console.log(`  "${seed}": ${e.message}`);break;} }
  }
  await sleep(5000);
}
writeFileSync('data/longtail-research.json',JSON.stringify(out,null,2));
console.log('saved');
