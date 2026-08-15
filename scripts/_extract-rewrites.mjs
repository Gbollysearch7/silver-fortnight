import { readFileSync, writeFileSync } from 'fs';
const raw = readFileSync('/private/tmp/claude-501/-Users-gbolahan-Documents-Active-2026-2026-projects-TY-Blog-Automation/79412bed-156a-4691-b329-5b4b44ed27fd/tasks/wlq5iopa0.output','utf8');
// the output file is the workflow result JSON (possibly wrapped). Find the JSON object.
let data;
try { data = JSON.parse(raw); }
catch {
  const m = raw.match(/\{[\s\S]*"rewrites"[\s\S]*\}\s*$/);
  data = JSON.parse(m[0]);
}
const rw = data.rewrites || data.result?.rewrites;
// merge with foundation to get itemId + before values
const found = JSON.parse(readFileSync('data/wf-pages.json','utf8'));
const fmap = {}; found.forEach(p=>fmap[p.slug]=p);
const merged = rw.map(r=>({
  slug: r.slug,
  itemId: fmap[r.slug]?.itemId || null,
  oldTitle: fmap[r.slug]?.currentTitle || '',
  oldMeta: fmap[r.slug]?.currentMeta || '',
  newTitle: r.newTitle.replace(/&amp;/g,'&'),
  newMeta: r.newMeta.replace(/&amp;/g,'&'),
  titleLen: r.newTitle.replace(/&amp;/g,'&').length,
  metaLen: r.newMeta.replace(/&amp;/g,'&').length,
  lostClicks: fmap[r.slug]?.lostClicks || 0,
  pos: fmap[r.slug]?.pos || 0,
  issues: r.issues || [],
}));
writeFileSync('data/ctr-rewrites-final.json', JSON.stringify(merged,null,2));
console.log(`Extracted ${merged.length} rewrites`);
// sanity checks
const tooLongTitle = merged.filter(m=>m.titleLen>60);
const badMeta = merged.filter(m=>m.metaLen<145||m.metaLen>162);
const noItem = merged.filter(m=>!m.itemId);
const has2025 = merged.filter(m=>/2025/.test(m.newTitle+m.newMeta));
console.log(`  titles >60ch: ${tooLongTitle.length} ${tooLongTitle.map(m=>m.slug+'('+m.titleLen+')').join(', ')}`);
console.log(`  meta out of 145-162: ${badMeta.length} ${badMeta.map(m=>m.slug+'('+m.metaLen+')').join(', ')}`);
console.log(`  missing itemId: ${noItem.length} ${noItem.map(m=>m.slug).join(', ')}`);
console.log(`  contains 2025: ${has2025.length} ${has2025.map(m=>m.slug).join(', ')}`);
