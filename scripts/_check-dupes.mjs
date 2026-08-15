import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const base=s=>(s||'').replace(/-[a-z0-9]{4,6}$/i,'');
for(const stub of ['swing-trade','how-many-prop-firms','how-many-people-get-payouts']){
  const matches=all.filter(it=>base(it.fieldData.slug).includes(stub)||it.fieldData.slug.includes(stub));
  console.log('=== "'+stub+'" matches:',matches.length);
  for(const m of matches){
    const b=m.fieldData['post-body']||'';
    console.log('   slug:',m.fieldData.slug,'| len:',b.length,'| has inarticle:',b.includes('inarticle-html'),'| has #pricing:',b.includes('#pricing'));
  }
}
