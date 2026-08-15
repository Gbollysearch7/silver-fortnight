import { readFileSync } from 'fs';
import { getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
const COLLECTION=blogConfig.webflow.blogCollectionId; // CORRECT id from config
const API=blogConfig.webflow.apiBase;
const DRY=process.argv.includes('--dry-run');
const plan=JSON.parse(readFileSync('data/dedup-plan-final.json','utf8'));
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
console.log('Using collection:',COLLECTION,'\n');
let ok=0,fail=0,ids=[];
for(const p of plan){for(const k of p.kill){
  if(DRY){console.log('[DRY] draft:',k.slug);continue;}
  try{
    const it=await getItem(k.id);
    const r=await fetch(`${API}/collections/${COLLECTION}/items/${k.id}`,{method:'PATCH',headers:H,body:JSON.stringify({isDraft:true,isArchived:false,fieldData:it.fieldData})});
    if(r.ok){ok++;ids.push(k.id);console.log('✅ drafted:',k.slug);}
    else{fail++;console.log('⚠',k.slug,r.status,(await r.text()).slice(0,80));}
  }catch(e){fail++;console.log('err',k.slug,e.message.slice(0,70));}
  await new Promise(r=>setTimeout(r,900));
}}
if(!DRY&&ids.length){
  const pr=await fetch(`${API}/collections/${COLLECTION}/items/publish`,{method:'POST',headers:H,body:JSON.stringify({itemIds:ids})});
  console.log('\npublish (drop drafts from live):',pr.status, pr.ok?'OK':(await pr.text()).slice(0,80));
}
console.log(`\n${ok} drafted + unpublished, ${fail} failed.`);
