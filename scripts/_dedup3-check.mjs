import { readFileSync, writeFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
import { listItems } from '../lib/webflow.mjs';

const suffixedLive = ['drawdown-calculation-formula-for-prop-firm-challenges-522af','prop-firm-demo-account-practice-best-platforms-5c35b','how-prop-firms-manage-risk-for-funded-traders-3e4e4','are-futures-prop-firms-recommended-and-legal-18a0a','can-you-swing-trade-on-prop-firms-40bab','are-prop-firms-profitable-9be29','how-many-people-get-payouts-from-prop-firms-a8fe0','what-is-activation-fee-in-prop-firm-6beba','what-is-a-consistency-rule-in-prop-firms-03806','what-are-futures-prop-firms-7655a','are-funded-account-profit-targets-realistic-truth-revealed-f8deb','how-to-prepare-for-a-prop-firm-challenge-30-day-plan-968c6','prop-firm-trailing-drawdown-explained-with-examples-26816','15-trading-challenge-common-mistakes-to-avoid-48947','funded-account-verification-process-step-by-step-guide-a683c','funded-trader-scaling-plan-strategy-how-to-grow-your-account-fdd1f','prop-firm-challenge-spreadsheet-template-free-download-ef45c','10-essential-prop-firm-evaluation-phase-tips-to-pass-first-t-3efc0','prop-firm-kyc-requirements-what-documents-do-you-need-01a75','prop-firm-challenge-discount-codes-2026-active-deals-568fc','funded-trader-max-lot-size-calculator-for-prop-firms-a1d2c','prop-firm-payout-schedule-timeline-when-do-you-get-paid-82413','funded-trading-minimum-days-rule-what-you-need-to-know-dc54e','how-to-calculate-max-drawdown-for-prop-firm-challenges-2ff24'];

const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH, 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
const sc = google.searchconsole({ version: 'v1', auth });
const site = GSC_SITE_URL || 'sc-domain:tradersyard.com';
const fmt = d => d.toISOString().slice(0, 10);
const start = fmt(new Date(Date.now() - 92 * 864e5)), end = fmt(new Date(Date.now() - 2 * 864e5));

async function gscImp(slug) {
  const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: start, endDate: end, dimensions: ['page'], rowLimit: 10, dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog-posts/' + slug }] }] } });
  let imp = 0, clk = 0;
  for (const row of (r.data.rows || [])) if (row.keys[0].endsWith('/blog-posts/' + slug)) { imp += row.impressions; clk += row.clicks; }
  return { imp, clk };
}
async function status(slug) { const r = await fetch('https://tradersyard.com/blog-posts/' + slug, { method: 'HEAD', redirect: 'manual' }); return r.status; }

let offset = 0, all = [];
while (true) { const r = await listItems({ limit: 100, offset }); all = all.concat(r.items || []); if (!r.items || r.items.length < 100) break; offset += 100; }
const bySlug = Object.fromEntries(all.map(i => [i.fieldData?.slug, i]));

const plan = [];
for (const suf of suffixedLive) {
  const base = suf.replace(/-[0-9a-f]{5}$/, '');
  const [sSt, bSt] = await Promise.all([status(suf), status(base)]);
  const [sG, bG] = await Promise.all([gscImp(suf), gscImp(base)]);
  const sLen = (bySlug[suf]?.fieldData?.['post-body'] || '').length;
  const bLen = (bySlug[base]?.fieldData?.['post-body'] || '').length;
  let action, keeper, loser;
  if (bSt !== 200) { action = 'SKIP (base not live; suffixed is the only live copy)'; }
  else {
    // both live -> keeper by GSC impressions, tiebreak body length
    const keepBase = bG.imp > sG.imp || (bG.imp === sG.imp && bLen >= sLen);
    keeper = keepBase ? base : suf; loser = keepBase ? suf : base;
    action = 'KILL ' + loser;
  }
  plan.push({ base, suf, baseStatus: bSt, sufStatus: sSt, baseGsc: bG, sufGsc: sG, baseLen: bLen, sufLen: sLen, keeper, loser, loserId: loser ? bySlug[loser]?.id : null, action });
  console.log(base.slice(0, 55).padEnd(56), 'base:', bSt, 'imp', bG.imp, '| suf:', sSt, 'imp', sG.imp, '->', action);
}
writeFileSync('data/dedup3-plan.json', JSON.stringify(plan, null, 1));
console.log('\nplan saved: data/dedup3-plan.json | kills:', plan.filter(p => p.loser).length, '| skips:', plan.filter(p => !p.loser).length);
