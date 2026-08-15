import { readFileSync, writeFileSync } from 'fs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

const DRY = process.argv.includes('--dry-run');

// dead slug -> replacement slug (verified live keeper) | 'UNWRAP'
const MAP = {
  'how-do-prop-firms-make-money': 'are-prop-firms-profitable',
  'funded-trader-profit-split-calculator-calculate-your-earning-2c346': 'funded-trader-profit-split-calculator-calculate-your-earning',
  'funded-trader-profit-split-calculator': 'funded-trader-profit-split-calculator-calculate-your-earning',
  'prop-firm-profit-split-explained': 'prop-firm-payouts-profit-split-withdrawals',
  'prop-firm-payout-guide': 'prop-firm-payouts-profit-split-withdrawals',
  'prop-firm-payout-process-explained': 'prop-firm-payout-schedule-timeline-when-do-you-get-paid',
  'prop-firm-drawdown-rules-explained': 'how-to-calculate-max-drawdown-for-prop-firm-challenges',
  'prop-firm-drawdown-rules': 'how-to-calculate-max-drawdown-for-prop-firm-challenges',
  'daily-drawdown-vs-max-drawdown-explained': 'daily-loss-limits-vs-trailing-drawdowns',
  'prop-firm-trailing-drawdown-explained': 'prop-firm-trailing-drawdown-explained-with-examples',
  'prop-firm-no-trailing-drawdown': 'no-trailing-drawdown-prop-firm',
  'how-to-pass-forex-prop-firm-challenge-21ab2': 'how-to-pass-forex-prop-firm-challenge',
  'how-many-people-fail-prop-firm-challenges-01012': 'how-many-people-fail-prop-firm-challenges',
  'how-prop-firm-challenges-work': 'what-is-prop-firm-challenge',
  'how-a-trading-challenge-works': 'what-is-prop-firm-challenge',
  'passing-a-prop-firm-challenge': 'how-to-pass-a-prop-firm-challenge',
  'prop-firm-evaluation-process-explained': 'what-is-prop-firm-challenge',
  'prop-firm-challenge-rules-explained': 'prop-firm-rules-explained',
  'prop-firm-risk-management-rules': 'prop-firm-rules-and-risk-management',
  'prop-firm-rules-that-get-traders-banned': 'prop-firm-rules-explained',
  'prohibited-trading-strategies': 'prop-firm-rules-and-risk-management',
  'prop-firm-consistency-rule-explained': 'funded-trader-consistency-rule-examples-and-how-to-meet-it',
  'how-prop-firm-funding-works': 'what-is-a-prop-firm-and-how-do-they-work',
  'how-prop-firm-funded-accounts-work': 'which-prop-firm-gives-real-account',
  'do-prop-firm-challenges-have-a-time-limit': 'do-prop-firm-tests-have-time-limit',
  'prop-firm-leverage-comparison-table-2026': 'leverage-prop-trading-key-rules',
  'best-crypto-prop-firms': 'are-there-prop-firms-for-crypto',
  'crypto-options-vs-futures-trading': 'prop-firms-options-trading',
  'prop-firm-challenge-spreadsheet-template': 'prop-firm-challenge-spreadsheet-template-free-download',
  'prop-firm-red-flags': 'are-prop-firms-legit-profitable-halal',
  'position-sizing-for-prop-firm-challenges': 'funded-trader-max-lot-size-calculator-for-prop-firms',
  'prop-firms-that-allow-hft': 'what-prop-firms-allow-hft',
};
const UNWRAP_HOSTS = [
  /href="https?:\/\/(www\.)?tradersyard\.com\/community\/?"/,
  /href="https?:\/\/docs\.tradersyard\.com\/traderchallenge\/rules\/prohibited-trading-practices\/?"/,
];
const DOCS_REPLACEMENT = 'https://tradersyard.com/blog-posts/prop-firm-rules-and-risk-management';

// 1. validate all replacement targets are live (HTTP 200)
const targets = [...new Set(Object.values(MAP))];
console.log('validating', targets.length, 'replacement targets live...');
for (const t of targets) {
  const r = await fetch('https://tradersyard.com/blog-posts/' + t, { method: 'HEAD', redirect: 'manual' });
  if (r.status !== 200) { console.error('ABORT: target not live:', t, r.status); process.exit(1); }
}
console.log('all targets 200 OK\n');

// 2. load CMS
let offset = 0, all = [];
while (true) {
  const r = await listItems({ limit: 100, offset });
  all = all.concat(r.items || []);
  if (!r.items || r.items.length < 100) break;
  offset += 100;
}

// 3. process
const log = [];
for (const it of all) {
  let body = it.fieldData?.['post-body'] || '';
  const slug = it.fieldData?.slug;
  if (!body) continue;
  let changed = false; const changes = [];

  for (const [dead, repl] of Object.entries(MAP)) {
    if (repl === slug) {
      const selfRe = new RegExp('<a\\b[^>]*href="[^"]*/blog-posts/' + dead + '(#[^"]*)?/?"[^>]*>([\\s\\S]*?)</a>', 'g');
      if (selfRe.test(body)) { body = body.replace(selfRe, '$2'); changed = true; changes.push(dead + ' -> unwrapped (self)'); }
      continue;
    }
    const re = new RegExp('(href=")[^"]*/blog-posts/' + dead + '(#[^"]*)?(/?")', 'g');
    if (re.test(body)) {
      body = body.replace(re, '$1https://tradersyard.com/blog-posts/' + repl + '$3');
      changed = true; changes.push(dead + ' -> ' + repl);
    }
  }
  // unwrap community + fix docs link
  const commRe = /<a\b[^>]*href="https?:\/\/(?:www\.)?tradersyard\.com\/community\/?"[^>]*>([\s\S]*?)<\/a>/g;
  if (commRe.test(body)) { body = body.replace(commRe, '$1'); changed = true; changes.push('/community -> unwrapped'); }
  const docsRe = /(href=")https?:\/\/docs\.tradersyard\.com\/traderchallenge\/rules\/prohibited-trading-practices\/?(")/g;
  if (docsRe.test(body)) { body = body.replace(docsRe, '$1' + DOCS_REPLACEMENT + '$2'); changed = true; changes.push('docs prohibited-practices -> rules pillar'); }

  if (!changed) continue;

  // never touch/publish an unpublished dedup duplicate: source must itself be live
  const liveCheck = await fetch('https://tradersyard.com/blog-posts/' + slug, { method: 'HEAD', redirect: 'manual' });
  const sourceLive = liveCheck.status === 200;
  log.push({ slug, id: it.id, sourceLive, changes });
  console.log((sourceLive ? 'FIX  ' : 'SKIP (not live) ') + slug);
  for (const c of changes) console.log('     ', c);
  if (DRY || !sourceLive) continue;

  // backup, update, publish
  writeFileSync(`data/seo-fixes/backup-deadlink-${slug}-${new Date().toISOString().slice(0,16).replace(/:/g,'-')}Z.json`, JSON.stringify(it, null, 1));
  await updateItem(it.id, { 'post-body': body });
  await publishItems([it.id]);
}
writeFileSync('data/deadlink-fix-log.json', JSON.stringify({ dry: DRY, at: new Date().toISOString(), log }, null, 1));
console.log('\n' + (DRY ? 'DRY RUN — no writes.' : 'DONE.'), 'posts needing changes:', log.length, '| live sources fixed:', log.filter(l => l.sourceLive).length);
