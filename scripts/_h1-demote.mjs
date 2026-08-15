import { writeFileSync, readFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
const keepout = new Set(JSON.parse(readFileSync('data/unpublished-keepout.json', 'utf8')).items.map(i => i.id));

const toPublish = [];
let fixed = 0;
for (const it of all) {
  const body = it.fieldData?.['post-body'] || '';
  if (!/<h1[\s>]/.test(body)) continue;
  const newBody = body.replace(/<h1(\s[^>]*)?>/g, '<h2$1>').replace(/<\/h1>/g, '</h2>');
  writeFileSync(`data/seo-fixes/backup-h1-${it.fieldData.slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, { 'post-body': newBody });
  if (!keepout.has(it.id) && !it.isDraft) toPublish.push(it.id);
  fixed++;
  if (fixed % 20 === 0) console.log('fixed', fixed);
}
for (let i = 0; i < toPublish.length; i += 50) await publishItems(toPublish.slice(i, i + 50));
console.log('done. posts fixed:', fixed, '| published:', toPublish.length);
