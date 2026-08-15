import { readFileSync } from 'fs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
const COLLECTION=blogConfig.webflow.blogCollectionId;
const API=blogConfig.webflow.apiBase;
const plan=JSON.parse(readFileSync('data/dedup-plan-final.json','utf8'));
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
let ok=0,fail=0;
for(const p of plan){for(const k of p.kill){
  const d=await fetch(`${API}/collections/${COLLECTION}/items/live`,{method:'DELETE',headers:H,body:JSON.stringify({items:[{id:k.id}]})});
  if(d.status===204){ok++;console.log('✅ unpublished from live:',k.slug);}
  else{fail++;console.log('⚠',k.slug,d.status,(await d.text()).slice(0,80));}
  await new Promise(r=>setTimeout(r,900));
}}
console.log(`\n${ok} unpublished, ${fail} failed. (Items kept in CMS — recoverable.)`);
