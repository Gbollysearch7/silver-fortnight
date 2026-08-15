import { listItems } from '../lib/webflow.mjs';
let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
let shown = 0;
for (const it of all) {
  const body = it.fieldData?.['post-body'] || '';
  const m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (m && shown < 5) {
    const pos = body.indexOf(m[0]);
    console.log('slug:', it.fieldData.slug);
    console.log('  page title (name):', it.fieldData.name);
    console.log('  body h1 at char', pos, ':', m[0].replace(/<[^>]+>/g, ' ').trim().slice(0, 90));
    shown++;
  }
}
