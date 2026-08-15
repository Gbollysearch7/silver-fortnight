import { listItems } from '../lib/webflow.mjs';
const { items } = await listItems({ limit: 3 });
items.forEach(it=>{
  const f=it.fieldData;
  console.log(f.slug.slice(0,30));
  console.log('  category:', JSON.stringify(f.category));
  console.log('  author:', JSON.stringify(f.author));
  console.log('  read-time:', JSON.stringify(f['read-time']));
  console.log('  feature-image:', JSON.stringify(f['feature-image']).slice(0,80));
});
