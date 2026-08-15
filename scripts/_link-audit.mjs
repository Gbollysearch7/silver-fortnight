import { listItems } from '../lib/webflow.mjs';
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
console.log('Total live posts:',all.length,'\n');
let totalInt=0,totalExt=0,noInt=0;
const sample=[];
for(const it of all){
  const body=it.fieldData['post-body']||'';
  const links=[...body.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
  const internal=links.filter(h=>/tradersyard\.com\/blog-posts\/|^\/blog-posts\//.test(h));
  const external=links.filter(h=>/^https?:\/\//.test(h)&&!/tradersyard\.com/.test(h));
  totalInt+=internal.length;totalExt+=external.length;
  if(internal.length===0)noInt++;
  sample.push({slug:it.fieldData.slug,int:internal.length,ext:external.length});
}
sample.sort((a,b)=>a.int-b.int);
console.log('=== LINK FOOTPRINT ===');
console.log('Avg internal links/post:',(totalInt/all.length).toFixed(1));
console.log('Avg external links/post:',(totalExt/all.length).toFixed(1));
console.log('Posts with ZERO internal links:',noInt,'('+Math.round(noInt/all.length*100)+'%)');
console.log('\n=== 10 most under-linked posts (need links most) ===');
sample.slice(0,10).forEach(s=>console.log('  int:'+String(s.int).padStart(2)+' ext:'+String(s.ext).padStart(2)+'  '+s.slug.slice(0,46)));
