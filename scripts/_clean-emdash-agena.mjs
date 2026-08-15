#!/usr/bin/env node
/** Strip em dashes + replace AgenaTrader→Yard platform across all live posts. Backed up. */
import { writeFileSync, mkdirSync } from 'fs';
import { listItems, getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
const COLLECTION=blogConfig.webflow.blogCollectionId, API=blogConfig.webflow.apiBase;
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
const DRY=process.argv.includes('--dry-run');
mkdirSync('data/seo-fixes',{recursive:true});
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';

function clean(t){
  let s=t;
  // dash between NUMERIC RANGES (5–10, $300–$1,000, $10K–$250K, 50%–80%) → "to"; keep numbers intact
  // left side ends in digit or unit letter (K/M/%), right side starts with $ or digit
  s=s.replace(/([\d%KMk])\s*[—–]\s*(\$?[\d])/g,'$1 to $2');
  // em dash between clauses → comma (spaced, or tight between letters); never inside numbers
  s=s.replace(/\s+—\s+/g,', ').replace(/([A-Za-z])—([A-Za-z])/g,'$1, $2').replace(/—/g,', ');
  // remaining en dashes between clauses
  s=s.replace(/\s+–\s+/g,', ').replace(/([A-Za-z])–([A-Za-z])/g,'$1, $2');
  // tidy: double commas, space-before-comma; comma+LETTER gets a space, comma+digit untouched ($500,000 safe)
  s=s.replace(/,\s*,/g,',').replace(/\s+,/g,',').replace(/,([A-Za-z])/g,', $1');
  // AgenaTrader → the Yard platform (preserve "AgenaTrader desktop" → "the Yard platform")
  s=s.replace(/AgenaTrader\s+\(desktop\)/gi,'the Yard platform');
  s=s.replace(/AgenaTrader\s+desktop/gi,'the Yard platform');
  s=s.replace(/AgenaTrader/gi,'the Yard platform');
  // fix doubled "the the Yard"
  s=s.replace(/\bthe the Yard platform\b/gi,'the Yard platform');
  return s;
}

async function retry(fn,n=4){for(let i=0;i<n;i++){try{return await fn();}catch(e){if(i===n-1)throw e;await new Promise(r=>setTimeout(r,1500*(i+1)));}}}
let all=[];for(let off=0;off<400;off+=100){const{items}=await retry(()=>listItems({limit:100,offset:off}));if(!items.length)break;all.push(...items);}
const targets=all.filter(it=>{const b=it.fieldData['post-body']||'';return b.includes('—')||b.includes('–')||/agenatrader/i.test(b)||/agenatrader/i.test(it.fieldData.name||'');});
console.log(`${DRY?'[DRY] ':''}Posts to clean:`,targets.length,'\n');
const backup=[];const ids=[];let ok=0;
for(const it of targets){
  const slug=it.fieldData.slug;
  const fd=it.fieldData;
  const newBody=clean(fd['post-body']||'');
  const newName=clean(fd.name||'');
  const newSummary=clean(fd['post-summary']||'');
  const changed=newBody!==(fd['post-body']||'')||newName!==(fd.name||'')||newSummary!==(fd['post-summary']||'');
  if(!changed)continue;
  backup.push({slug,id:it.id,body:fd['post-body'],name:fd.name,summary:fd['post-summary']});
  if(DRY){
    const em=(fd['post-body']||'').split('—').length-1;
    const ag=/agenatrader/i.test(fd['post-body']||'')?'+Agena':'';
    console.log(`DRY ${slug} (${em} em-dash ${ag})`);
    ids.push(it.id);continue;
  }
  try{
    const cur=await retry(()=>getItem(it.id));
    const r=await retry(()=>fetch(`${API}/collections/${COLLECTION}/items/${it.id}`,{method:'PATCH',headers:H,body:JSON.stringify({isArchived:false,isDraft:false,fieldData:{...cur.fieldData,'post-body':clean(cur.fieldData['post-body']||''),name:clean(cur.fieldData.name||''),'post-summary':clean(cur.fieldData['post-summary']||'')}})}));
    if(r.ok){ok++;ids.push(it.id);console.log('✅',slug);}else console.log('⚠',slug,r.status);
  }catch(e){console.log('err',slug,e.message.slice(0,60));}
  await new Promise(r=>setTimeout(r,700));
}
if(backup.length)writeFileSync(`data/seo-fixes/backup-emdash-agena-${ts}.json`,JSON.stringify(backup,null,2));
if(!DRY&&ids.length){for(let i=0;i<ids.length;i+=50){await retry(()=>fetch(`${API}/collections/${COLLECTION}/items/publish`,{method:'POST',headers:H,body:JSON.stringify({itemIds:ids.slice(i,i+50)})}));}console.log(`\n${ok} cleaned + published.`);}
else if(DRY)console.log(`\n[DRY] ${ids.length} would be cleaned.`);
