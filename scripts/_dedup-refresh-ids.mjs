import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const plan=JSON.parse(readFileSync('data/dedup-plan-final.json','utf8'));
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const bySlug={};for(const it of all)bySlug[it.fieldData.slug]=it.id;
const fresh=[];let missing=0;
for(const p of plan){
  const keepId=bySlug[p.keep.slug];
  const kills=p.kill.map(k=>({slug:k.slug,id:bySlug[k.slug]})).filter(k=>{if(!k.id){console.log('GONE (already removed?):',k.slug);missing++;return false;}return true;});
  if(!keepId){console.log('KEEPER MISSING:',p.keep.slug);continue;}
  if(kills.length)fresh.push({base:p.base,keep:{slug:p.keep.slug,id:keepId},kill:kills});
}
writeFileSync('data/dedup-plan-final.json',JSON.stringify(fresh,null,2));
console.log('\nRefreshed. Live kill targets:',fresh.reduce((s,p)=>s+p.kill.length,0),'| already gone:',missing);
