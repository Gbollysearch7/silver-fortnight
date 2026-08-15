#!/usr/bin/env node
/** Re-render all in-article banners at new larger size + ensure full-width markup. */
import { resolve } from 'path';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { listItems, getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
import { buildInArticleHTML } from '../lib/inarticle-template.mjs';
const COLLECTION=blogConfig.webflow.blogCollectionId, API=blogConfig.webflow.apiBase;
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
const OUT=resolve(ROOT_DIR,'output','inarticle-html');mkdirSync(OUT,{recursive:true});
const GH='Gbollysearch7/silver-fortnight@main';
const cdn=name=>`https://cdn.jsdelivr.net/gh/${GH}/output/inarticle-html/${name}.jpg`;
// new full-width, aligned figure style
const figStyle='margin:32px 0;width:100%;';
const imgStyle='width:100%;height:auto;border-radius:14px;display:block;';

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const targets=all.filter(it=>(it.fieldData['post-body']||'').includes('inarticle-html'));
console.log('Posts with banners to re-render:',targets.length,'\n');
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const imgFiles=[];const ids=[];
for(const it of targets){
  const slug=it.fieldData.slug;let body=it.fieldData['post-body']||'';
  // find each banner img name + its heading (from alt)
  const figs=[...body.matchAll(/<figure[^>]*>\s*<img[^>]+src="[^"]*inarticle-html\/([^".]+)\.jpg"[^>]*alt="([^"]*)"[^>]*>\s*<\/figure>/gi)];
  if(!figs.length)continue;
  let n=0;
  for(const f of figs){
    const name=f[1], heading=f[2].replace(/&amp;/g,'&');
    const page=await browser.newPage();
    await page.setViewport({width:1200,height:420,deviceScaleFactor:2});
    await page.setContent(buildInArticleHTML({heading,slug,index:n}),{waitUntil:'networkidle0'});
    await page.screenshot({path:resolve(OUT,name+'.jpg'),type:'jpeg',quality:90});
    await page.close();
    imgFiles.push(`output/inarticle-html/${name}.jpg`);n++;
  }
  // rewrite all figure markup to new full-width style
  body=body.replace(/<figure[^>]*>\s*(<img[^>]+inarticle-html[^>]+>)\s*<\/figure>/gi,(m,img)=>{
    const src=(img.match(/src="([^"]+)"/)||[])[1]||'';
    const alt=(img.match(/alt="([^"]*)"/)||[])[1]||'';
    return `<figure style="${figStyle}"><img src="${src}" alt="${alt}" style="${imgStyle}" loading="lazy"/></figure>`;
  });
  await getItem(it.id).then(cur=>fetch(`${API}/collections/${COLLECTION}/items/${it.id}`,{method:'PATCH',headers:H,body:JSON.stringify({isArchived:false,isDraft:false,fieldData:{...cur.fieldData,'post-body':body}})}));
  ids.push(it.id);
  console.log(`✅ ${slug} (${n} banners re-rendered)`);
}
await browser.close();
// commit images
if(imgFiles.length){try{execSync(`cd "${ROOT_DIR}" && git add ${imgFiles.join(' ')} && git commit -q -m "Re-render in-article banners full-width 1200x420" && git push -q`,{stdio:'pipe'});console.log('\npushed',imgFiles.length,'images');}catch(e){console.log('git:',e.message.slice(0,80));}}
// publish all updated
const keepout=new Set((()=>{try{return JSON.parse(readFileSync(new URL('../data/unpublished-keepout.json',import.meta.url),'utf8')).items.map(i=>i.id);}catch{return[];}})());
const pubIds=ids.filter(id=>!keepout.has(id));
if(pubIds.length<ids.length)console.log('keep-out: skipped',ids.length-pubIds.length,'dedup-killed items');
for(let i=0;i<pubIds.length;i+=50){await fetch(`${API}/collections/${COLLECTION}/items/publish`,{method:'POST',headers:H,body:JSON.stringify({itemIds:pubIds.slice(i,i+50)})});}
console.log('published',ids.length,'posts');
// purge CDN
for(const f of imgFiles){const n=f.split('/').pop().replace('.jpg','');await fetch(`https://purge.jsdelivr.net/gh/${GH}/output/inarticle-html/${n}.jpg`).catch(()=>{});}
console.log('purged CDN cache');
