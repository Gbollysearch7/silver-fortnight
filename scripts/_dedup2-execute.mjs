import { readFileSync } from 'fs';
import { getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
const COLLECTION=blogConfig.webflow.blogCollectionId, API=blogConfig.webflow.apiBase;
const DRY=process.argv.includes('--dry-run');
const plan=JSON.parse(readFileSync('data/dedup-round2-plan.json','utf8'));
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
// backup every kill (full item) first
const kills=plan.flatMap(p=>p.kill.map(k=>({...k,keeper:p.keep.slug})));
const backup=[];
for(const k of kills){try{const it=await getItem(k.id);backup.push({killed:k.slug,keeper:k.keeper,id:k.id,item:it});}catch(e){/*already gone*/}}
import('fs').then(fs=>fs.writeFileSync('data/seo-fixes/backup-dedup2-'+ts+'.json',JSON.stringify(backup,null,2)));
console.log('Backed up',backup.length,'live kill targets\n');
let ok=0,gone=0;
for(const k of kills){
  if(DRY){console.log('[DRY]',k.slug);continue;}
  const d=await fetch(`${API}/collections/${COLLECTION}/items/live`,{method:'DELETE',headers:H,body:JSON.stringify({items:[{id:k.id}]})});
  if(d.status===204){ok++;console.log('✅ unpublished:',k.slug);}
  else if(d.status===404){gone++;/* already unpublished in round 1 */}
  else console.log('⚠',k.slug,d.status,(await d.text()).slice(0,70));
  await new Promise(r=>setTimeout(r,850));
}
console.log(`\n${ok} newly unpublished, ${gone} already gone (round 1). Total dupes removed.`);
