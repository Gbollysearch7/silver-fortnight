import { readFileSync, writeFileSync } from 'fs';
import { getItem, updateItem } from '../lib/webflow.mjs';

const DRY = process.argv.includes('--dry');
const rewrites = JSON.parse(readFileSync('data/ctr-rewrites-final.json','utf8'))
  .filter(r => r.itemId); // skip the 1 not in Webflow

const ts = '2026-06-20T1200Z';
const backup = [];
const results = [];

console.log(`${DRY?'[DRY RUN] ':''}Pushing ${rewrites.length} title/meta rewrites...\n`);

for (const r of rewrites) {
  try {
    // 1. backup current live values
    const cur = await getItem(r.itemId);
    backup.push({ slug:r.slug, itemId:r.itemId, name:cur.fieldData.name, 'post-summary':cur.fieldData['post-summary'] });

    if (DRY) { console.log(`DRY  ${r.slug}`); continue; }

    // 2. patch
    await updateItem(r.itemId, { name: r.newTitle, 'post-summary': r.newMeta });

    // 3. verify
    const after = await getItem(r.itemId);
    const ok = after.fieldData.name === r.newTitle && after.fieldData['post-summary'] === r.newMeta;
    results.push({ slug:r.slug, ok });
    console.log(`${ok?'✅':'❌'} ${r.slug}`);
  } catch (e) {
    results.push({ slug:r.slug, ok:false, err:e.message });
    console.log(`❌ ${r.slug} — ${e.message}`);
  }
}

writeFileSync(`data/seo-fixes/backup-titles-metas-${ts}.json`, JSON.stringify(backup,null,2));
if (!DRY) {
  const ok = results.filter(r=>r.ok).length;
  console.log(`\n${ok}/${results.length} verified live. Backup: data/seo-fixes/backup-titles-metas-${ts}.json`);
  const fails = results.filter(r=>!r.ok);
  if (fails.length) console.log('FAILED:', fails.map(f=>f.slug+(f.err?` (${f.err})`:'')).join(', '));
} else {
  console.log(`\n[DRY] Backed up ${backup.length} current values. No writes made.`);
}
