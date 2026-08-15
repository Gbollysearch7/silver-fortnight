import { listItems } from '../lib/webflow.mjs';
import { writeFileSync, readFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const base=s=>(s||'').replace(/-[a-z0-9]{4,6}$/i,'');
const groups={};
for(const it of all){const b=base(it.fieldData.slug);(groups[b]=groups[b]||[]).push(it);}
// REAL dupes = same base AND not the geo/question families
const skipFamilies=['best-prop-firms-in','are-prop-firms'];
const dupes=Object.entries(groups).filter(([b,items])=>items.length>1 && !skipFamilies.includes(b));
// GSC: which version gets impressions? load if available
let gsc={};try{gsc=JSON.parse(readFileSync('data/gsc-by-slug.json','utf8'));}catch{}
const plan=[];
for(const [b,items] of dupes){
  // keeper heuristic: clean slug (no suffix) preferred IF it has >= content; else more content wins
  const scored=items.map(it=>{
    const body=it.fieldData['post-body']||'';
    const suffixed=/-[a-z0-9]{4,6}$/i.test(it.fieldData.slug);
    return {slug:it.fieldData.slug,id:it.id,len:body.length,suffixed};
  });
  // prefer: longer body; tie-break clean slug
  scored.sort((a,b2)=>b2.len-a.len || (a.suffixed?1:-1));
  const keep=scored[0], kill=scored.slice(1);
  plan.push({base:b,keep:{slug:keep.slug,id:keep.id,len:keep.len},kill:kill.map(k=>({slug:k.slug,id:k.id,len:k.len}))});
}
writeFileSync('data/dedup-plan.json',JSON.stringify(plan,null,2));
console.log('=== DEDUP PLAN (keep longest/cleanest, unpublish rest) ===\n');
for(const p of plan){
  console.log('KEEP  '+p.keep.slug+'  ('+p.keep.len+' chars)');
  for(const k of p.kill)console.log('  KILL '+k.slug+'  ('+k.len+' chars)  → redirect to keeper');
  console.log('');
}
console.log('Pairs:',plan.length,'| Pages to unpublish:',plan.reduce((s,p)=>s+p.kill.length,0));
