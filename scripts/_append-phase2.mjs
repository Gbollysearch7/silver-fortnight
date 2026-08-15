import { readFileSync, writeFileSync } from 'fs';
import { getItem, updateItem, publishItems } from '../lib/webflow.mjs';

const DRY = process.argv.includes('--dry');
const sections = JSON.parse(readFileSync('data/phase2-sections-v2.json','utf8')).filter(s=>s.itemId);
const titlemeta = JSON.parse(readFileSync('data/phase2-titlemeta-final.json','utf8'));
const tmMap = {}; titlemeta.forEach(t=>tmMap[t.slug]=t);

const ts = '2026-06-21T1130Z';
const backup = [];
const results = [];
const ids = [];

console.log(`${DRY?'[DRY] ':''}Appending ${sections.length} sections (+ ${titlemeta.length} title/meta updates)\n`);

// PASS 1: full snapshot of ALL items BEFORE any write (true rollback capability)
const snap = {};
for (const s of sections) {
  const cur = await getItem(s.itemId);
  const curBody = cur.fieldData['post-body'] || '';
  snap[s.itemId] = curBody;
  backup.push({ slug:s.slug, itemId:s.itemId, name:cur.fieldData.name, 'post-summary':cur.fieldData['post-summary'], body:curBody });
}
writeFileSync(`data/seo-fixes/backup-phase2-${ts}.json`, JSON.stringify(backup,null,2));
console.log(`Backup of ${backup.length} full bodies saved BEFORE any write.\n`);

// PASS 2: append + verify
for (const s of sections) {
  try {
    const curBody = snap[s.itemId];
    // idempotency guard: skip if our first H2 already present
    const marker = s.h2s[0];
    if (marker && curBody.includes(marker)) { console.log(`SKIP (already appended) ${s.slug}`); continue; }

    const newBody = curBody + '\n' + s.sectionHtml;
    const fields = { 'post-body': newBody };
    // also apply title/meta if this page has a rewrite
    const tm = tmMap[s.slug];
    if (tm) { fields.name = tm.newTitle; fields['post-summary'] = tm.newMeta; }

    if (DRY) { console.log(`DRY  ${s.slug}  +${s.wordCount}w${tm?' +title/meta':''}`); ids.push(s.itemId); continue; }

    await updateItem(s.itemId, fields);
    const after = await getItem(s.itemId);
    const ok = (after.fieldData['post-body']||'').includes(marker) && (!tm || after.fieldData.name===tm.newTitle);
    results.push({ slug:s.slug, ok }); ids.push(s.itemId);
    console.log(`${ok?'✅':'❌'} ${s.slug}`);
  } catch(e){ results.push({slug:s.slug,ok:false,err:e.message}); console.log(`❌ ${s.slug} — ${e.message}`); }
}

if (!DRY && ids.length) {
  await publishItems(ids);
  const ok = results.filter(r=>r.ok).length;
  console.log(`\n${ok}/${results.length} appended+verified, published ${ids.length}. Backup saved.`);
} else if (DRY) {
  console.log(`\n[DRY] ${ids.length} would be updated. Backup of ${backup.length} current states saved.`);
}
