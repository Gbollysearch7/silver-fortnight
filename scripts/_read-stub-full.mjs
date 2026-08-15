import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const it=all.find(x=>/payout-schedule-timeline/i.test(x.fieldData.slug));
console.log('id:',it.id);
console.log('FULL body:\n'+(it.fieldData['post-body']||''));
