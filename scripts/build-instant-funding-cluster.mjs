#!/usr/bin/env node
// Instant Funding cluster — pillar + supporting pages around the instant-funding prop-firm topic.
//
//   node scripts/build-instant-funding-cluster.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { ROOT_DIR } from '../lib/config.mjs';
import { slugify } from '../lib/utils.mjs';

const IN = resolve(ROOT_DIR, 'data/instant-funding-keywords.json');
const OUT_JSON = resolve(ROOT_DIR, 'data/instant-funding-cluster.json');
const OUT_HTML = resolve(ROOT_DIR, 'output/reports/instant-funding-cluster.html');

const d = JSON.parse(readFileSync(IN, 'utf8'));

// ---------- 1. Keep only instant/no-challenge/direct-funding terms that are TRADING (not banking) ----------
const CORE = /(instant|no challenge|no evaluation|without challenge|skip.*challenge|one step|1 step|direct fund|buy.*funded|straight to fund|funded.*no challenge|no eval)/i;
// Banking / fintech "instant funds" homonyms — NOT trading.
const BANKING = ['paypal','sbi','mutual fund','payday','credit card','check deposit','check cashing',
  'bank','venmo','cash app','cashapp','albert','cross river','sales funding','capital funding',
  'funds recovery','funds transfer','funds availability','redemption','llc','axis','transfer between',
  'add funds','withdraw paypal','access to paypal','access paypal','sba','loan','deposit instant','verification'];
// Competitor brands.
const BRANDS = ['fxify','ftmo','blufx','finotive','onefunded','the funded trader','traders central','funding ticks'];

const isTrading = kw => /(prop|firm|trad|forex|futures|funded account|funded trading|challenge|evaluation|consistency)/i.test(kw);
let kws = d.keywords.filter(k => {
  const kw = k.keyword.toLowerCase();
  if (!CORE.test(kw)) return false;
  if (BANKING.some(b => kw.includes(b))) return false;
  if (BRANDS.some(b => kw.includes(b))) return false;
  if (!isTrading(kw)) return false; // must be a trading/prop context
  return true;
});

// dedupe singular/plural + trivial variants
const norm = s => s.toLowerCase().replace(/[^a-z ]/g,'').replace(/s\b/g,'').replace(/\s+/g,' ').trim();
const byNorm = new Map();
for (const k of kws) { const n = norm(k.keyword); if (!byNorm.has(n) || k.volume > byNorm.get(n).volume) byNorm.set(n, k); }
kws = [...byNorm.values()].sort((a,b)=>b.volume-a.volume);

// ---------- 2. KGR proxy tier ----------
const tierOf = diff => diff <= 10 ? 0 : diff <= 18 ? 10 : diff <= 25 ? 20 : 35;
for (const k of kws) k.tier = tierOf(k.difficulty);

// ---------- 3. Sub-cluster (supporting topic angles under the pillar) ----------
const SUBS = [
  { id:'definition', name:'What Is Instant Funding (Explainers)', match:/(what is|what are|how does|how do|meaning|explain|review)/ },
  { id:'futures',    name:'Instant Funding — Futures',           match:/(futures)/ },
  { id:'forex',      name:'Instant Funding — Forex',             match:/(forex|fx)/ },
  { id:'crypto',     name:'Instant Funding — Crypto',            match:/(crypto)/ },
  { id:'cheap',      name:'Cheapest / Best Instant Funding',     match:/(cheap|cheapest|best|top \d|top10|top 10|list)/ },
  { id:'norule',     name:'Instant Funding + No Consistency Rule', match:/(consistency|no rule|without rule)/ },
  { id:'onestep',    name:'One-Step / No-Evaluation Alternatives', match:/(one step|1 step|no evaluation|no eval|no challenge|skip)/ },
  { id:'buy',        name:'Buying a Funded Account',             match:/(buy|purchase|how to get)/ },
];
const FALLBACK = { id:'general', name:'General Instant Funding' };
const assign = kw => { const k = kw.toLowerCase(); for (const s of SUBS) if (s.match.test(k)) return s.id; return FALLBACK.id; };
for (const k of kws) k.sub = assign(k.keyword);

// ---------- 4. Pillar head = the canonical hub term ----------
// Pillar = strongest hub term. Prefer broad high-volume "instant funded account" over the
// narrower "instant funding prop firm". Pick the highest-volume among the canonical candidates.
const HUB_PREFS = ['instant funded account','instant funding prop firm','instant funded prop firm','instant funding'];
const candidates = kws.filter(k => HUB_PREFS.some(p => k.keyword.toLowerCase() === p));
let pillar = candidates.sort((a,b)=>b.volume-a.volume)[0] || kws[0];

