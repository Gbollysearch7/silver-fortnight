#!/usr/bin/env node
// Build a 6-month pillar→supporting content plan from a keyword research pull.
// Input: data/keyword-research-wide.json   Output: data/content-plan.json + HTML report
//
//   node scripts/build-content-plan.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { ROOT_DIR } from '../lib/config.mjs';
import { slugify } from '../lib/utils.mjs';

const IN = resolve(ROOT_DIR, 'data/keyword-research-wide.json');
const OUT_JSON = resolve(ROOT_DIR, 'data/content-plan.json');
const OUT_HTML = resolve(ROOT_DIR, 'output/reports/six-month-content-plan.html');

const d = JSON.parse(readFileSync(IN, 'utf8'));

// ---------- 1. Clean: strip competitor brands + off-topic noise ----------
const BRANDS = ['ftmo','e8 ','e8funding','apex','tradify','funding ticks','dna funded','the funded trader',
  'traders launch','my forex fund','my funded','fundednext','funded next','topstep','top step','myfunded',
  '5%ers','5ers','bulenox','goat funded','blueberry','maven','alpha capital','city traders','lux trading',
  'audacity','funding pips','funded peaks','fundedtrader','breakout','aquafunded','aqua funded','glow node',
  'nordic funder','tradeday','trade day','mff','tickticktrader','take profit trader','earn2trade','uprofit',
  'leeloo','elite trader funding','tradeified'];
const OFFTOPIC = ['accountant','accounting','hedge fund account','fund of accounting','fund to fund','fund accounting',
  'senior fund','salary','jobs','resume','venmo','go fund me','gofundme','fantat','firm accounts','sports betting',
  'trust fund','mutual fund','etf','401k','retirement','college fund','sba','grant','crowdfund','firm account'];

const clean = d.keywords.filter(k => {
  const kw = k.keyword.toLowerCase();
  if (BRANDS.some(b => kw.includes(b))) return false;
  if (OFFTOPIC.some(o => kw.includes(o))) return false;
  return true;
});

// dedupe near-identical (singular/plural)
const norm = s => s.toLowerCase().replace(/[^a-z ]/g,'').replace(/s\b/g,'').replace(/\s+/g,' ').trim();
const byNorm = new Map();
for (const k of clean) {
  const n = norm(k.keyword);
  if (!byNorm.has(n) || k.volume > byNorm.get(n).volume) byNorm.set(n, k);
}
let kws = [...byNorm.values()];

// ---------- 2. KGR proxy tier from difficulty ----------
// SE Ranking difficulty stands in for KGR (no allintitle in API).
// Tier 0 = easiest (KGR<0.25 equivalent). Maps to the avalanche tiers in CLAUDE.md.
const tierOf = (diff) => diff <= 10 ? 0 : diff <= 18 ? 10 : diff <= 25 ? 20 : 35;
for (const k of kws) {
  k.tier = tierOf(k.difficulty);
  k.kgr_proxy = Math.round((k.difficulty / Math.max(k.volume, 1)) * 1000) / 1000; // lower = better
}

