import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const map=JSON.parse(readFileSync('data/pillar-cluster-links.json','utf8'));
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const bySlug={};all.forEach(it=>bySlug[it.fieldData.slug]=it);
const MARKER='<!--ty-cluster-links-->';
const heading={
  'best-prop-firms':'Explore prop firms by market','futures-prop-firms':'More on futures prop firms','prop-firm-payouts-profit-split-withdrawals':'More on payouts and profit splits','prop-firm-rules-and-risk-management':'More on prop firm rules','are-prop-firms-legit-profitable-halal':'More on prop firm legitimacy','prop-firm-demo-practice-real-accounts':'More on demo and funded accounts','prop-trading-as-a-career':'More on a prop trading career','options-prop-firms':'More on options prop firms','forex-prop-firms':'More on forex prop firms','what-is-a-prop-firm-and-how-do-they-work':'Learn more about prop firms','prop-firms-by-country-global-guide':'Prop firms by country'
};
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
const backup=[],ids=[];let ok=0,skip=0;
for(const slug of Object.keys(map)){if(bySlug[slug])backup.push({slug,id:bySlug[slug].id,body:bySlug[slug].fieldData['post-body']});}
writeFileSync(`data/seo-fixes/backup-pillar-links-${ts}.json`,JSON.stringify(backup,null,2));
for(const [slug,targets] of Object.entries(map)){
  if(!targets.length){continue;}
  const it=bySlug[slug];if(!it){console.log('missing',slug);continue;}
  let body=it.fieldData['post-body']||'';
  if(body.includes(MARKER)){skip++;continue;}
  const lis=targets.map(t=>`<li><a href="https://tradersyard.com/blog-posts/${t.slug}">${t.title}</a></li>`).join('');
  const block=`\n${MARKER}<h2>${heading[slug]||'Related guides'}</h2><ul>${lis}</ul>`;
  if(DRY){ids.push(it.id);console.log('DRY +'+targets.length+' links → '+slug);continue;}
  try{
    await updateItem(it.id,{'post-body':body+block});
    const after=await getItem(it.id);
    if((after.fieldData['post-body']||'').includes(MARKER)){ok++;ids.push(it.id);console.log('✅ +'+targets.length+' → '+slug);}
  }catch(e){console.log('err',slug,e.message);}
}
if(!DRY&&ids.length){await publishItems(ids);console.log(`\n${ok} pillars expanded + published. ${skip} skipped.`);}
else if(DRY)console.log(`\n[DRY] ${ids.length} pillars would gain cluster links.`);
