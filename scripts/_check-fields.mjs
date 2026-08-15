import { listItems } from '../lib/webflow.mjs';
// inspect an existing item to see what fields a successful post has
const { items } = await listItems({ limit: 1 });
const f = items[0].fieldData;
console.log('Fields on an existing live post:');
Object.keys(f).forEach(k=>{
  const v=f[k];
  const t=typeof v==='object'?(Array.isArray(v)?'array':'object'):typeof v;
  console.log('  '+k+'  ('+t+')'+(t==='string'&&v.length<60?' = '+JSON.stringify(v):''));
});
