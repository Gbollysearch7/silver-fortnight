import { writeFileSync, readFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

const AUTHOR_ID = '690a06c1de16d23295adcf70'; // TradersYard Team (has avatar)
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }

const keepout = new Set(JSON.parse(readFileSync('data/unpublished-keepout.json', 'utf8')).items.map(i => i.id));
const missing = all.filter(i => !i.fieldData?.author);
console.log('posts missing author:', missing.length);

writeFileSync('data/seo-fixes/backup-author-refs-2026-07-02.json', JSON.stringify(missing.map(i => ({ id: i.id, slug: i.fieldData?.slug, author: i.fieldData?.author || null })), null, 1));

const toPublish = [];
let n = 0;
for (const it of missing) {
  await updateItem(it.id, { author: AUTHOR_ID });
  if (!keepout.has(it.id) && !it.isDraft) toPublish.push(it.id);
  n++;
  if (n % 25 === 0) console.log('updated', n, '/', missing.length);
}
console.log('updated all', n);

for (let i = 0; i < toPublish.length; i += 50) {
  await publishItems(toPublish.slice(i, i + 50));
  console.log('published batch', i / 50 + 1);
}
console.log('done. published:', toPublish.length, '| left unpublished (keepout/draft):', missing.length - toPublish.length);