const subs = [...SUBS, FALLBACK].map(s => {
  const items = kws.filter(k => k.sub === s.id && k !== pillar).sort((a,b)=>b.volume-a.volume);
  return { ...s, items, count: items.length, vol: items.reduce((sm,k)=>sm+k.volume,0),
    avgDiff: items.length ? Math.round(items.reduce((sm,k)=>sm+k.difficulty,0)/items.length) : 0 };
}).filter(s=>s.count>0).sort((a,b)=>b.vol-a.vol);

// ---------- 5. JSON ----------
const supportingAll = kws.filter(k => k !== pillar);
const plan = {
  generated_at: d.generated_at,
  pillar: { keyword: pillar.keyword, slug: slugify(pillar.keyword), volume: pillar.volume, difficulty: pillar.difficulty, tier: pillar.tier },
  total_keywords: kws.length,
  total_volume: kws.reduce((s,k)=>s+k.volume,0),
  supporting_count: supportingAll.length,
  sub_clusters: subs.map(s => ({ id:s.id, name:s.name, count:s.count, vol:s.vol, avgDiff:s.avgDiff,
    keywords: s.items.map(k => ({ keyword:k.keyword, slug:slugify(k.keyword), volume:k.volume, difficulty:k.difficulty, tier:k.tier, intents:k.intents })) })),
};
writeFileSync(OUT_JSON, JSON.stringify(plan, null, 2));
console.log(`Instant Funding cluster: ${kws.length} kw, ${plan.total_volume.toLocaleString()} vol/mo`);
console.log(`PILLAR: ${pillar.keyword} (${pillar.volume} vol, diff ${pillar.difficulty})`);
console.log(`Sub-clusters: ${subs.length} | Supporting pages: ${supportingAll.length}`);
subs.forEach(s => console.log(`  • ${s.name}: ${s.count} kw, ${s.vol.toLocaleString()} vol`));

// ---------- 6. HTML ----------
const intentLabel = i => ({I:'Info',C:'Commercial',T:'Transactional',L:'Local',N:'Nav'}[i]||i);
const tBadge = t=>`<span class="tier t${t}">T${t}</span>`;
const dBadge = diff=>`<span class="b ${diff<=10?'green':diff<=18?'amber':'red'}">${diff}</span>`;

