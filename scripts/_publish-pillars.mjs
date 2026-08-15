import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createItem, getItem, publishItems } from '../lib/webflow.mjs';
mkdirSync('data/seo-fixes',{recursive:true});
const ONE = process.argv.includes('--one');     // create only the first pillar (test)
const REST = process.argv.includes('--rest');   // create all not yet created

const pillars = JSON.parse(readFileSync('data/pillars-final.json','utf8'));
// track what we've already created so re-runs don't duplicate
let created = {};
try { created = JSON.parse(readFileSync('data/pillars-published.json','utf8')); } catch {}

const toDo = pillars.filter(p=>!created[p.id]);
const batch = ONE ? toDo.slice(0,1) : toDo;

console.log(`${batch.length} pillars to create (${Object.keys(created).length} already done)\n`);
const results=[];
for (const p of batch) {
  try {
    const item = await createItem({
      name: p.title,
      slug: p.id,
      'post-body': p.html,
      'post-summary': p.meta,
      'feature-post': false,
    }, { isDraft:false });
    const id = item.id;
    // verify
    const after = await getItem(id);
    const ok = (after.fieldData['post-body']||'').includes(p.h2s[0]);
    created[p.id] = { itemId:id, slug:p.id, title:p.title };
    results.push({id:p.id, itemId:id, ok});
    console.log(`${ok?'✅ created+verified':'⚠ created (verify?)'}  ${p.id}  → ${id}`);
  } catch(e){ console.log(`❌ ${p.id} — ${e.message}`); results.push({id:p.id,ok:false,err:e.message}); }
}
writeFileSync('data/pillars-published.json', JSON.stringify(created,null,2));

// publish the ones we created this run
const ids = results.filter(r=>r.itemId).map(r=>r.itemId);
if (ids.length) {
  await publishItems(ids);
  console.log(`\nPublished ${ids.length} to live domain.`);
}
console.log(`Total pillars now created: ${Object.keys(created).length}/11`);
