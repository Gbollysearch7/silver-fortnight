import { resolve } from 'path';
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer';
import { ROOT_DIR } from '../lib/config.mjs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
import { buildInArticleHTML } from '../lib/inarticle-template.mjs';

const EXACT=['can-you-swing-trade-on-prop-firms-40bab','how-many-prop-firms-are-there','how-many-people-get-payouts-from-prop-firms-a8fe0'];
const GH_OWNER='Gbollysearch7',GH_REPO='silver-fortnight',GH_BRANCH='main';
const cdn=name=>`https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/output/inarticle-html/${name}.jpg`;
const OUT=resolve(ROOT_DIR,'output','inarticle-html');mkdirSync(OUT,{recursive:true});

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const browser=await puppeteer.launch({headless:'new',args:['--no-sandbox']});
const files=[],ids=[];
for(const slug of EXACT){
  const it=all.find(x=>x.fieldData.slug===slug);if(!it){console.log('? missing',slug);continue;}
  let body=it.fieldData['post-body']||'';
  if(body.includes('inarticle-html')){console.log('· already has banners',slug);continue;}
  const h2s=[...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m=>({raw:m[0],text:m[1].replace(/<[^>]+>/g,'').trim()})).filter(h=>!/frequently asked|table of contents|quick calculator|conclusion|faq/i.test(h.text));
  if(h2s.length<2){console.log('few H2',slug);continue;}
  const picks=[h2s[0],h2s[Math.floor(h2s.length/2)]];
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
    files.push(`output/inarticle-html/${name}.jpg`);n++;
  }
  await updateItem(it.id,{'post-body':body});
  const af=await getItem(it.id);
  if((af.fieldData['post-body']||'').includes('inarticle-html')){ids.push(it.id);console.log(`✅ ${slug}: ${n} banners inserted`);}
  else console.log('verify fail',slug);
}
await browser.close();
if(files.length){try{execSync(`cd "${ROOT_DIR}" && git add ${files.join(' ')} && git commit -q -m "In-article banners: pilot posts" && git push -q`,{stdio:'pipe'});console.log('images pushed to CDN');}catch(e){console.log('git:',e.message.slice(0,100));}}
if(ids.length){await publishItems(ids);console.log('Published',ids.length,'with banners.');}
