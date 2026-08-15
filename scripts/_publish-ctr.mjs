import { readFileSync } from 'fs';
import { publishItems } from '../lib/webflow.mjs';
const ids = JSON.parse(readFileSync('data/ctr-rewrites-final.json','utf8'))
  .filter(r => r.itemId).map(r => r.itemId);
console.log(`Publishing ${ids.length} items to live domain...`);
try {
  const res = await publishItems(ids);
  console.log('✅ Published:', JSON.stringify(res).slice(0,200));
} catch (e) {
  console.log('❌', e.message);
}
