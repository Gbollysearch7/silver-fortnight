import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const geo=JSON.parse(readFileSync('data/geo-pages.json','utf8'));
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const byId={};all.forEach(it=>byId[it.id]=it);

const MARKER='<!--ty-pillar-link-->';
// derive country name from slug for natural anchor
const country=slug=>{const m=slug.match(/(?:in|firms)-([a-z-]+?)(?:-in-2026|-2026|$)/);let c=(m?m[1]:'').replace(/-/g,' ').replace(/\b\w/g,x=>x.toUpperCase());if(/united kingdom|united-kingdom/i.test(slug))c='the United Kingdom';if(/usa/i.test(slug))c='the USA';return c||'your country';};

const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
const backup=[],ids=[];let ok=0,skip=0;
// snapshot
for(const g of geo){const it=byId[g.id];if(it)backup.push({slug:g.slug,id:g.id,body:it.fieldData['post-body']});}
writeFileSync(`data/seo-fixes/backup-geo-${ts}.json`,JSON.stringify(backup,null,2));

for(const g of geo){
  const it=byId[g.id];if(!it){console.log('missing',g.slug);continue;}
  let body=it.fieldData['post-body']||'';
  if(body.includes(MARKER)){skip++;continue;}
  const c=country(g.slug);
  // link UP to pillar + geo hub, with natural framing
  const block=`\n${MARKER}<p><strong>Comparing your options?</strong> See our full guide to the <a href="https://tradersyard.com/blog-posts/best-prop-firms">best prop firms</a> and how the model works across markets, or browse <a href="https://tradersyard.com/blog-posts/prop-firms-by-country-global-guide">prop firms by country</a> to check availability where you trade.</p>`;
  const newBody=body+block;
  if(DRY){ids.push(g.id);continue;}
  try{
    await updateItem(g.id,{'post-body':newBody});
    const after=await getItem(g.id);
    if((after.fieldData['post-body']||'').includes(MARKER)){ok++;ids.push(g.id);console.log('✅ '+g.slug+' → linked up ("'+c+'")');}
    else console.log('verify fail',g.slug);
  }catch(e){console.log('err',g.slug,e.message);}
}
if(!DRY&&ids.length){
  await publishItems(ids);
  console.log(`\n${ok} wired + published. ${skip} skipped (already linked).`);
  // post-run live spot-check (gate fix #1)
  await new Promise(r=>setTimeout(r,8000));
  const sample=geo.slice(0,3).map(g=>g.slug);
  console.log('\nLive spot-check:');
  for(const slug of sample){
    const html=await (await fetch('https://tradersyard.com/blog-posts/'+slug)).text();
    console.log(`  ${html.includes('ty-pillar-link')||html.includes('best-prop-firms"')||/best prop firms<\/a>/.test(html)?'✅':'⏳'} ${slug}`);
  }
}
else if(DRY)console.log(`[DRY] ${ids.length} would be wired to pillar + geo hub. ${skip} already done.`);