const subHTML = subs.map((s,i)=>`<div class="cluster">
  <div class="cluster-head"><h3>${i+1}. ${s.name}</h3><div class="cluster-meta"><span>${s.count} pages</span><span>${s.vol.toLocaleString()} vol/mo</span><span>avg diff ${s.avgDiff}</span></div></div>
  <table><thead><tr><th>Supporting keyword</th><th>Vol</th><th>Diff</th><th>Tier</th><th>Intent</th></tr></thead>
  <tbody>${s.items.map(k=>`<tr><td class="kw">${k.keyword}</td><td class="num">${k.volume.toLocaleString()}</td><td class="num">${dBadge(k.difficulty)}</td><td>${tBadge(k.tier)}</td><td>${(k.intents||[]).map(intentLabel).join(', ')}</td></tr>`).join('')}</tbody></table>
</div>`).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TradersYard — Instant Funding Cluster</title><style>
:root{--bg:#F0EEE6;--card:#fff;--ink:#141413;--muted:#6B6A65;--line:#E5E3DA;--accent:#D97757;--green:#3F7E5C;--amber:#B8842A;--red:#BC5B4B;--blue:#4250eb}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
.wrap{max-width:1000px;margin:0 auto;padding:48px 24px 80px}h1{font-size:34px;margin:0 0 6px;letter-spacing:-.02em}.sub{color:var(--muted);font-size:16px;margin:0 0 28px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 32px}.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.stat .v{font-size:28px;font-weight:700;letter-spacing:-.02em}.stat .l{color:var(--muted);font-size:13px;margin-top:4px}
h2{font-size:22px;margin:40px 0 8px}.lead{color:var(--muted);margin:0 0 20px}
.pillar-card{background:linear-gradient(135deg,#EEF0FF,#fff);border:1px solid #D6DBFF;border-radius:16px;padding:26px;margin:0 0 28px}
.pillar-card .tag{display:inline-block;background:var(--blue);color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;padding:3px 10px;border-radius:6px;text-transform:uppercase}
.pillar-card h2{margin:12px 0 6px;font-size:26px}.pillar-card .meta{color:#2d3bb5;font-size:14px}
.callout{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:12px;padding:18px 22px;margin:0 0 26px}
.cluster{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin:0 0 16px}
.cluster-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px}.cluster-head h3{margin:0;font-size:17px}.cluster-meta{display:flex;gap:14px;color:var(--muted);font-size:13px}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.03em;padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:9px 10px;border-bottom:1px solid var(--line)}tr:last-child td{border-bottom:none}.kw{font-weight:500}.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.b{display:inline-block;font-weight:700;font-size:12px;padding:1px 8px;border-radius:6px}.green{background:#E3F0E8;color:var(--green)}.amber{background:#F5ECD6;color:var(--amber)}.red{background:#F3DEDA;color:var(--red)}
.tier{display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:5px}.t0{background:#E3F0E8;color:var(--green)}.t10{background:#F5ECD6;color:var(--amber)}.t20{background:#F3DEDA;color:var(--red)}.t35{background:#eee;color:#666}
.foot{color:var(--muted);font-size:13px;margin-top:40px;border-top:1px solid var(--line);padding-top:18px}code{background:#EDEBE2;padding:1px 5px;border-radius:4px;font-size:.9em}ol{padding-left:20px}ol li{margin:6px 0}
.diagram{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin:0 0 26px;text-align:center;font-size:14px;color:var(--muted)}
.diagram .hub{display:inline-block;background:var(--blue);color:#fff;padding:8px 18px;border-radius:10px;font-weight:700;margin-bottom:10px}
.diagram .links{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
.diagram .node{background:#F0EEE6;border:1px solid var(--line);border-radius:8px;padding:5px 12px;font-size:12px;color:var(--ink)}
</style></head><body><div class="wrap">
<h1>Instant Funding — Topic Cluster</h1>
<p class="sub">TradersYard blog · pillar + supporting pages · SE Ranking data · ${new Date(d.generated_at).toISOString().slice(0,10)}</p>
<div class="stats">
<div class="stat"><div class="v">${kws.length}</div><div class="l">clean instant-funding keywords</div></div>
<div class="stat"><div class="v">${plan.total_volume.toLocaleString()}</div><div class="l">cluster volume / month</div></div>
<div class="stat"><div class="v">${supportingAll.length}</div><div class="l">supporting pages</div></div>
<div class="stat"><div class="v">${subs.length}</div><div class="l">sub-cluster angles</div></div>
</div>

<div class="pillar-card"><span class="tag">🏛️ Pillar Page</span>
<h2>${pillar.keyword}</h2>
<div class="meta">${pillar.volume.toLocaleString()} searches/mo · difficulty ${pillar.difficulty} (Tier ${pillar.tier}) · the hub everything links into</div></div>

<div class="diagram"><div class="hub">${pillar.keyword}</div><div>↑ supporting pages link up · pillar links down ↓</div>
<div class="links">${subs.map(s=>`<span class="node">${s.name.replace(/ \(.*\)/,'').replace('Instant Funding — ','')}</span>`).join('')}</div></div>

<div class="callout"><strong>Why this cluster wins.</strong> "Instant funding" is a fast-growing, high-intent prop-firm niche — traders who want to skip the challenge and trade live capital immediately. It's almost entirely <strong>informational intent</strong> (people researching before buying), most terms sit at <strong>difficulty ≤ 18</strong>, and the topic is narrow enough to dominate with one strong pillar + ${supportingAll.length} supporting pages. Banking "instant funds" homonyms (PayPal, payday loans, check deposits) and competitor brands stripped out.</div>

<h2>📑 Supporting Pages (by sub-cluster)</h2>
<p class="lead">Each supporting page targets one angle and links up to the pillar. Build these first, then strengthen the pillar.</p>
${subHTML}

<h2>🎯 Build order</h2>
<div class="callout"><ol>
<li><strong>Publish the Tier-0 supporting pages first</strong> (difficulty ≤ 10) — fastest to rank, builds topical depth around "instant funding".</li>
<li><strong>Then publish the pillar</strong> — <code>${pillar.keyword}</code> — a comprehensive hub that links down to every supporting page and targets the head term.</li>
<li><strong>Interlink tightly.</strong> Every supporting page → pillar; pillar → all supporting pages. This concentrated linking is what makes a cluster outrank broader competitors.</li>
<li><strong>Funnel to the product.</strong> Each page CTAs to TradersYard's relevant offer. Instant-funding searchers are high-intent — close them.</li>
</ol></div>
<p class="foot">Source: <code>data/instant-funding-cluster.json</code> · ${kws.length} keywords from <code>data/instant-funding-keywords.json</code> (352 raw). KGR via SE Ranking difficulty proxy. Regenerate: <code>node scripts/build-instant-funding-cluster.mjs</code>.</p>
</div></body></html>`;
mkdirSync(resolve(ROOT_DIR,'output/reports'),{recursive:true});
writeFileSync(OUT_HTML, html);
console.log(`HTML -> ${OUT_HTML}`);
