import csvParse from 'node:util';
import { readFileSync, writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

// dead external targets from the 03-Jul crawl (status 404 confirmed by Ahrefs)
const targets = [
  'https://www.investopedia.com/terms/p/prop-trading.asp',
  'https://tradefundrr.com/risk-management-rules-in-prop-trading/',
  'https://www.investopedia.com/terms/f/forex-broker.asp',
  'https://www.babypips.com/learn/forex/position-sizing',
  'https://www.babypips.com/learn/forex/what-is-prop-trading',
  'https://www.investopedia.com/terms/o/overnightposition.asp',
  'https://www.babypips.com/learn/forex/how-to-keep-a-trading-journal',
  'https://www.investopedia.com/terms/r/regulator.asp',
];
// verify each is really dead before unwrapping
const dead = [];
for (const t of targets) {
  try { const r = await fetch(t, { method: 'HEAD', redirect: 'follow' }); if (r.status >= 400) dead.push(t); else console.log('alive, skip:', t.slice(0, 70), r.status); }
  catch { dead.push(t); }
}
console.log('confirmed dead:', dead.length);

let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
const keepout = new Set(JSON.parse(readFileSync('data/unpublished-keepout.json','utf8')).items.map(i=>i.id));
let fixed = 0;
for (const it of all) {
  let body = it.fieldData?.['post-body'] || '';
  if (!body) continue;
  let changed = false;
  for (const t of dead) {
    const esc = t.replace(/[/.?+*()]/g, '\\$&');
    const re = new RegExp('<a\\b[^>]*href="' + esc + '/?"[^>]*>([\\s\\S]*?)</a>', 'g');
    if (re.test(body)) { body = body.replace(re, '$1'); changed = true; }
  }
  if (!changed) continue;
  writeFileSync(`data/seo-fixes/backup-extdead-${it.fieldData.slug}-2026-07-04.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, { 'post-body': body });
  if (!keepout.has(it.id) && !it.isDraft) await publishItems([it.id]);
  fixed++; console.log('unwrapped in:', it.fieldData.slug);
}
console.log('posts fixed:', fixed);
