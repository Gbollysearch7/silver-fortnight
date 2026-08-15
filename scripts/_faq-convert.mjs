import { getItem, updateItem, publishItems, listItems } from '../lib/webflow.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const ONE=process.argv.find(a=>a.startsWith('--slug='))?.split('=')[1];

// the house dropdown style (matches existing 92 posts)
const detailsStyle='border-bottom: 1px solid #2d2d44; padding: 16px 0;';
const summaryStyle='font-weight: 600; font-size: 16px; cursor: pointer; color: #e2e8f0; list-style: none; display: flex; justify-content: space-between; align-items: center;';
const iconStyle='color: #4250eb; font-size: 20px;';
const answerStyle='padding: 12px 0 4px 0; color: #94a3b8; font-size: 15px; line-height: 1.7;';

function convertFaq(body){
  if(/<details/i.test(body)) return {body,converted:0}; // already has dropdowns
  // find the FAQ heading
  const faqMatch=body.match(/<h2[^>]*>\s*(frequently asked questions|faqs?|common questions)[^<]*<\/h2>/i);
  if(!faqMatch) return {body,converted:0};
  const faqStart=body.indexOf(faqMatch[0])+faqMatch[0].length;
  // everything after FAQ heading up to next <h2> or end
  const after=body.slice(faqStart);
  const nextH2=after.search(/<h2[^>]*>/i);
  const faqBlock=nextH2>-1?after.slice(0,nextH2):after;
  const tail=nextH2>-1?after.slice(nextH2):'';
  // parse <h3>Q</h3><p>A</p>... (answer may be multiple <p>)
  const pairs=[...faqBlock.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*((?:<p[^>]*>[\s\S]*?<\/p>\s*|<ul[^>]*>[\s\S]*?<\/ul>\s*)+)/gi)];
  if(!pairs.length) return {body,converted:0};
  let dropdowns='';
  for(const [,q,a] of pairs){
    const question=q.replace(/<[^>]+>/g,'').trim();
    dropdowns+=`<details style="${detailsStyle}">\n<summary style="${summaryStyle}">\n${question}\n<span style="${iconStyle}">+</span>\n</summary>\n<div style="${answerStyle}">\n${a.trim()}\n</div>\n</details>\n`;
  }
  const newBody=body.slice(0,faqStart)+'\n'+dropdowns+tail;
  return {body:newBody,converted:pairs.length};
}

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const manifest=JSON.parse(readFileSync('data/blog-corpus-manifest.json','utf8'));
let targets=manifest.filter(m=>m.faqFlat);
if(ONE) targets=targets.filter(m=>m.slug===ONE);

console.log(`${DRY?'[DRY] ':''}Converting FAQ → dropdown on ${targets.length} posts\n`);
const backup=[],ids=[];let ok=0,skip=0;
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
for(const t of targets){
  const it=all.find(x=>x.fieldData.slug===t.slug);if(!it){console.log('? missing',t.slug);continue;}
  const body=it.fieldData['post-body']||'';
  const {body:newBody,converted}=convertFaq(body);
  if(!converted){console.log('· no convertible FAQ pairs:',t.slug);skip++;continue;}
  backup.push({slug:t.slug,id:it.id,body});
  if(DRY){console.log(`DRY  ${t.slug}  (${converted} questions → dropdown)`);ids.push(it.id);continue;}
  try{
    await updateItem(it.id,{'post-body':newBody});
    const after=await getItem(it.id);
    if((after.fieldData['post-body']||'').includes('<details')){ok++;ids.push(it.id);console.log(`✅ ${t.slug} (${converted} Qs)`);}
    else console.log('verify fail',t.slug);
  }catch(e){console.log('err',t.slug,e.message);}
}
if(backup.length)writeFileSync(`data/seo-fixes/backup-faq-${ts}.json`,JSON.stringify(backup,null,2));
if(!DRY&&ids.length){await publishItems(ids);console.log(`\n${ok} converted + published. ${skip} skipped.`);}
else if(DRY)console.log(`\n[DRY] ${ids.length} would convert. ${skip} had no convertible pairs.`);
