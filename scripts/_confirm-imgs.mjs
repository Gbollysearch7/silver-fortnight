import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const newPages=['best-prop-firms','proprietary-trading-firms','instant-funding-prop-firms','one-step-prop-firm-challenge','prop-trader-salary','futures-prop-firms','prop-firms-by-country-global-guide'];
console.log('Feature-image confirmation on new pages:');
for(const slug of newPages){
  const it=all.find(x=>x.fieldData.slug===slug);
  const fi=it?.fieldData['feature-image'];
  console.log('  '+(fi&&fi.url?'✅':'❌')+' '+slug+(fi?.url?'  ('+(fi.alt?'alt ✓':'no alt')+')':''));
}
// total now missing
let missing=0;for(const it of all){const fi=it.fieldData['feature-image'];if(!fi||!fi.url)missing++;}
console.log('\nTotal posts still missing feature image:',missing,'(was 16)');
