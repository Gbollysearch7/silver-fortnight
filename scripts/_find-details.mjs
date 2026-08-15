import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
for(const it of all){
  const b=it.fieldData['post-body']||'';
  if(/<details/i.test(b)){
    const i=b.search(/<details/i);
    console.log('SLUG:',it.fieldData.slug);
    console.log(b.slice(i,i+500));
    break;
  }
}
