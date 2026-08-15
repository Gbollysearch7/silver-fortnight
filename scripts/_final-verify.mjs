import { readFileSync } from 'fs';
const ko = JSON.parse(readFileSync('data/unpublished-keepout.json', 'utf8'));
const d3 = JSON.parse(readFileSync('data/dedup3-plan.json', 'utf8'));
let bad = 0;
console.log('=== keep-out items (should all be 404) ===');
for (const i of ko.items) {
  const r = await fetch('https://tradersyard.com/blog-posts/' + i.slug, { method: 'HEAD', redirect: 'manual' });
  if (r.status === 200) { console.log('  STILL LIVE (BAD):', i.slug); bad++; }
}
console.log(ko.items.length + ' checked, still-live: ' + bad);
console.log('\n=== dedup3 keepers (should all be 200) ===');
let down = 0;
for (const p of d3) {
  if (!p.keeper) continue;
  const r = await fetch('https://tradersyard.com/blog-posts/' + p.keeper, { method: 'HEAD', redirect: 'manual' });
  if (r.status !== 200) { console.log('  DOWN (BAD):', p.keeper, r.status); down++; }
}
console.log(d3.length + ' checked, down: ' + down);
