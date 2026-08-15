import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const pillarSlugs=['best-prop-firms','what-is-a-prop-firm-and-how-do-they-work','futures-prop-firms','prop-firm-payouts-profit-split-withdrawals','options-prop-firms','forex-prop-firms','prop-firm-rules-and-risk-management','are-prop-firms-legit-profitable-halal','prop-firm-demo-practice-real-accounts','prop-trading-as-a-career','prop-firms-by-country-global-guide'];
console.log('Pillar outbound internal-link counts:');
for(const slug of pillarSlugs){
  const it=all.find(x=>x.fieldData.slug===slug);
  if(!it){console.log('  ? '+slug);continue;}
  const body=it.fieldData['post-body']||'';
  const links=(body.match(/href="https:\/\/tradersyard\.com\/blog-posts\//g)||[]).length;
  console.log('  '+String(links).padStart(2)+' links  '+slug);
}
