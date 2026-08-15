/**
 * apply-rewrite.mjs — Loop 1 executor (deterministic applier)
 *
 * Takes GATED rewrites (produced by the rewrite agent using
 * docs/LOOP1-REWRITE-PROMPT.md and approved by the content gate) and applies
 * them to live Webflow items with full backup/verify/ledger discipline.
 * The judgment lives in the agent; this script only executes.
 *
 * Input file (default data/rewrites-approved.json):
 * { "rewrites": [ { "page": "https://tradersyard.com/blog-posts/<slug>",
 *                   "new_title": "...", "new_meta_title": "... | TY",
 *                   "new_meta_description": "...", "ctr_before": 0.55 } ] }
 *
 * Usage:
 *   node scripts/apply-rewrite.mjs --dry-run
 *   node scripts/apply-rewrite.mjs
 *   node scripts/apply-rewrite.mjs --input data/rewrites-approved.json
 *
 * Per rewrite: backup item → patch name/post-summary (+ sync body <h1>) →
 * publish → verify live → append rewrite-ledger → submit URL to Google.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printInfo, printSuccess, printWarning, printError } from '../lib/utils.mjs';
import { listItems, updateItem, publishItems, getItem } from '../lib/webflow.mjs';

const args = parseArgs(process.argv.slice(2));
const DRY = !!args['dry-run'];
const inputPath = resolve(args.input || resolve(DATA_DIR, 'rewrites-approved.json'));
if (!existsSync(inputPath)) { printError(`Input not found: ${inputPath}`); process.exit(1); }
const { rewrites = [] } = JSON.parse(readFileSync(inputPath, 'utf-8'));
if (!rewrites.length) { printError('No rewrites in input.'); process.exit(1); }

// hard limits — this script refuses oversized batches by design
if (rewrites.length > 15) { printError(`Batch of ${rewrites.length} exceeds the 15-rewrite safety cap.`); process.exit(1); }
for (const r of rewrites) {
  const fail = [];
  if (!r.page || !r.new_meta_title || !r.new_meta_description) fail.push('missing fields');
  if (r.new_meta_title && r.new_meta_title.length > 60) fail.push(`meta_title ${r.new_meta_title.length}ch > 60`);
  if (r.new_meta_description && (r.new_meta_description.length < 140 || r.new_meta_description.length > 165)) fail.push(`meta_description ${r.new_meta_description.length}ch outside 140-165`);
  if (/[—–]/.test(`${r.new_title || ''}${r.new_meta_title}${r.new_meta_description}`)) fail.push('em/en dash');
  if (fail.length) { printError(`REJECTED ${r.page}: ${fail.join('; ')}`); process.exit(1); }
}

// map slugs → live items (one paginated scan)
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

const today = new Date().toISOString().slice(0, 10);
const backupDir = resolve(DATA_DIR, `rewrite-backups/${today}`);
const ledgerPath = resolve(DATA_DIR, 'rewrite-ledger.json');
const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, 'utf-8')) : { pages: {} };
const patchedIds = [], receipts = [];

for (const r of rewrites) {
  const slug = r.page.replace(/^https?:\/\/tradersyard\.com\/blog-posts\//, '').split('#')[0];
  const item = bySlug.get(slug);
  if (!item) { printError(`NOT FOUND live: ${slug} — skipping`); continue; }
  const fd = item.fieldData;

  if (DRY) {
    printInfo(`WOULD patch ${slug}: name "${fd.name}" → "${r.new_meta_title}"`);
    continue;
  }

  mkdirSync(backupDir, { recursive: true });
  writeFileSync(resolve(backupDir, `${slug}.json`), JSON.stringify(item, null, 2));

  const patch = { name: r.new_meta_title, 'post-summary': r.new_meta_description };
  // sync the in-body <h1> if present and a new_title was provided
  if (r.new_title && fd['post-body']) {
    const body = fd['post-body'];
    const m = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (m) patch['post-body'] = body.replace(m[0], m[0].replace(m[1], r.new_title));
  }
  await updateItem(item.id, patch);
  patchedIds.push(item.id);

  const entries = ledger.pages[r.page] || (ledger.pages[r.page] = []);
  entries.push({ date: today, attempt: entries.length + 1, ctr_before: r.ctr_before ?? null, ctr_after: null, title_after: r.new_meta_title });
  receipts.push({ slug, id: item.id, old_name: fd.name, new_name: r.new_meta_title });
  printSuccess(`patched ${slug} (${item.id})`);
}

if (DRY) { printInfo('Dry run complete.'); process.exit(0); }
if (!patchedIds.length) { printError('Nothing patched.'); process.exit(1); }

printInfo(`Publishing ${patchedIds.length} item(s)...`);
await publishItems(patchedIds);
writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));

// verify + index
let failures = 0;
for (const rc of receipts) {
  const it = await getItem(rc.id);
  const ok = it.fieldData.name === rc.new_name;
  if (!ok) { printError(`VERIFY FAILED: ${rc.slug} name is "${it.fieldData.name}"`); failures++; continue; }
  const url = `https://tradersyard.com/blog-posts/${rc.slug}`;
  const live = await fetch(url).then(x => x.status).catch(() => 0);
  if (live !== 200) { printWarning(`live check ${rc.slug}: HTTP ${live}`); }
  const idx = spawnSync('node', ['scripts/index.mjs', '--url', url], { cwd: process.cwd(), encoding: 'utf-8' });
  printInfo(`  ${rc.slug}: verified · indexed=${idx.status === 0 ? 'submitted' : 'FAILED (run manually)'}`);
}
writeFileSync(resolve(DATA_DIR, `rewrite-receipts-${today}.json`), JSON.stringify(receipts, null, 2));
printSuccess(`Done: ${receipts.length - failures}/${receipts.length} rewrites live. Ledger + receipts updated. Backups: data/rewrite-backups/${today}/`);
process.exit(failures ? 1 : 0);
