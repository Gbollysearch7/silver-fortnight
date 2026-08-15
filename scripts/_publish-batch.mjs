#!/usr/bin/env node
/** Publish approved rewrites from a dir + add 2 full-width banners. Idempotent.
 *   node scripts/_publish-batch.mjs <approvedDir>
 * Each <slug>.json: {slug, html, metaDescription}. Resolves slug->id live. No em dashes (sweep). */
import { resolve } from 'path';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { listItems, getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
import { buildInArticleHTML } from '../lib/inarticle-template.mjs';
const COLLECTION=blogConfig.webflow.blogCollectionId, API=blogConfig.webflow.apiBase;
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
const DIR=resolve(ROOT_DIR, process.argv[2]||'data/next-approved');
const DONE=resolve(ROOT_DIR,'data','batch-done');mkdirSync(DONE,{recursive:true});
const OUT=resolve(ROOT_DIR,'output','inarticle-html');mkdirSync(OUT,{recursive:true});
const cdn=name=>`https://cdn.jsdelivr.net/gh/Gbollysearch7/silver-fortnight@main/output/inarticle-html/${name}.jpg`;
async function retry(fn,n=5){for(let i=0;i<n;i++){try{return await fn();}catch(e){if(i===n-1)throw e;await new Promise(r=>setTimeout(r,1500*(i+1)));}}}
function stripDash(s){return s.replace(/([\d%KMk])\s*[—–]\s*(\$?\d)/g,'$1 to $2').replace(/\s+[—–]\s+/g,', ').replace(/([A-Za-z])[—–]([A-Za-z])/g,'$1, $2').replace(/[—–]/g,', ');}

if(!existsSync(DIR)){console.log('no dir',DIR);process.exit(0);}
const files=readdirSync(DIR).filter(f=>f.endsWith('.json'));
console.log('Approved to publish:',files.length,'from',DIR);
let items=[];for(let off=0;off<400;off+=100){const{items:p}=await retry(()=>listItems({limit:100,offset:off}));items.push(...p);if(!p||p.length<100)break;}
const bySlug={};for(const it of items)bySlug[it.fieldData.slug]=it;
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const imgFiles=[];const log=[];
for(const f of files){
  const data=JSON.parse(readFileSync(resolve(DIR,f),'utf8'));
  const {slug}=data;
  if(existsSync(resolve(DONE,slug+'.flag'))){console.log('· done',slug);continue;}
  const it=bySlug[slug];if(!it){console.log('? not live',slug);continue;}
  try{
    let body=stripDash(data.html).replace(/https:\/\/tradersyard\.com\/auth\/register/g,'https://tradersyard.com/#pricing');
    const cur=await retry(()=>getItem(it.id));
    writeFileSync(resolve(ROOT_DIR,'data','seo-fixes',`backup-batch-${slug}.json`),JSON.stringify({slug,id:it.id,body:cur.fieldData['post-body'],summary:cur.fieldData['post-summary']}));
    // render 2 full-width banners
    const h2s=[...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>({raw:m[0],text:m[1].replace(/<[^>]+>/g,'').trim()})).filter(h=>!/frequently asked|table of contents|faq/i.test(h.text));
    const picks=h2s.length>2?[{h:h2s[0],n:0},{h:h2s[Math.floor(h2s.length/2)],n:1}]:h2s.slice(0,1).map((h,i)=>({h,n:i}));
    for(const {h,n} of [...picks].reverse()){
      const name=`${slug}-s${n}`;
      const page=await browser.newPage();await page.setViewport({width:1200,height:420,deviceScaleFactor:2});
      await page.setContent(buildInArticleHTML({heading:h.text,slug,index:n}),{waitUntil:'networkidle0'});
      await page.screenshot({path:resolve(OUT,name+'.jpg'),type:'jpeg',quality:90});await page.close();
      const img=`<figure style="margin:32px 0;width:100%;"><img src="${cdn(name)}" alt="${h.text.replace(/"/g,'')}" style="width:100%;height:auto;border-radius:14px;display:block;" loading="lazy"/></figure>`;
      const at=body.indexOf(h.raw)+h.raw.length;body=body.slice(0,at)+'\n'+img+'\n'+body.slice(at);
      imgFiles.push(`output/inarticle-html/${name}.jpg`);
    }
    const fd={...cur.fieldData,'post-body':body};if(data.metaDescription)fd['post-summary']=stripDash(data.metaDescription);
    const up=await retry(()=>fetch(`${API}/collections/${COLLECTION}/items/${it.id}`,{method:'PATCH',headers:H,body:JSON.stringify({isArchived:false,isDraft:false,fieldData:fd})}));
    if(!up.ok){log.push({slug,ok:false});console.log('⚠ update',slug,up.status);continue;}
    await retry(()=>fetch(`${API}/collections/${COLLECTION}/items/publish`,{method:'POST',headers:H,body:JSON.stringify({itemIds:[it.id]})}));
    writeFileSync(resolve(DONE,slug+'.flag'),'done');
    log.push({slug,ok:true,len:body.length});console.log(`✅ ${slug} (${body.length} chars, ${picks.length} banners)`);
  }catch(e){log.push({slug,ok:false,err:e.message.slice(0,70)});console.log('err',slug,e.message.slice(0,70));}
  await new Promise(r=>setTimeout(r,1200));
}
await browser.close();
if(imgFiles.length){try{execSync(`cd "${ROOT_DIR}" && git add ${imgFiles.join(' ')} && git commit -q -m "Batch banners" && git push -q`,{stdio:'pipe'});for(const f of imgFiles){const n=f.split('/').pop().replace('.jpg','');await fetch(`https://purge.jsdelivr.net/gh/Gbollysearch7/silver-fortnight@main/output/inarticle-html/${n}.jpg`).catch(()=>{});}console.log('pushed+purged',imgFiles.length,'images');}catch(e){console.log('git:',e.message.slice(0,60));}}
console.log('\nPublished:',log.filter(l=>l.ok).length,'| failed:',log.filter(l=>!l.ok).length);
