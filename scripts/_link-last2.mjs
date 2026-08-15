import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const bySlug={};all.forEach(it=>bySlug[it.fieldData.slug]=it);
// hand-pick relevant targets (verified relevant)
const jobs={
  'prop-firm-payout-schedule-timeline-when-do-you-get-paid-82413':[
    ['fast-payout-prop-firms-guide','Fast Payout Prop Firms'],
    ['how-many-people-get-payouts-from-prop-firms','How Many People Get Payouts From Prop Firms'],
    ['prop-firm-profit-split-comparison','Prop Firm Profit Splits Compared'],
  ],
  'pip-value-converter':[
    ['forex-lot-size-calculator','Forex Lot Size Calculator'],
    ['trading-position-size-calculator','Position Size Calculator'],
    ['risk-reward-ratio-calculator','Risk/Reward Ratio Calculator'],
  ],
};
const MARKER='<!--ty-related-->';
const backup=[],ids=[];let ok=0;
for(const [slug,targets] of Object.entries(jobs)){
  const it=bySlug[slug];if(!it){console.log('missing',slug);continue;}
  backup.push({slug,id:it.id,body:it.fieldData['post-body']});
}
writeFileSync('data/seo-fixes/backup-last2-links.json',JSON.stringify(backup,null,2));
for(const [slug,targets] of Object.entries(jobs)){
  const it=bySlug[slug];if(!it)continue;
  let body=it.fieldData['post-body']||'';
  if(body.includes(MARKER)){console.log('skip (has block)',slug);continue;}
  const lis=targets.map(([s,a])=>`<li><a href="https://tradersyard.com/blog-posts/${s}">${a}</a></li>`).join('');
  const newBody=body+`\n${MARKER}<h2>Related guides</h2><ul>${lis}</ul>`;
  if(DRY){ids.push(it.id);console.log('DRY would link',slug);continue;}
  await updateItem(it.id,{'post-body':newBody});
  const after=await getItem(it.id);
  if((after.fieldData['post-body']||'').includes(MARKER)){ok++;ids.push(it.id);console.log('✅',slug);}
}
if(!DRY&&ids.length){await publishItems(ids);console.log(`${ok} linked + published`);}
else if(DRY)console.log('[DRY] '+ids.length+' would be linked');