// ---------- 3. Pillar / cluster assignment ----------
// Each pillar = a money/topic hub. Supporting = the KGR articles that link up to it.
const PILLARS = [
  { id:'what-is-prop',   name:'What Is a Prop Firm / Funded Account', match:/(what is|what are|what's|whats|how do|how does|meaning|funded account|funded trading|proprietary trading|prop trading)/ },
  { id:'challenge',      name:'Prop Firm Challenge & Evaluation',      match:/(challenge|evaluation|pass|passing|phase|how to pass|first try|tips)/ },
  { id:'rules',          name:'Prop Firm Rules & Risk',                match:/(rule|consistency|drawdown|max|limit|trailing|daily loss|lot size)/ },
  { id:'payouts',        name:'Payouts, Profit Split & Withdrawals',   match:/(payout|profit split|withdraw|paid|salary|earning|scaling|scale)/ },
  { id:'futures',        name:'Futures Prop Firms',                    match:/(futures|cme|micro|es |nq |proprietary futures)/ },
  { id:'forex',          name:'Forex Prop Firms',                      match:/(forex|fx )/ },
  { id:'options',        name:'Options Prop Firms',                    match:/(option)/ },
  { id:'instant',        name:'Instant Funding',                       match:/(instant)/ },
  { id:'best-of',        name:'Best Prop Firms (Comparison)',          match:/(best|top|reddit|review|compare|vs |cheap|cheapest|discount|coupon|free|us traders|beginners|day trading|swing|hft|crypto)/ },
];
const PILLAR_FALLBACK = { id:'general', name:'Prop Firm Basics (General)' };

function assignPillar(kw) {
  const k = kw.toLowerCase();
  for (const p of PILLARS) if (p.match.test(k)) return p.id;
  return PILLAR_FALLBACK.id;
}
for (const k of kws) k.pillar = assignPillar(k.keyword);

// ---------- 4. Group + pick pillar head vs supporting ----------
// Canonical hub keyword per pillar — the term the pillar article should target.
// Prefer the cleanest broad-match term present in the cluster; fall back to highest volume.
const HUB_PREF = {
  'what-is-prop': ['what is a prop firm','what is a funded account in trading','funded account meaning','what is prop trading'],
  'challenge':    ['prop firm challenge','how to pass a prop firm challenge','trading challenge'],
  'rules':        ['prop firm rules','prop firm without consistency rule','consistency rule prop firm'],
  'payouts':      ['prop firm payout','prop firm profit split','daily payout prop firm'],
  'futures':      ['futures prop firms','futures prop trading firms','prop firm for futures'],
  'forex':        ['forex prop firms','best forex prop firm','forex prop firm'],
  'options':      ['options prop trading firms','option trading prop firm'],
  'instant':      ['instant funded account','instant funding prop firm','instant funded prop firms'],
  'best-of':      ['best prop firms','best prop firms for beginners','best prop firms reddit'],
  'general':      ['prop firm','what are prop firms','prop trading firms'],
};
const allPillars = [...PILLARS, PILLAR_FALLBACK];
const groups = allPillars.map(p => {
  let items = kws.filter(k => k.pillar === p.id).sort((a,b) => b.volume - a.volume);
  // Pillar head = canonical hub term if present in cluster, else highest-volume term.
  const prefs = HUB_PREF[p.id] || [];
  let head = null;
  for (const pref of prefs) {
    head = items.find(k => k.keyword.toLowerCase() === pref);
    if (head) break;
  }
  if (!head) head = items[0] || null;
  const supporting = items.filter(k => k !== head);
  const vol = items.reduce((s,k) => s + k.volume, 0);
  return { ...p, head, supporting, count: items.length, vol, avgDiff: items.length ? Math.round(items.reduce((s,k)=>s+k.difficulty,0)/items.length) : 0 };
}).filter(g => g.count > 0).sort((a,b) => b.vol - a.vol);

// ---------- 5. 6-month schedule ----------
// Strategy (per content-strategy memory): supporting/KGR first (tier 0), pillars after the cluster has support.
// Cadence: ~5 articles/week = ~22/month = ~130 over 6 months.
const PER_MONTH = 22;
// Flatten into a publish queue: tier 0 supporting first, interleaved by pillar, then tier 10, pillars dropped in once their cluster has >=5 supporting live.
const queue = [];
const supportingSorted = kws
  .filter(k => k !== null)
  .sort((a,b) => (a.tier - b.tier) || (b.volume/(b.difficulty+5) - a.volume/(a.difficulty+5)));

// Track how many supporting per pillar published, to time the pillar head.
const pillarSupportCount = {};
const pillarHeadIds = new Set(groups.map(g => g.head?.keyword.toLowerCase()).filter(Boolean));
const headByPillar = Object.fromEntries(groups.map(g => [g.id, g.head]));
const headPublished = {};

for (const k of supportingSorted) {
  const isHead = pillarHeadIds.has(k.keyword.toLowerCase());
  if (isHead) continue; // schedule heads via timing rule below
  queue.push({ ...k, role: 'supporting' });
  pillarSupportCount[k.pillar] = (pillarSupportCount[k.pillar] || 0) + 1;
  // When a pillar reaches 5 supporting in the queue, insert its head next.
  if (pillarSupportCount[k.pillar] === 5 && headByPillar[k.pillar] && !headPublished[k.pillar]) {
    queue.push({ ...headByPillar[k.pillar], role: 'pillar' });
    headPublished[k.pillar] = true;
  }
}
// Any pillar heads never triggered (small clusters) → append near the end.
for (const g of groups) {
  if (g.head && !headPublished[g.id]) queue.push({ ...g.head, role: 'pillar' });
}

// Slice into 6 months
const months = [];
const MONTH_NAMES = ['Month 1','Month 2','Month 3','Month 4','Month 5','Month 6'];
const sixMonths = queue.slice(0, PER_MONTH * 6);
for (let m = 0; m < 6; m++) {
  months.push({ name: MONTH_NAMES[m], articles: sixMonths.slice(m*PER_MONTH, (m+1)*PER_MONTH) });
}

// ---------- 6. Write JSON ----------
const plan = {
  generated_at: d.generated_at,
  total_keywords: kws.length,
  total_volume: kws.reduce((s,k)=>s+k.volume,0),
  scheduled: sixMonths.length,
  per_month: PER_MONTH,
  pillars: groups.map(g => ({ id:g.id, name:g.name, count:g.count, vol:g.vol, avgDiff:g.avgDiff, head: g.head?.keyword })),
  months: months.map(m => ({ name:m.name, count:m.articles.length, articles: m.articles.map(a => ({
    keyword:a.keyword, slug:slugify(a.keyword), volume:a.volume, difficulty:a.difficulty,
    tier:a.tier, pillar:a.pillar, role:a.role, intents:a.intents,
  })) })),
};
writeFileSync(OUT_JSON, JSON.stringify(plan, null, 2));

// expose for the HTML generator
globalThis.__PLAN__ = { plan, groups, months };
console.log(`Cleaned: ${kws.length} kw, ${plan.total_volume.toLocaleString()} vol/mo`);
console.log(`Pillars: ${groups.length} | Scheduled ${sixMonths.length} articles over 6 months (${PER_MONTH}/mo)`);
console.log(`JSON -> ${OUT_JSON}`);

// ---------- 7. HTML report ----------
const intentLabel = i => ({I:'Info',C:'Commercial',T:'Transactional',L:'Local',N:'Nav'}[i]||i);
const tierBadge = t => `<span class="tier t${t}">Tier ${t}</span>`;
const diffBadge = diff => `<span class="b ${diff<=10?'green':diff<=18?'amber':'red'}">${diff}</span>`;

const pillarSection = groups.map((g,i) => `
  <div class="cluster">
    <div class="cluster-head">
      <h3>${i+1}. ${g.name}</h3>
      <div class="cluster-meta"><span>${g.count} keywords</span><span>${g.vol.toLocaleString()} vol/mo</span><span>avg diff ${g.avgDiff}</span></div>
    </div>
    <div class="pillar-head">🏛️ PILLAR: <strong>${g.head ? g.head.keyword : '—'}</strong> ${g.head?`(${g.head.volume.toLocaleString()} vol · diff ${g.head.difficulty})`:''}</div>
    <table><thead><tr><th>Supporting keyword</th><th>Vol</th><th>Diff</th><th>Tier</th><th>Intent</th></tr></thead>
    <tbody>${g.supporting.slice(0,10).map(k=>`<tr><td class="kw">${k.keyword}</td><td class="num">${k.volume.toLocaleString()}</td><td class="num">${diffBadge(k.difficulty)}</td><td>${tierBadge(k.tier)}</td><td>${(k.intents||[]).map(intentLabel).join(', ')}</td></tr>`).join('')}</tbody></table>
    ${g.supporting.length>10?`<p class="more">+ ${g.supporting.length-10} more supporting articles in this cluster</p>`:''}
  </div>`).join('');

const monthSection = months.map((m,mi) => {
  const vol = m.articles.reduce((s,a)=>s+a.volume,0);
  return `<div class="cluster">
    <div class="cluster-head"><h3>📅 ${m.name}</h3><div class="cluster-meta"><span>${m.articles.length} articles</span><span>${vol.toLocaleString()} vol/mo target</span></div></div>
    <table><thead><tr><th>#</th><th>Keyword</th><th>Role</th><th>Vol</th><th>Diff</th><th>Pillar</th></tr></thead>
    <tbody>${m.articles.map((a,ai)=>`<tr><td class="n">${mi*22+ai+1}</td><td class="kw">${a.keyword}</td><td>${a.role==='pillar'?'<span class="role pillar">Pillar</span>':'<span class="role">Support</span>'}</td><td class="num">${a.volume.toLocaleString()}</td><td class="num">${diffBadge(a.difficulty)}</td><td class="sm">${(groups.find(g=>g.id===a.pillar)||{name:a.pillar}).name.replace(/ \(.*\)/,'')}</td></tr>`).join('')}</tbody></table>
  </div>`;
}).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TradersYard — 6-Month Content Plan</title><style>
:root{--bg:#F0EEE6;--card:#fff;--ink:#141413;--muted:#6B6A65;--line:#E5E3DA;--accent:#D97757;--green:#3F7E5C;--amber:#B8842A;--red:#BC5B4B;--blue:#4250eb}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
.wrap{max-width:1080px;margin:0 auto;padding:48px 24px 80px}h1{font-size:34px;margin:0 0 6px;letter-spacing:-.02em}.sub{color:var(--muted);font-size:16px;margin:0 0 32px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 36px}.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.stat .v{font-size:28px;font-weight:700;letter-spacing:-.02em}.stat .l{color:var(--muted);font-size:13px;margin-top:4px}
h2{font-size:22px;margin:44px 0 8px;letter-spacing:-.01em}.lead{color:var(--muted);margin:0 0 20px}
.callout{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:12px;padding:18px 22px;margin:0 0 28px}
.cluster{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin:0 0 18px}
.cluster-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:8px}.cluster-head h3{margin:0;font-size:18px}.cluster-meta{display:flex;gap:14px;color:var(--muted);font-size:13px}
.pillar-head{background:#EEF0FF;border:1px solid #D6DBFF;color:#2d3bb5;border-radius:10px;padding:10px 14px;font-size:14px;margin:6px 0 14px}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.03em;padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:9px 10px;border-bottom:1px solid var(--line)}tr:last-child td{border-bottom:none}.kw{font-weight:500}.sm{font-size:12px;color:var(--muted)}.n{color:var(--muted);width:28px}.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.b{display:inline-block;font-weight:700;font-size:12px;padding:1px 8px;border-radius:6px}.green{background:#E3F0E8;color:var(--green)}.amber{background:#F5ECD6;color:var(--amber)}.red{background:#F3DEDA;color:var(--red)}
.tier{display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:5px}.t0{background:#E3F0E8;color:var(--green)}.t10{background:#F5ECD6;color:var(--amber)}.t20{background:#F3DEDA;color:var(--red)}.t35{background:#eee;color:#666}
.role{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:5px;background:#EDEBE2;color:var(--muted)}.role.pillar{background:#EEF0FF;color:#2d3bb5}
.more{color:var(--muted);font-size:13px;margin:10px 0 0;font-style:italic}.foot{color:var(--muted);font-size:13px;margin-top:40px;border-top:1px solid var(--line);padding-top:18px}code{background:#EDEBE2;padding:1px 5px;border-radius:4px;font-size:.9em}
ol{padding-left:20px}ol li{margin:6px 0}
</style></head><body><div class="wrap">
<h1>6-Month Content Plan</h1>
<p class="sub">TradersYard blog · SE Ranking keyword data · pillar→supporting structure · ${new Date(d.generated_at).toISOString().slice(0,10)}</p>
<div class="stats">
<div class="stat"><div class="v">${kws.length}</div><div class="l">clean winnable keywords</div></div>
<div class="stat"><div class="v">${plan.total_volume.toLocaleString()}</div><div class="l">total searches / month</div></div>
<div class="stat"><div class="v">${groups.length}</div><div class="l">pillar clusters</div></div>
<div class="stat"><div class="v">${sixMonths.length}</div><div class="l">articles scheduled (6 mo)</div></div>
</div>
<div class="callout"><strong>The strategy.</strong> This follows the SEO Avalanche / topic-pyramid model from your content strategy: publish the easy <strong>supporting</strong> (KGR) articles first to build topical authority, then drop the <strong>pillar</strong> article into each cluster once it has ~5 supporting pieces live and linking up. Tiers come from SE Ranking difficulty (Tier 0 = diff ≤ 10, the KGR sweet spot for a young blog). Competitor-branded and off-topic terms removed. Cadence: ${PER_MONTH} articles/month (~5/week).</div>

<h2>🏛️ Pillar Clusters</h2>
<p class="lead">Each pillar is a hub page. The supporting articles below it are the KGR keywords that link upward into it.</p>
${pillarSection}

<h2>📅 The 6-Month Schedule</h2>
<p class="lead">Front-loaded with Tier-0 supporting articles. Pillar heads (highlighted) land after their cluster has support behind it.</p>
${monthSection}

<h2>🎯 How to run it</h2>
<div class="callout"><ol>
<li><strong>Publish in order.</strong> The schedule is already sequenced — easiest + highest-leverage first. Don't jump to pillars early.</li>
<li><strong>Internal linking.</strong> Every supporting article links up to its pillar; the pillar links down to its 5+ supporting articles. This is what compounds the authority.</li>
<li><strong>Re-pull monthly.</strong> Run <code>node scripts/keyword-research.mjs</code> + <code>node scripts/build-content-plan.mjs</code> to refresh as you climb tiers and unlock higher-difficulty keywords.</li>
<li><strong>Load the queue.</strong> <code>data/content-plan.json</code> has every article with slug, tier, pillar and role — ready to feed into <code>data/keyword-queue.json</code>.</li>
</ol></div>
<p class="foot">Source: <code>data/content-plan.json</code> · ${kws.length} keywords from <code>data/keyword-research-wide.json</code> (891 raw). KGR via SE Ranking difficulty proxy (API has no allintitle). Regenerate: <code>node scripts/build-content-plan.mjs</code>.</p>
</div></body></html>`;

mkdirSync(resolve(ROOT_DIR, 'output/reports'), { recursive: true });
writeFileSync(OUT_HTML, html);
console.log(`HTML -> ${OUT_HTML}`);
