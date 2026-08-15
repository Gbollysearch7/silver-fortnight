import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createItem, getItem, publishItems } from '../lib/webflow.mjs';
mkdirSync('data/seo-fixes',{recursive:true});
const pages = JSON.parse(readFileSync('data/netnew-final.json','utf8'));
let created={}; try{created=JSON.parse(readFileSync('data/netnew-published.json','utf8'));}catch{}
const toDo = pages.filter(p=>!created[p.id]);
console.log(`${toDo.length} net-new pages to create\n`);
const results=[];
for(const p of toDo){
  try{
    const item=await createItem({name:p.title,slug:p.id,'post-body':p.html,'post-summary':p.meta,'feature-post':false},{isDraft:false});
    const after=await getItem(item.id);
    const ok=(after.fieldData['post-body']||'').includes(p.h2s[0]);
    created[p.id]={itemId:item.id,slug:p.id,title:p.title};
    results.push({id:p.id,itemId:item.id,ok});
    console.log(`${ok?'✅ created+verified':'⚠ created'}  ${p.id}  → ${item.id}`);
  }catch(e){console.log(`❌ ${p.id} — ${e.message}`);results.push({id:p.id,ok:false});}
}
writeFileSync('data/netnew-published.json',JSON.stringify(created,null,2));
const ids=results.filter(r=>r.itemId).map(r=>r.itemId);
if(ids.length){await publishItems(ids);console.log(`\nPublished ${ids.length} to live domain.`);}
