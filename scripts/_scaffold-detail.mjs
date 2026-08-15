import { listItems } from '../lib/webflow.mjs';
import { writeFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const slugs=['prop-firm-payout-schedule-timeline-when-do-you-get-paid-82413','which-prop-firms-are-regulated','funded-trader-profit-split-calculator-calculate-your-earning','funded-trader-max-lot-size-calculator-for-prop-firms','fast-payout-prop-firms-guide','are-prop-firms-real'];
const markers=/\[Option [AB]\]|\[insert[^\]]*\]|\[firm name\]|\[Firm Name\]|\[country\]|placeholder|to be written|\{\{[^}]*\}\}/gi;
const detail=[];
for(const slug of slugs){
  const it=all.find(x=>x.fieldData.slug===slug); if(!it)continue;
  const body=it.fieldData['post-body']||'';
  const hits=[...body.matchAll(markers)].map(m=>m[0]);
  const words=body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  detail.push({slug,id:it.id,words,placeholders:[...new Set(hits)],count:hits.length});
}
writeFileSync('data/scaffold-pages.json',JSON.stringify(detail,null,2));
detail.forEach(d=>console.log(d.count+'× placeholders ['+d.placeholders.join(', ')+']  '+d.words+'w  '+d.slug.slice(0,40)));
