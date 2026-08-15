import { getItem, updateItem, publishItems, listItems } from '../lib/webflow.mjs';
import { writeFileSync } from 'fs';
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const dS='border-bottom: 1px solid #2d2d44; padding: 16px 0;';
const sS='font-weight: 600; font-size: 16px; cursor: pointer; color: #e2e8f0; list-style: none; display: flex; justify-content: space-between; align-items: center;';
const iS='color: #4250eb; font-size: 20px;';
const aS='padding: 12px 0 4px 0; color: #94a3b8; font-size: 15px; line-height: 1.7;';
const mk=(q,a)=>`<details style="${dS}">\n<summary style="${sS}">\n${q}\n<span style="${iS}">+</span>\n</summary>\n<div style="${aS}">\n${a}\n</div>\n</details>\n`;

function convert(body){
  if(/<details/i.test(body))return {body,converted:0};
  const fm=body.match(/<h2[^>]*>\s*(frequently asked questions|faqs?|common questions)[^<]*<\/h2>/i);
  if(!fm)return {body,converted:0};
  const start=body.indexOf(fm[0])+fm[0].length;
  const after=body.slice(start);const nh=after.search(/<h2[^>]*>/i);
  const block=nh>-1?after.slice(0,nh):after;const tail=nh>-1?after.slice(nh):'';
  const paras=[...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>m[1].trim());
  let out='',n=0,pendingQ=null;
  for(let raw of paras){
    const txt=raw.replace(/<\/?strong>/gi,'').trim();
    // Variant: "Q: question" alone (answer in next <p> as "A: ...")
    const qOnly=txt.match(/^Q:\s*(.+?)\??\s*$/i);
    const aOnly=txt.match(/^A:\s*([\s\S]+)$/i);
    const qAndA=txt.match(/^Q:\s*([\s\S]*?\?)\s*(?:A:\s*)?([\s\S]+)$/i);
    if(pendingQ && aOnly){ out+=mk(pendingQ,'<p>'+aOnly[1].trim()+'</p>'); n++; pendingQ=null; continue; }
    if(qOnly && !/\?[\s\S]+/.test(txt.replace(/^Q:\s*/i,''))){ pendingQ=qOnly[1].trim(); continue; }
    if(qAndA){ const q=qAndA[1].replace(/<[^>]+>/g,'').trim(); const a=qAndA[2].trim(); if(q&&a){out+=mk(q,'<p>'+a+'</p>');n++;continue;} }
    // Q ending with ? then answer runs on (no A:)
    const split=txt.match(/^Q:\s*([\s\S]*?\?)\s*([\s\S]+)$/i);
    if(split){out+=mk(split[1].replace(/<[^>]+>/g,'').trim(),'<p>'+split[2].trim()+'</p>');n++;continue;}
  }
  if(!n)return {body,converted:0};
  return {body:body.slice(0,start)+'\n'+out+tail,converted:n};
}

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const targets=all.filter(it=>{const b=it.fieldData['post-body']||'';return /frequently asked|faq/i.test(b)&&!/<details/i.test(b);});
console.log(`${targets.length} posts remaining\n`);
const backup=[],ids=[];let ok=0;
for(const it of targets){
  const body=it.fieldData['post-body']||'';const {body:nb,converted}=convert(body);
  if(!converted){console.log('· manual review needed:',it.fieldData.slug);continue;}
  backup.push({slug:it.fieldData.slug,id:it.id,body});
  if(DRY){console.log('DRY '+it.fieldData.slug+' ('+converted+')');ids.push(it.id);continue;}
  try{await updateItem(it.id,{'post-body':nb});const af=await getItem(it.id);if((af.fieldData['post-body']||'').includes('<details')){ok++;ids.push(it.id);console.log('✅ '+it.fieldData.slug+' ('+converted+')');}}catch(e){console.log('err',e.message);}
}
if(backup.length)writeFileSync('data/seo-fixes/backup-faq3.json',JSON.stringify(backup,null,2));
if(!DRY&&ids.length){await publishItems(ids);console.log(`\n${ok} converted + published.`);}else if(DRY)console.log(`\n[DRY] ${ids.length} would convert.`);
