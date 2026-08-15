/**
 * apply-links.mjs — Loop 4 executor (internal link insertion)
 *
 * Applies a link plan to live posts using the established related-guides
 * convention: appends <li> items into the existing <!--ty-related--> block,
 * or creates the block at the end of the body if absent.
 *
 * Usage:
 *   node scripts/apply-links.mjs --plan data/link-plan-2026-08-15.json --dry-run
 *   node scripts/apply-links.mjs --plan data/link-plan-2026-08-15.json
 *
 * Per host: backup item → insert link(s) (skip if already linked) → update →
 * publish → verify link present in live item.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printInfo, printSuccess, printWarning, printError } from '../lib/utils.mjs';
import { listItems, updateItem, publishItems, getItem } from '../lib/webflow.mjs';

const args = parseArgs(process.argv.slice(2));
const DRY = !!args['dry-run'];
const planPath = resolve(args.plan || resolve(DATA_DIR, 'link-plan.json'));
if (!existsSync(planPath)) { printError(`Plan not found: ${planPath}`); process.exit(1); }
const { inserts = [] } = JSON.parse(readFileSync(planPath, 'utf-8'));
if (!inserts.length) { printError('Empty plan.'); process.exit(1); }
if (inserts.length > 15) { printError(`${inserts.length} hosts exceeds the 15-host safety cap.`); process.exit(1); }

const LI = (url, anchor) => `<li><a href="${url}">${anchor}</a></li>`;
const BLOCK = (lis) => `\n<!--ty-related--><h2>Related guides</h2><ul>${lis.join('')}</ul>`;

printInfo('Scanning live collection...');
const bySlug = new Map();
let offset = 0, total = null;
while (true) {
  const res = await listItems({ limit: 100, offset });
  for (const it of res.items || []) bySlug.set(it.fieldData?.slug, it);
  total = res.pagination?.total ?? total;
  offset += (res.items || []).length;
  if (!(res.items || []).length || (total !== null && offset >= total)) break;
}

// validate all targets are live before touching anything
for (const ins of inserts) {
  if (!bySlug.has(ins.host)) { printError(`Host not live: ${ins.host}`); process.exit(1); }
  for (const l of ins.links) if (!bySlug.has(l.target)) { printError(`Target not live: ${l.target}`); process.exit(1); }
}

const today = new Date().toISOString().slice(0, 10);
const backupDir = resolve(DATA_DIR, `link-backups/${today}`);
const patched = [], receipts = [];

for (const ins of inserts) {
  const item = bySlug.get(ins.host);
  let body = item.fieldData['post-body'] || '';
  const adds = [];
  for (const l of ins.links) {
    const url = `https://tradersyard.com/blog-posts/${l.target}`;
    if (body.includes(`/blog-posts/${l.target}`)) { printInfo(`  already links ${l.target}: ${ins.host} — skip`); continue; }
    adds.push({ url, anchor: l.anchor, target: l.target });
  }
  if (!adds.length) continue;

  if (DRY) { printInfo(`WOULD add ${adds.length} link(s) to ${ins.host}: ${adds.map(a => a.target).join(', ')}`); continue; }

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(resolve(backupDir, `${ins.host}.json`), JSON.stringify(item, null, 2));

  const markerIdx = body.indexOf('<!--ty-related-->');
  if (markerIdx > -1) {
    const ulEnd = body.indexOf('</ul>', markerIdx);
    if (ulEnd > -1) body = body.slice(0, ulEnd) + adds.map(a => LI(a.url, a.anchor)).join('') + body.slice(ulEnd);
    else body += BLOCK(adds.map(a => LI(a.url, a.anchor)));
  } else {
    body += BLOCK(adds.map(a => LI(a.url, a.anchor)));
  }

  await updateItem(item.id, { 'post-body': body });
  patched.push(item.id);
  receipts.push({ host: ins.host, id: item.id, added: adds.map(a => a.target) });
  printSuccess(`patched ${ins.host} (+${adds.length})`);
}

if (DRY) { printInfo('Dry run complete.'); process.exit(0); }
if (!patched.length) { printWarning('Nothing to patch (all links already present).'); process.exit(0); }

printInfo(`Publishing ${patched.length} host(s)...`);
await publishItems(patched);

let failures = 0;
for (const rc of receipts) {
  const it = await getItem(rc.id);
  const b = it.fieldData['post-body'] || '';
  const missing = rc.added.filter(t => !b.includes(`/blog-posts/${t}`));
  if (missing.length) { printError(`VERIFY FAILED ${rc.host}: missing ${missing.join(',')}`); failures++; }
}
writeFileSync(resolve(DATA_DIR, `link-receipts-${today}.json`), JSON.stringify(receipts, null, 2));
printSuccess(`Done: ${receipts.length - failures}/${receipts.length} hosts verified. Backups: data/link-backups/${today}/`);
process.exit(failures ? 1 : 0);
