import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const it=all.find(x=>/payout-schedule-timeline/i.test(x.fieldData.slug));
console.log('slug:',it.fieldData.slug);
console.log('title:',it.fieldData.name);
console.log('--- body ---');
console.log((it.fieldData['post-body']||'').slice(0,900));
