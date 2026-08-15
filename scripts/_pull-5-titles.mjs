import { listItems } from '../lib/webflow.mjs';
const targets = ["prop-firm-demo-account-practice-best-platforms","what-are-prop-firms-and-how-do-they-work","fast-payout-prop-firms-guide","best-prop-firms-in-netherlands","which-futures-prop-trading-firm-offers-the-fastest-payout"];
const found = {};
for (let off=0; off<400; off+=100){
  const { items } = await listItems({ limit:100, offset:off });
  if(!items.length) break;
  for(const it of items) if(targets.includes(it.fieldData.slug)) found[it.fieldData.slug]={title:it.fieldData.name||'',meta:it.fieldData['post-summary']||'',id:it.id};
}
for(const s of targets){
  const p=found[s];
  console.log('\n'+s);
  if(p){
    console.log('  TITLE ('+p.title.length+'): '+p.title);
    console.log('  META  ('+p.meta.length+'): '+p.meta.slice(0,130));
  } else console.log('  NOT FOUND');
}
