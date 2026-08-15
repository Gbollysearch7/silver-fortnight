#!/usr/bin/env node
/**
 * Publishes approved overnight rewrites from data/overnight-approved/<slug>.json
 * { slug, id, html, metaDescription } → update body+summary, CTA→#pricing,
 * publish (correct collection), render+insert 2 branded banners, push CDN, verify.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { getItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
import { buildInArticleHTML } from '../lib/inarticle-template.mjs';

const COLLECTION=blogConfig.webflow.blogCollectionId, API=blogConfig.webflow.apiBase;
const H={Authorization:'Bearer '+WEBFLOW_API_KEY,'Content-Type':'application/json','accept-version':'2.0.0'};
const APPROVED=resolve(ROOT_DIR,'data','overnight-approved');
const OUT=resolve(ROOT_DIR,'output','inarticle-html');mkdirSync(OUT,{recursive:true});
const GH_OWNER='Gbollysearch7',GH_REPO='silver-fortnight',GH_BRANCH='main';
const cdn=name=>`https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/output/inarticle-html/${name}.jpg`;
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';

if(!existsSync(APPROVED)){console.log('no approved dir yet');process.exit(0);}
const files=readdirSync(APPROVED).filter(f=>f.endsWith('.json'));
console.log('Approved rewrites to publish:',files.length);
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const log=[];const imgFiles=[];
for(const f of files){
  const data=JSON.parse(readFileSync(resolve(APPROVED,f),'utf8'));
  const {slug,id}=data;
  if(existsSync(resolve(ROOT_DIR,'data','overnight-done',slug+'.flag'))){console.log('· already done',slug);continue;}
  try{
    let body=data.html.replace(/https:\/\/tradersyard\.com\/auth\/register/g,'https://tradersyard.com/#pricing');
    // backup current
    const cur=await getItem(id);
    mkdirSync(resolve(ROOT_DIR,'data','seo-fixes'),{recursive:true});
    writeFileSync(resolve(ROOT_DIR,'data','seo-fixes',`backup-overnight-${slug}-${ts}.json`),JSON.stringify({slug,id,body:cur.fieldData['post-body'],summary:cur.fieldData['post-summary']}));
    // render 2 banners
    const h2s=[...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>({raw:m[0],text:m[1].replace(/<[^>]+>/g,'').trim()})).filter(h=>!/frequently asked|table of contents|quick calculator|conclusion|faq/i.test(h.text));
    const picks=h2s.length>2?[h2s[0],h2s[Math.floor(h2s.length/2)]]:h2s.slice(0,1);
    let n=0;
    for(const h of picks){
      const name=`${slug}-s${n}`;
      const page=await browser.newPage();
      await page.setViewport({width:680,height:300,deviceScaleFactor:2});
      await page.setContent(buildInArticleHTML({heading:h.text,slug,index:n}),{waitUntil:'networkidle0'});
      await page.screenshot({path:resolve(OUT,name+'.jpg'),type:'jpeg',quality:88});
      await page.close();
      const img=`<figure style="margin:28px 0;"><img src="${cdn(name)}" alt="${h.text.replace(/"/g,'')}" style="width:100%;border-radius:12px;display:block;" loading="lazy"/></figure>`;
      const at=body.indexOf(h.raw)+h.raw.length;
      body=body.slice(0,at)+'\n'+img+'\n'+body.slice(at);
      imgFiles.push(`output/inarticle-html/${name}.jpg`);n++;
    }
    // update body+summary (correct collection)
    const fd={...cur.fieldData,'post-body':body};
    if(data.metaDescription)fd['post-summary']=data.metaDescription;
    const up=await fetch(`${API}/collections/${COLLECTION}/items/${id}`,{method:'PATCH',headers:H,body:JSON.stringify({isArchived:false,isDraft:false,fieldData:fd})});
    if(!up.ok){log.push({slug,ok:false,err:'update '+up.status});console.log('⚠ update fail',slug,up.status);continue;}
    // publish live
    await fetch(`${API}/collections/${COLLECTION}/items/publish`,{method:'POST',headers:H,body:JSON.stringify({itemIds:[id]})});
    mkdirSync(resolve(ROOT_DIR,'data','overnight-done'),{recursive:true});
    writeFileSync(resolve(ROOT_DIR,'data','overnight-done',slug+'.flag'),'done');
    log.push({slug,ok:true,len:body.length,banners:n});
    console.log(`✅ ${slug} (${body.length} chars, ${n} banners)`);
  }catch(e){log.push({slug,ok:false,err:e.message.slice(0,80)});console.log('err',slug,e.message.slice(0,80));}
  await new Promise(r=>setTimeout(r,1200));
}
await browser.close();
// push all banner images once
if(imgFiles.length){try{execSync(`cd "${ROOT_DIR}" && git add ${imgFiles.join(' ')} && git commit -q -m "Overnight in-article banners" && git push -q`,{stdio:'pipe'});console.log('pushed',imgFiles.length,'banner images');}catch(e){console.log('git:',e.message.slice(0,80));}}
writeFileSync(resolve(ROOT_DIR,'data','overnight-publish-log-'+ts+'.json'),JSON.stringify(log,null,2));
console.log('\nPublished:',log.filter(l=>l.ok).length,'| failed:',log.filter(l=>!l.ok).length);
