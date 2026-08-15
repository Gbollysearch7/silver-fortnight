import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
let orphan=0,total=all.length,totalInt=0;
for(const it of all){const body=it.fieldData['post-body']||'';const internal=[...body.matchAll(/href="([^"]+)"/g)].map(m=>m[1]).filter(h=>/tradersyard\.com\/blog-posts\/|^\/blog-posts\//.test(h));totalInt+=internal.length;if(internal.length===0)orphan++;}
console.log('Total posts:',total);
console.log('Orphans (0 internal links):',orphan,'('+Math.round(orphan/total*100)+'%) — was 90 (42%)');
console.log('Avg internal links/post:',(totalInt/total).toFixed(1),'— was 2.0');
