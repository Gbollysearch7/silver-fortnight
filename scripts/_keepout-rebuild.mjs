import { readFileSync, writeFileSync, existsSync } from 'fs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';

const API = 'https://api.webflow.com/v2';
const COLLECTION = blogConfig.webflow.blogCollectionId;
const H = { Authorization: 'Bearer ' + WEBFLOW_API_KEY, 'Content-Type': 'application/json' };

const kills = new Map(); // id -> {slug, source}
if (existsSync('data/dedup-plan-final.json')) {
  for (const p of JSON.parse(readFileSync('data/dedup-plan-final.json', 'utf8')))
    for (const k of p.kill || []) kills.set(k.id, { slug: k.slug, source: 'dedup-round1' });
}
for (const p of JSON.parse(readFileSync('data/dedup-round2-plan.json', 'utf8')))
  for (const k of p.kill || []) kills.set(k.id, { slug: k.slug, source: 'dedup-round2' });
for (const p of JSON.parse(readFileSync('data/dedup3-plan.json', 'utf8')))
  if (p.loserId) kills.set(p.loserId, { slug: p.loser, source: 'dedup-round3' });

console.log('total kill-list items across all rounds:', kills.size);

// check liveness, unpublish any that are live
let relive = 0;
for (const [id, k] of kills) {
  const r = await fetch('https://tradersyard.com/blog-posts/' + k.slug, { method: 'HEAD', redirect: 'manual' });
  if (r.status === 200) {
    const d = await fetch(`${API}/collections/${COLLECTION}/items/live`, { method: 'DELETE', headers: H, body: JSON.stringify({ items: [{ id }] }) });
    console.log((d.status === 204 ? 'RE-KILLED ' : 'FAILED(' + d.status + ') ') + k.slug + ' [' + k.source + ']');
    relive++;
    await new Promise(s => setTimeout(s, 400));
  }
}
console.log('resurrected items found & re-killed:', relive);

writeFileSync('data/unpublished-keepout.json', JSON.stringify({
  note: 'COMPLETE union of all dedup kill lists (rounds 1-3). publishItems in lib/webflow.mjs refuses these IDs. NEVER publish without removing from this list. History: 23 Jun banner batch resurrected round-1/2 kills; 02 Jul author/H1 batches resurrected 4 more because the first keepout only had round 3. This file must stay the union of ALL rounds.',
  updatedAt: new Date().toISOString(),
  items: [...kills].map(([id, k]) => ({ id, slug: k.slug, source: k.source })),
}, null, 1));
console.log('keep-out rebuilt with', kills.size, 'items');
