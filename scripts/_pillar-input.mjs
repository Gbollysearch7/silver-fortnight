import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const s=JSON.parse(readFileSync('data/pillar-structure.json','utf8'));
const all=[...s.primary,...s.secondary,s.geo];
// get real supporting page slugs for each pillar (for internal links DOWN)
let live=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;live.push(...items);}
const liveSlugs=new Set(live.map(it=>it.fieldData.slug));
const input=all.map(p=>({
  id:p.id,name:p.name,tier:p.tier,volume:p.volume,
  anchor:p.topQuery?p.topQuery.q:'',
  // supporting pages that actually exist live, for link-down
  supporting:(p.sampleSupport||[]).map(x=>x.split('#')[0]).filter(sl=>liveSlugs.has(sl)).slice(0,6),
}));
writeFileSync('data/pillar-input.json',JSON.stringify(input));
console.log(input.length+' pillars prepared with live supporting links');
input.forEach(p=>console.log('  '+p.name.slice(0,38).padEnd(38)+' → links to '+p.supporting.length+' supporting pages'));
