import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// show the sentence around each [firm name] / [Firm Name] to decide safe replacement
const slugs=['which-prop-firms-are-regulated','fast-payout-prop-firms-guide','are-prop-firms-real'];
for(const slug of slugs){
  const it=all.find(x=>x.fieldData.slug===slug);
  const text=(it.fieldData['post-body']||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  const i=text.search(/\[firm name\]/i);
  console.log('\n=== '+slug+' ===');
  console.log('...'+text.slice(Math.max(0,i-120),i+120)+'...');
}
