import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
let emDash=0,agena=0,smallImg=0;
const emPosts=[],agenaPosts=[];
for(const it of all){
  const b=it.fieldData['post-body']||'';
  if(b.includes('—')){emDash++;emPosts.push(it.fieldData.slug);}
  if(/agenatrader/i.test(b)){agena++;agenaPosts.push(it.fieldData.slug);}
}
console.log('Live/CMS posts:',all.length);
console.log('Posts with em dashes (—):',emDash);
console.log('Posts mentioning AgenaTrader:',agena);
console.log('\nAgenaTrader posts:'); agenaPosts.slice(0,20).forEach(s=>console.log('  '+s));
