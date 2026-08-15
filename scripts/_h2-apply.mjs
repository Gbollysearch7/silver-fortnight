import { readFileSync, writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

const { sections } = JSON.parse(readFileSync('data/h2-sections-draft.json', 'utf8'));
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }

for (const s of sections) {
  const it = all.find(i => i.fieldData?.slug === s.slug);
  let body = it.fieldData['post-body'];
  if (body.includes(s.html.slice(0, 120))) { console.log('SKIP (already inserted):', s.slug); continue; }
  let idx = -1;
  if (s.insertBefore === 'Related guides') idx = body.indexOf('<!--ty-related-->');
  if (idx < 0 && s.insertBefore) {
    const m = body.match(new RegExp('<h2[^>]*>(?:(?!</h2>).)*?' + s.insertBefore.replace(/[?]/g, '\\?')));
    if (m) idx = m.index;
  }
  if (idx < 0) idx = body.length;
  writeFileSync(`data/seo-fixes/backup-h2sec-${s.slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
  const newBody = body.slice(0, idx) + s.html + body.slice(idx);
  await updateItem(it.id, { 'post-body': newBody });
  await publishItems([it.id]);
  console.log('INSERTED at char ' + idx + ' of ' + body.length + ':', s.slug);
}
