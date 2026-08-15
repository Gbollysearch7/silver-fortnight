import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const flat=all.filter(it=>{const b=it.fieldData['post-body']||'';return /frequently asked|faq/i.test(b)&&!/<details/i.test(b);});
console.log('Remaining flat-FAQ posts:',flat.length,'\n');
for(const it of flat){
  const b=it.fieldData['post-body']||'';
  // does it have an actual FAQ heading with question content, or just a passing mention?
  const hasHeading=/<h2[^>]*>[^<]*(frequently asked|faq)/i.test(b);
  const i=b.search(/<h[23][^>]*>[^<]*(frequently asked|faq)/i);
  console.log((hasHeading?'[real FAQ heading]':'[mention only]')+'  '+it.fieldData.slug);
  if(hasHeading&&i>-1)console.log('     '+b.slice(i,i+180).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());
}
