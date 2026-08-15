import { readFileSync, writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

const DRY = process.argv.includes('--dry-run');
const TARGETS = [
  { slug: 'prop-firm-demo-account-practice-best-platforms', anchor: 'Prop Firm Demo Accounts and Free Practice', re: /demo account|paper trad|practice/i, max: 5 },
  { slug: 'best-prop-firms-for-day-trading-in-2026', anchor: 'Best Prop Firms for Day Traders', re: /day trad|intraday|scalp/i, max: 5 },
  { slug: 'how-many-people-get-payouts-from-prop-firms', anchor: 'How Often Do Prop Firms Pay Out? The Real Numbers', re: /payout|withdraw|get paid/i, max: 4 },
  { slug: 'which-prop-firm-gives-real-account', anchor: 'Which Prop Firms Give Real Capital', re: /real account|simulated|sim account|real capital|legit/i, max: 5 },
  { slug: 'prop-firm-copy-trading', anchor: 'Prop Firm Copy Trading Rules', re: /copy trad|social trad|multi.account/i, max: 4 },
  { slug: 'which-futures-prop-trading-firm-offers-the-fastest-payout', anchor: 'Fastest Futures Prop Firm Payouts', re: /futures/i, max: 4 },
];

let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
const keepout = new Set(JSON.parse(readFileSync('data/unpublished-keepout.json', 'utf8')).items.map(i => i.id));

// plan: source slug -> [{target, anchor}]
const plan = new Map();
const perSourceCap = 2; // don't stuff any single source post
for (const t of TARGETS) {
  const scored = [];
  for (const it of all) {
    const slug = it.fieldData?.slug, body = it.fieldData?.['post-body'] || '';
    if (!slug || slug === t.slug || !body || keepout.has(it.id) || it.isDraft) continue;
    if (body.includes('/blog-posts/' + t.slug)) continue;
    if ((plan.get(slug) || []).length >= perSourceCap) continue;
    const m = (body.match(new RegExp(t.re.source, 'gi')) || []).length;
    if (m >= 3) scored.push({ slug, id: it.id, score: m });
  }
  scored.sort((a, b) => b.score - a.score);
  for (const s of scored.slice(0, t.max)) {
    if (!plan.has(s.slug)) plan.set(s.slug, []);
    plan.get(s.slug).push({ target: t.slug, anchor: t.anchor });
  }
}

let touched = 0, links = 0;
for (const [slug, adds] of plan) {
  const it = all.find(i => i.fieldData?.slug === slug);
  let body = it.fieldData['post-body'];
  const lis = adds.map(a => `<li><a href="https://tradersyard.com/blog-posts/${a.target}">${a.anchor}</a></li>`).join('');
  if (body.includes('<!--ty-related-->')) {
    body = body.replace(/(<!--ty-related-->[\s\S]*?<ul>)/, '$1' + lis);
  } else {
    body += `<!--ty-related--><h2 style="font-size:2rem;font-weight:700;color:#e2e8f0;margin:32px 0 24px;">Related guides</h2><ul style="color:#e2e8f0;line-height:1.8;">${lis}</ul>`;
  }
  console.log((DRY ? 'WOULD ADD ' : 'ADDED ') + adds.length + ' link(s) to ' + slug + ' -> ' + adds.map(a => a.target.slice(0, 40)).join(', '));
  touched++; links += adds.length;
  if (DRY) continue;
  writeFileSync(`data/seo-fixes/backup-anchor-${slug}-2026-07-02.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, { 'post-body': body });
  await publishItems([it.id]);
}
console.log(`\n${DRY ? 'DRY RUN. ' : ''}sources touched: ${touched} | links added: ${links}`);
