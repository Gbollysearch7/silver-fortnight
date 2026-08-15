#!/usr/bin/env node
/**
 * Render branded in-article banners for a post's H2 sections and insert them
 * into the post body, just under chosen H2s. Same brand system as thumbnails.
 *   node scripts/_inarticle-banners.mjs --slug <baseSlug> [--dry-run] [--max 2]
 * Reads body from live Webflow, picks the strongest H2s, renders 680x300 banners,
 * commits them to repo (for jsDelivr), inserts <img> after those H2s.
 */
import { resolve, basename } from 'path';
import { writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
import { buildInArticleHTML } from '../lib/inarticle-template.mjs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run') || args.includes('--dry');
const SLUG = args.find((a,i)=>args[i-1]==='--slug');
const MAX = parseInt(args.find((a,i)=>args[i-1]==='--max')||'2',10);
const OUT_DIR = resolve(ROOT_DIR, 'output', 'inarticle-html');
mkdirSync(OUT_DIR, { recursive: true });
const GH_OWNER='Gbollysearch7', GH_REPO='silver-fortnight', GH_BRANCH='main';
const cdn = (name) => `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/output/inarticle-html/${name}.jpg`;
const baseSlug = s => (s||'').replace(/-[a-z0-9]{4,6}$/i,'');

let items=[];for(let off=0;;off+=100){const{items:p}=await listItems({limit:100,offset:off});items.push(...p);if(!p||p.length<100)break;}
const targets = SLUG ? items.filter(it=>baseSlug(it.fieldData.slug)===SLUG||it.fieldData.slug===SLUG) : [];
if(!targets.length){console.log('No matching post for',SLUG);process.exit(0);}

const browser = await puppeteer.launch({headless:'new',args:['--no-sandbox']});
let pushedFiles=[];
for(const it of targets){
  const slug=it.fieldData.slug; const body=it.fieldData['post-body']||'';
  // extract H2 headings (skip FAQ + TOC + Quick Calculator)
  const h2s=[...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m=>({raw:m[0],text:m[1].replace(/<[^>]+>/g,'').trim()}))
    .filter(h=>!/frequently asked|table of contents|quick calculator|conclusion|faq/i.test(h.text));
  if(!h2s.length){console.log('no usable H2 in',slug);continue;}
  // pick up to MAX, spaced out (first, middle)
  const picks=[h2s[0]]; if(h2s.length>2&&MAX>1)picks.push(h2s[Math.floor(h2s.length/2)]);
  let newBody=body, n=0;
  for(const h of picks.slice(0,MAX)){
    const name=`${baseSlug(slug)}-s${n}`;
    const html=buildInArticleHTML({heading:h.text,slug,index:n});
    const page=await browser.newPage();
    await page.setViewport({width:680,height:300,deviceScaleFactor:2});
    await page.setContent(html,{waitUntil:'networkidle0'});
    const file=resolve(OUT_DIR,`${name}.jpg`);
    await page.screenshot({path:file,type:'jpeg',quality:88});
    await page.close();
    const img=`<figure style="margin:28px 0;"><img src="${cdn(name)}" alt="${h.text}" style="width:100%;border-radius:12px;display:block;" loading="lazy"/></figure>`;
    // insert after this H2's closing tag (and its first following </p> if present)
    const at=newBody.indexOf(h.raw)+h.raw.length;
    newBody=newBody.slice(0,at)+'\n'+img+'\n'+newBody.slice(at);
    pushedFiles.push(`output/inarticle-html/${name}.jpg`);
    console.log(`  rendered ${name}.jpg  ← "${h.text.slice(0,40)}"`);
    n++;
  }
  if(DRY){console.log(`[DRY] ${slug}: would insert ${n} banners`);continue;}
  // commit images so jsDelivr can serve them
  try{
    execSync(`cd "${ROOT_DIR}" && git add ${pushedFiles.join(' ')} && git commit -q -m "Add in-article banners: ${baseSlug(slug)}" && git push -q`,{stdio:'pipe'});
  }catch(e){console.log('git push note:',e.message.slice(0,80));}
  await updateItem(it.id,{'post-body':newBody});
  const af=await getItem(it.id);
  if((af.fieldData['post-body']||'').includes('inarticle-html')){await publishItems([it.id]);console.log(`✅ ${slug}: ${n} banners inserted + published`);}
  else console.log('verify fail',slug);
}
await browser.close();
