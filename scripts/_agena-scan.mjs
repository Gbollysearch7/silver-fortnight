import { readFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
const keepout = new Set(JSON.parse(readFileSync('data/unpublished-keepout.json','utf8')).items.map(i=>i.id));
let hits = [];
for (const it of all) {
  const body = (it.fieldData?.['post-body'] || '') + ' ' + (it.fieldData?.name || '') + ' ' + (it.fieldData?.['post-summary'] || '');
  const n = (body.match(/agena\s?trader/gi) || []).length;
  if (n > 0) hits.push({ slug: it.fieldData.slug, n, live: !keepout.has(it.id) && !it.isDraft });
}
hits.sort((a,b)=>b.n-a.n);
console.log('posts mentioning AgenaTrader:', hits.length, '| live:', hits.filter(h=>h.live).length, '| total mentions:', hits.reduce((a,h)=>a+h.n,0));
for (const h of hits.slice(0,15)) console.log(`  ${h.n>9?h.n:' '+h.n}x ${h.live?'LIVE':'dead'} ${h.slug}`);
