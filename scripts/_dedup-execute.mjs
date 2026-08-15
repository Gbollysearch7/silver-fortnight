import { readFileSync, writeFileSync } from 'fs';
import { getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY } from '../lib/config.mjs';
const COLLECTION='67b4bd39747043c9b6d29c6e';
const API='https://api.webflow.com/v2';
const DRY=process.argv.includes('--dry-run');
const plan=JSON.parse(readFileSync('data/dedup-plan-final.json','utf8'));
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';

async function wf(path,opts={}){return fetch(API+path,{...opts,headers:{Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0',...(opts.headers||{})}});}

// 1. FULL backup of every kill target (entire item, so reversible)
const backup=[];
for(const p of plan){for(const k of p.kill){
  try{const it=await getItem(k.id);backup.push({base:p.base,keeper:p.keep.slug,killed:k.slug,id:k.id,item:it});}catch(e){console.log('backup err',k.slug,e.message);}
}}
writeFileSync('data/seo-fixes/backup-dedup-'+ts+'.json',JSON.stringify(backup,null,2));
console.log('Backed up',backup.length,'items to data/seo-fixes/backup-dedup-'+ts+'.json\n');

let ok=0;
for(const p of plan){for(const k of p.kill){
  if(DRY){console.log('[DRY] unpublish',k.slug,'→ keeper',p.keep.slug);continue;}
  // remove from LIVE site (keeps CMS item recoverable). IDs go in BODY as {items:[{id}]}
  const res=await wf(`/collections/${COLLECTION}/items/live`,{method:'DELETE',body:JSON.stringify({items:[{id:k.id}]})});
  if(res.ok){ok++;console.log('✅ unpublished (live removed):',k.slug);}
  else{
    const r2=await wf(`/collections/${COLLECTION}/items/live`,{method:'DELETE',body:JSON.stringify({itemIds:[k.id]})});
    if(r2.ok){ok++;console.log('✅ unpublished:',k.slug);}
    else console.log('⚠ failed:',k.slug,res.status,(await res.text()).slice(0,100));
  }
  await new Promise(r=>setTimeout(r,1100));
}}
console.log(`\n${DRY?'[DRY] ':''}${ok}/${backup.length} unpublished. Keepers untouched.`);
