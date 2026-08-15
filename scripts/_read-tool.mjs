import { listItems } from '../lib/webflow.mjs';
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const it=all.find(x=>x.fieldData.slug==='forex-lot-size-calculator');
const body=it.fieldData['post-body']||'';
console.log('itemId:',it.id);
console.log('--- BODY (raw) ---');
console.log(body);
