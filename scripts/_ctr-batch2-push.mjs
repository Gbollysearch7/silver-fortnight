import { readFileSync, writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';
const { rewrites } = JSON.parse(readFileSync('data/ctr-batch2-drafts.json', 'utf8'));
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
for (const r of rewrites) {
  const it = all.find(i => i.fieldData?.slug === r.slug);
  if (!it) { console.log('MISSING:', r.slug); continue; }
  writeFileSync(`data/seo-fixes/backup-ctrb2-${r.slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, { name: r.title, 'post-summary': r.meta });
  await publishItems([it.id]);
  console.log('PUSHED:', r.slug, '| title[' + r.title.length + '] meta[' + r.meta.length + ']');
}
