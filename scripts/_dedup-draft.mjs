import { readFileSync } from 'fs';
import { getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY } from '../lib/config.mjs';
const COLLECTION='67b4bd39747043c9b6d29c6e';
const API='https://api.webflow.com/v2';
const DRY=process.argv.includes('--dry-run');
const plan=JSON.parse(readFileSync('data/dedup-plan-final.json','utf8'));
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};

let ok=0,fail=0,ids=[];
for(const p of plan){for(const k of p.kill){
  if(DRY){console.log('[DRY] set draft:',k.slug);continue;}
  try{
    const it=await getItem(k.id); // proven-working fetch
    const r=await fetch(`${API}/collections/${COLLECTION}/items/${k.id}`,{method:'PATCH',headers:H,body:JSON.stringify({isDraft:true,isArchived:false,fieldData:it.fieldData})});
    if(r.ok){ok++;ids.push(k.id);console.log('✅ drafted:',k.slug);}
    else{fail++;console.log('⚠',k.slug,r.status,(await r.text()).slice(0,90));}
  }catch(e){fail++;console.log('err',k.slug,e.message.slice(0,80));}
  await new Promise(r=>setTimeout(r,900));
}}
// publish the collection so drafts drop off the live site
if(!DRY&&ids.length){
  const pr=await fetch(`${API}/collections/${COLLECTION}/items/publish`,{method:'POST',headers:H,body:JSON.stringify({itemIds:ids})});
  console.log('\npublish step:',pr.status);
}
console.log(`\n${ok} drafted, ${fail} failed.`);
