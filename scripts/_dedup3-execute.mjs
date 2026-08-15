import { readFileSync, writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';

const plan = JSON.parse(readFileSync('data/dedup3-plan.json', 'utf8')).filter(p => p.loser);
const API = 'https://api.webflow.com/v2';
const COLLECTION = blogConfig.webflow.blogCollectionId;
const H = { Authorization: 'Bearer ' + WEBFLOW_API_KEY, 'Content-Type': 'application/json' };

let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }

// 1. re-point internal links loser -> keeper in all bodies
const loserToKeeper = Object.fromEntries(plan.map(p => [p.loser, p.keeper]));
let relinked = 0;
for (const it of all) {
  let body = it.fieldData?.['post-body'] || '';
  const slug = it.fieldData?.slug;
  if (!body || loserToKeeper[slug]) continue; // don't bother editing losers
  let changed = false;
  for (const [loser, keeper] of Object.entries(loserToKeeper)) {
    const re = new RegExp('(href=")[^"]*/blog-posts/' + loser + '(#[^"]*)?(/?")', 'g');
    if (re.test(body)) { body = body.replace(re, '$1https://tradersyard.com/blog-posts/' + keeper + '$3'); changed = true; }
  }
  if (changed) {
    writeFileSync(`data/seo-fixes/backup-dedup3-relink-${slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
    await updateItem(it.id, { 'post-body': body });
    await publishItems([it.id]);
    relinked++; console.log('relinked:', slug);
  }
}
console.log('posts relinked:', relinked);

// 2. backup + unpublish losers
const killed = [];
for (const p of plan) {
  const it = all.find(i => i.id === p.loserId);
  writeFileSync(`data/seo-fixes/backup-dedup3-kill-${p.loser}-2026-07-02.json`, JSON.stringify(it, null, 1));
  const r = await fetch(`${API}/collections/${COLLECTION}/items/live`, { method: 'DELETE', headers: H, body: JSON.stringify({ items: [{ id: p.loserId }] }) });
  console.log((r.status === 204 ? 'UNPUBLISHED ' : 'FAILED(' + r.status + ') ') + p.loser);
  if (r.status === 204) killed.push({ slug: p.loser, id: p.loserId, keeper: p.keeper });
  await new Promise(s => setTimeout(s, 400));
}

// 3. keep-out list (append June kills too, by suffix pattern convention)
writeFileSync('data/unpublished-keepout.json', JSON.stringify({ note: 'Items unpublished from live on purpose (dedup). publishItems in lib/webflow.mjs refuses these IDs. NEVER publish without removing from this list.', updatedAt: new Date().toISOString(), items: killed }, null, 1));
console.log('\nkeep-out list written:', killed.length, 'items');
