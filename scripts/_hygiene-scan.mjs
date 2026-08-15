import { listItems } from '../lib/webflow.mjs';
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }

// 1. suffixed duplicates: slug = base + '-' + 5 hex chars, where base also exists
const slugs = new Set(all.map(i => i.fieldData?.slug));
const suffixed = [...slugs].filter(s => /-[0-9a-f]{5}$/.test(s) && slugs.has(s.replace(/-[0-9a-f]{5}$/, '')));
console.log('=== SUFFIXED DUPLICATES IN CMS (base also exists) ===');
const liveDupes = [];
for (const s of suffixed) {
  const r = await fetch('https://tradersyard.com/blog-posts/' + s, { method: 'HEAD', redirect: 'manual' });
  if (r.status === 200) { liveDupes.push(s); console.log('  STILL LIVE:', s); }
}
console.log('suffixed in CMS:', suffixed.length, '| still live on site:', liveDupes.length);

// 2. multiple H1 in bodies
let h1Posts = 0, h1Total = 0;
// 3. imgs missing alt
let noAltPosts = 0, noAltImgs = 0;
// 4. meta length issues (live posts only)
let shortMeta = [], longMeta = [], emptyMeta = [];
for (const it of all) {
  const fd = it.fieldData || {}; const body = fd['post-body'] || '';
  const h1s = (body.match(/<h1[\s>]/g) || []).length;
  if (h1s > 0) { h1Posts++; h1Total += h1s; }
  const imgs = body.match(/<img\b[^>]*>/g) || [];
  const bad = imgs.filter(t => !/alt="[^"]+"/.test(t)).length;
  if (bad > 0) { noAltPosts++; noAltImgs += bad; }
  const sm = fd['post-summary'] || '';
  if (!sm) emptyMeta.push(fd.slug);
  else if (sm.length < 110) shortMeta.push(fd.slug + ' [' + sm.length + ']');
  else if (sm.length > 165) longMeta.push(fd.slug + ' [' + sm.length + ']');
}
console.log('\n=== BODY H1s (should be none; template owns H1) ===');
console.log('posts with in-body h1:', h1Posts, '| total h1 tags:', h1Total);
console.log('\n=== IMAGES MISSING ALT (in post bodies) ===');
console.log('posts affected:', noAltPosts, '| imgs missing alt:', noAltImgs);
console.log('\n=== META (post-summary) LENGTH ===');
console.log('empty:', emptyMeta.length, emptyMeta.slice(0,5));
console.log('short <110ch:', shortMeta.length, shortMeta.slice(0,8));
console.log('long >165ch:', longMeta.length, longMeta.slice(0,8));
