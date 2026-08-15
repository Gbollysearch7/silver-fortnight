import { readFileSync, writeFileSync } from 'fs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
const calcs = JSON.parse(readFileSync('data/calculators.json','utf8'));
const done = ['risk-reward-ratio-calculator']; // already fixed in test
const todo = Object.keys(calcs).filter(s=>!done.includes(s));

let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}

const backup=[], ids=[];
for(const slug of todo){
  const it=all.find(x=>x.fieldData.slug===slug);
  if(!it){console.log('? not found',slug);continue;}
  const curBody=it.fieldData['post-body']||'';
  backup.push({slug,id:it.id,body:curBody});
}
writeFileSync('data/seo-fixes/backup-calcs-all.json',JSON.stringify(backup,null,2));

let ok=0;
for(const slug of todo){
  const it=all.find(x=>x.fieldData.slug===slug);
  if(!it)continue;
  const curBody=it.fieldData['post-body']||'';
  // replace dead iframe figure with native calc; fall back to replacing bare iframe
  let newBody=curBody.replace(/<figure[^>]*data-rt-type="video"[\s\S]*?<\/figure>/i, calcs[slug]);
  if(newBody===curBody) newBody=curBody.replace(/<iframe[^>]*wrapifai[^>]*><\/iframe>/i, calcs[slug]);
  if(newBody===curBody){console.log('✗ no iframe matched',slug);continue;}
  try{
    await updateItem(it.id,{'post-body':newBody});
    const after=await getItem(it.id);
    const good=(after.fieldData['post-body']||'').includes('id="tyCalc"')&&!(after.fieldData['post-body']||'').includes('wrapifai');
    if(good){ok++;ids.push(it.id);console.log('✅',slug);}else console.log('❌ verify failed',slug);
  }catch(e){console.log('❌',slug,e.message);}
}
if(ids.length){await publishItems(ids);console.log(`\nPublished ${ids.length}. ${ok}/${todo.length} fixed.`);}
