import { listItems } from '../lib/webflow.mjs';
import { readFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const manifest=JSON.parse(readFileSync('data/blog-corpus-manifest.json','utf8'));
// posts still flat (no <details> but have FAQ heading)
const stillFlat=[];
for(const it of all){
  const b=it.fieldData['post-body']||'';
  if(/frequently asked|faq/i.test(b)&&!/<details/i.test(b)) stillFlat.push(it);
}
console.log('Posts still with flat FAQ:',stillFlat.length,'\n');
// show the FAQ markup of first 3 to understand the variant
for(const it of stillFlat.slice(0,3)){
  const b=it.fieldData['post-body']||'';
  const i=b.search(/<h2[^>]*>[^<]*(frequently asked|faq)/i);
  console.log('=== '+it.fieldData.slug+' ===');
  console.log(b.slice(i,i+400).replace(/\n/g,' '));
  console.log('');
}
