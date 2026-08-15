import { readFileSync } from 'fs';
import { getItem, updateItem, publishItems } from '../lib/webflow.mjs';
const calcs = JSON.parse(readFileSync('data/calculators.json','utf8'));
const slug='risk-reward-ratio-calculator';
// find item
import { listItems } from '../lib/webflow.mjs';
let id=null,curBody='';
for(let off=0;off<400&&!id;off+=100){const{items}=await listItems({limit:100,offset:off});const it=items.find(x=>x.fieldData.slug===slug);if(it){id=it.id;curBody=it.fieldData['post-body']||'';}}
console.log('itemId:',id);
// replace the dead figure/iframe with native calc
const newBody = curBody.replace(/<figure[^>]*data-rt-type="video"[\s\S]*?<\/figure>/i, calcs[slug]);
const changed = newBody!==curBody;
console.log('iframe figure replaced:', changed);
if(!changed){ console.log('!! pattern did not match — inspecting start of body:'); console.log(curBody.slice(0,200)); process.exit(1); }
// backup
import { writeFileSync } from 'fs';
writeFileSync('data/seo-fixes/backup-calc-test.json',JSON.stringify({slug,id,body:curBody},null,2));
await updateItem(id,{'post-body':newBody});
await publishItems([id]);
const after=await getItem(id);
console.log('Has native calc id after write:', (after.fieldData['post-body']||'').includes('id="tyCalc"'));
console.log('Still has dead wrapifai iframe:', (after.fieldData['post-body']||'').includes('wrapifai'));
