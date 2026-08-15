import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const domains={};const samples=[];
for(const it of all){
  const b=it.fieldData['post-body']||'';
  const imgs=[...b.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m=>m[1]);
  for(const u of imgs){
    let host='(relative)';try{host=new URL(u).host;}catch{}
    domains[host]=(domains[host]||0)+1;
    if(samples.length<12)samples.push({slug:it.fieldData.slug,url:u.slice(0,90)});
  }
}
console.log('=== in-article image hosts ===');
Object.entries(domains).sort((a,b)=>b[1]-a[1]).forEach(([h,n])=>console.log('  '+String(n).padStart(3)+'  '+h));
console.log('\n=== sample image URLs ===');
samples.forEach(s=>console.log('  '+s.slug.slice(0,30)+'  →  '+s.url));
