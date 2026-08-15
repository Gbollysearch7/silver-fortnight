/**
 * link-sweep.mjs — Loop 4 analyzer (internal link graph health)
 *
 * Builds the internal link graph from live post bodies and reports:
 *   - orphans (0 inbound internal links)
 *   - under-linked posts (< 2 inbound)
 *   - pillar in-link counts vs targets (pillars want 15-30+)
 *   - outbound-light posts (< 3 outbound internal links)
 *
 * Read-only. Output feeds the agent playbook (link insertion is judgment work:
 * anchors must be relevant, links must flow UP supporting → hub → pillar).
 *
 * Usage:
 *   node scripts/link-sweep.mjs           # writes data/link-tickets.json
 *   node scripts/link-sweep.mjs --top 15  # show more rows in console
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printInfo, printSuccess, printWarning } from '../lib/utils.mjs';
import { listItems } from '../lib/webflow.mjs';

const args = parseArgs(process.argv.slice(2));
const TOP = parseInt(args.top || '10', 10);
const PILLARS = ['best-prop-firms', 'what-is-a-prop-firm', 'futures-prop-firms', 'prop-firm-payouts-profit-split-withdrawals'];

printInfo('Scanning live collection bodies...');
const posts = [];
let offset = 0, total = null;
while (true) {
  const res = await listItems({ limit: 100, offset });
  for (const it of res.items || []) {
    if (it.isDraft || it.isArchived) continue;
    posts.push({ slug: it.fieldData?.slug, name: it.fieldData?.name || '', body: it.fieldData?.['post-body'] || '' });
  }
  total = res.pagination?.total ?? total;
  offset += (res.items || []).length;
  if (!(res.items || []).length || (total !== null && offset >= total)) break;
}
const liveSlugs = new Set(posts.map(p => p.slug));

const inbound = new Map(), outbound = new Map();
for (const p of posts) {
  const targets = new Set(
    [...p.body.matchAll(/tradersyard\.com\/blog-posts\/([a-z0-9-]+)/g)]
      .map(m => m[1].split('#')[0])
      .filter(s => s !== p.slug && liveSlugs.has(s))
  );
  outbound.set(p.slug, targets.size);
  for (const t of targets) inbound.set(t, (inbound.get(t) || 0) + 1);
}

const rows = posts.map(p => ({ slug: p.slug, name: p.name, in: inbound.get(p.slug) || 0, out: outbound.get(p.slug) || 0 }));
const orphans = rows.filter(r => r.in === 0).sort((a, b) => a.out - b.out);
const underlinked = rows.filter(r => r.in === 1);
const outboundLight = rows.filter(r => r.out < 3 && !PILLARS.includes(r.slug));
const pillarStats = PILLARS.map(s => ({ slug: s, inbound: inbound.get(s) || 0, target: '15-30+' }));

const report = {
  generated: new Date().toISOString().slice(0, 10),
  totals: { live_posts: posts.length, orphans: orphans.length, underlinked: underlinked.length, outbound_light: outboundLight.length },
  pillar_inlinks: pillarStats,
  orphans,
  underlinked,
  outbound_light: outboundLight,
  playbook: 'Agent: for each orphan pick 2-4 topically-related live posts and insert a natural anchor link (target keyword as anchor, links flow UP supporting→hub→pillar). Route inserts through content gate → apply with backup → publish → verify. Never link competitor firms; never link blog.tradersyard.com.',
};
writeFileSync(resolve(DATA_DIR, 'link-tickets.json'), JSON.stringify(report, null, 2));

printSuccess(`Link graph: ${posts.length} live posts scanned`);
printInfo(`Pillar in-links: ${pillarStats.map(p => `${p.slug}=${p.inbound}`).join(' · ')}`);
if (orphans.length) {
  printWarning(`Orphans (0 inbound): ${orphans.length}`);
  for (const o of orphans.slice(0, TOP)) console.log(`   in:0 out:${o.out} | ${o.slug}`);
} else printSuccess('No orphans.');
printInfo(`Under-linked (1 inbound): ${underlinked.length} · outbound-light (<3 out): ${outboundLight.length}`);
printSuccess('Tickets written: data/link-tickets.json');
