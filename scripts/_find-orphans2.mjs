import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const orphans=[];
for(const it of all){
  const body=it.fieldData['post-body']||'';
  const internal=[...body.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(h=>/tradersyard\.com\/blog-posts\/|^\/blog-posts\//.test(h));
  if(internal.length===0) orphans.push({slug:it.fieldData.slug,id:it.id,words:body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length,hasRelated:body.includes('ty-related')});
}
console.log('Remaining orphans:',orphans.length);
orphans.forEach(o=>console.log('  '+o.slug+'  ('+o.words+'w, has Related block: '+o.hasRelated+')'));
