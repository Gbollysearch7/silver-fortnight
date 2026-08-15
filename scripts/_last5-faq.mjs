import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const flat=all.filter(it=>{const b=it.fieldData['post-body']||'';return /frequently asked|faq/i.test(b)&&!/<details/i.test(b);});
console.log('Final unparsed FAQ posts:',flat.length,'\n');
for(const it of flat){
  const b=it.fieldData['post-body']||'';const i=b.search(/<h2[^>]*>[^<]*(frequently asked|faq)/i);
  console.log('=== '+it.fieldData.slug+' ===');
  console.log(b.slice(i,i+350).replace(/\n/g,' '),'\n');
}
