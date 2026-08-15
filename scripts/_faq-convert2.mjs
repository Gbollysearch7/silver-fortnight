import { getItem, updateItem, publishItems, listItems } from '../lib/webflow.mjs';
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const detailsStyle='border-bottom: 1px solid #2d2d44; padding: 16px 0;';
const summaryStyle='font-weight: 600; font-size: 16px; cursor: pointer; color: #e2e8f0; list-style: none; display: flex; justify-content: space-between; align-items: center;';
const iconStyle='color: #4250eb; font-size: 20px;';
const answerStyle='padding: 12px 0 4px 0; color: #94a3b8; font-size: 15px; line-height: 1.7;';

function convertQA(body){
  if(/<details/i.test(body))return {body,converted:0};
  const faqMatch=body.match(/<h2[^>]*>\s*(frequently asked questions|faqs?|common questions)[^<]*<\/h2>/i);
  if(!faqMatch)return {body,converted:0};
  const faqStart=body.indexOf(faqMatch[0])+faqMatch[0].length;
  const after=body.slice(faqStart);
  const nextH2=after.search(/<h2[^>]*>/i);
  const faqBlock=nextH2>-1?after.slice(0,nextH2):after;
  const tail=nextH2>-1?after.slice(nextH2):'';
  // each <p> contains Q: ... A: ...  (Q may be inside <strong>)
  const paras=[...faqBlock.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
  let dropdowns='',n=0;
  for(const [,raw] of paras){
    const txt=raw.replace(/<\/?strong>/gi,'').trim();
    // split on "A:" — question before, answer after. Q: prefix optional.
    const m=txt.match(/^Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*)$/i);
    if(!m)continue;
    const q=m[1].replace(/<[^>]+>/g,'').trim();
    const a=m[2].trim();
    if(!q||!a)continue;
    dropdowns+=`<details style="${detailsStyle}">\n<summary style="${summaryStyle}">\n${q}\n<span style="${iconStyle}">+</span>\n</summary>\n<div style="${answerStyle}">\n<p>${a}</p>\n</div>\n</details>\n`;
    n++;
  }
  if(!n)return {body,converted:0};
  return {body:body.slice(0,faqStart)+'\n'+dropdowns+tail,converted:n};
}

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const targets=all.filter(it=>{const b=it.fieldData['post-body']||'';return /frequently asked|faq/i.test(b)&&!/<details/i.test(b);});
console.log(`${DRY?'[DRY] ':''}${targets.length} posts still flat — converting Q:/A: paragraph style\n`);
const backup=[],ids=[];let ok=0,skip=0;
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
for(const it of targets){
  const body=it.fieldData['post-body']||'';
  const {body:nb,converted}=convertQA(body);
  if(!converted){console.log('· still no parse:',it.fieldData.slug);skip++;continue;}
  backup.push({slug:it.fieldData.slug,id:it.id,body});
  if(DRY){console.log(`DRY ${it.fieldData.slug} (${converted})`);ids.push(it.id);continue;}
  try{await updateItem(it.id,{'post-body':nb});const af=await getItem(it.id);if((af.fieldData['post-body']||'').includes('<details')){ok++;ids.push(it.id);console.log(`✅ ${it.fieldData.slug} (${converted})`);}}catch(e){console.log('err',it.fieldData.slug,e.message);}
}
if(backup.length)writeFileSync(`data/seo-fixes/backup-faq2-${ts}.json`,JSON.stringify(backup,null,2));
if(!DRY&&ids.length){await publishItems(ids);console.log(`\n${ok} converted + published. ${skip} still unparsed.`);}
else if(DRY)console.log(`\n[DRY] ${ids.length} would convert. ${skip} unparsed.`);
