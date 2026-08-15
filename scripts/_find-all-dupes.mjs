import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const base=s=>(s||'').replace(/-[a-z0-9]{4,6}$/i,'');
// group by base slug
const groups={};
for(const it of all){const b=base(it.fieldData.slug);(groups[b]=groups[b]||[]).push(it);}
const dupes=Object.entries(groups).filter(([b,items])=>items.length>1);
console.log('=== DUPLICATE POST GROUPS (same base slug) ===\n');
console.log('Total live posts:',all.length);
console.log('Duplicate groups:',dupes.length,'\n');
for(const [b,items] of dupes){
  console.log('"'+b+'" — '+items.length+' versions:');
  for(const it of items){
    const body=it.fieldData['post-body']||'';
    console.log('   '+it.fieldData.slug.padEnd(55)+' | '+String(body.length).padStart(6)+' chars | published:'+(it.isArchived?'ARCHIVED':it.isDraft?'DRAFT':'LIVE'));
  }
  console.log('');
}
