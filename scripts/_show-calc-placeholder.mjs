import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
for(const slug of ['funded-trader-profit-split-calculator-calculate-your-earning','funded-trader-max-lot-size-calculator-for-prop-firms']){
  const it=all.find(x=>x.fieldData.slug===slug);
  const body=it.fieldData['post-body']||'';
  const text=body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
  console.log('\n=== '+slug+' ===');
  let idx=0,n=0;
  while((idx=text.toLowerCase().indexOf('placeholder',idx))>-1&&n<3){console.log('  ...'+text.slice(Math.max(0,idx-80),idx+40)+'...');idx+=11;n++;}
}
