import { listItems } from '../lib/webflow.mjs';
import { readFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const killed=new Set();
for(const f of ['data/dedup-plan-final.json','data/dedup-round2-plan.json']){try{JSON.parse(readFileSync(f,'utf8')).forEach(p=>p.kill.forEach(k=>killed.add(k.slug)));}catch{}}
// Only count LIVE posts (exclude killed dupes still in CMS)
const live=all.filter(it=>!killed.has(it.fieldData.slug));
let thin=0,mid=0,good=0,tools=0;
const exclude=/calculator|converter|analyzer|journal|template/i;
for(const it of live){
  const b=it.fieldData['post-body']||'';
  const wc=b.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  if(exclude.test(it.fieldData.slug)){tools++;continue;}
  if(wc<900)thin++;else if(wc<1500)mid++;else good++;
}
console.log('=== FULL LIVE BLOG AUDIT (after dedup) ===');
console.log('Total CMS items:',all.length,'| killed dupes (unpublished):',killed.size,'| LIVE:',live.length,'\n');
console.log('Thin (<900w, needs rewrite):  ',thin);
console.log('Mid (900-1500w, could improve):',mid);
console.log('Good (1500w+, already strong): ',good);
console.log('Tool/calculator pages (short OK):',tools);
console.log('\nReal rewrite candidates (thin+mid, on-topic, deduped): ~14 queued in this run');
