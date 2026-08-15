import { listCollections, listItems } from '../lib/webflow.mjs';
import { blogConfig } from '../lib/config.mjs';

const cols = await listCollections(blogConfig.webflow.siteId);
for (const c of cols.collections || []) console.log(c.id, c.slug, '|', c.displayName);

const authors = (cols.collections || []).find(c => /author/i.test(c.slug + c.displayName));
if (authors) {
  const r = await listItems({ collectionId: authors.id, limit: 100 });
  console.log('\nAuthor items:');
  for (const it of r.items || []) console.log(' ', it.id, '| slug:', it.fieldData?.slug, '| fields:', JSON.stringify(it.fieldData).slice(0, 300));
}

// how many blog posts have author set?
let offset = 0, all = [];
while (true) { const r2 = await listItems({ limit: 100, offset }); all = all.concat(r2.items || []); if (!r2.items || r2.items.length < 100) break; offset += 100; }
const withAuthor = all.filter(i => i.fieldData?.author).length;
console.log('\nblog posts:', all.length, '| with author ref:', withAuthor, '| missing author:', all.length - withAuthor);
// feature-image alt coverage
const fi = all.filter(i => i.fieldData?.['feature-image']);
const fiNoAlt = fi.filter(i => !i.fieldData['feature-image'].alt);
console.log('with feature-image:', fi.length, '| feature-image missing alt:', fiNoAlt.length);
