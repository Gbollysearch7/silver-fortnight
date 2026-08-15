import { listItems } from '../lib/webflow.mjs';
import { writeFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// better base: strip trailing -<hex 4-6> repeatedly + trailing -2026/-active variations? No—just strip ONE hex suffix; the real dupes are exact-base + (suffix or not)
const base=s=>(s||'').replace(/-[a-f0-9]{4,6}$/i,'');
const groups={};
for(const it of all){const b=base(it.fieldData.slug);(groups[b]=groups[b]||[]).push(it);}
const skip=['best-prop-firms-in','are-prop-firms'];
const dupes=Object.entries(groups).filter(([b,items])=>items.length>1&&!skip.includes(b));
console.log('Live posts:',all.length,'| duplicate groups now:',dupes.length,'\n');
const out=[];
for(const [b,items] of dupes){
  console.log('"'+b+'":');
  items.forEach(it=>console.log('   '+it.fieldData.slug.padEnd(58)+' '+(it.fieldData['post-body']||'').length+' chars'));
  out.push({base:b,items:items.map(it=>({slug:it.fieldData.slug,id:it.id,len:(it.fieldData['post-body']||'').length}))});
}
writeFileSync('data/dedup-round2.json',JSON.stringify(out,null,2));
console.log('\nTotal extra dupe pages:',out.reduce((s,g)=>s+g.items.length-1,0));
