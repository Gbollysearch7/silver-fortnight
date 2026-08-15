#!/usr/bin/env node
// Forex traffic play — model: MetroTrade-style educational SEO (concept/pattern/"what is" articles).
// Filters HARD for trading-relevant keywords (forex space has many homonyms), tiers by KGR proxy,
// clusters into pillars, and builds a publish plan.
//
//   node scripts/build-forex-plan.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { ROOT_DIR } from '../lib/config.mjs';
import { slugify } from '../lib/utils.mjs';

const IN = resolve(ROOT_DIR, 'data/forex-keywords.json');
const OUT_JSON = resolve(ROOT_DIR, 'data/forex-content-plan.json');
const OUT_HTML = resolve(ROOT_DIR, 'output/reports/forex-traffic-plan.html');

const d = JSON.parse(readFileSync(IN, 'utf8'));

// ---------- 1. WHITELIST approach: keyword must contain a trading-relevant token ----------
// The forex space is full of homonyms (pip=apple pip/directv, lot, action=construction equipment).
// So instead of blacklisting, we REQUIRE at least one trading anchor term.
// Strong, unambiguous trading anchors (these alone qualify a keyword).
const ANCHORS = [
  'forex','fx ','currency pair','currencies','leverage','margin call','candlestick','candle',
  'forex chart','trading strategy','day trading','swing trading','scalping','price action',
  'support and resistance','support resistance','moving average','rsi','macd','bollinger',
  'fibonacci retrace','stochastic','breakout','chart pattern','bid ask spread','forex broker',
  'demo account','stop loss','take profit','position siz','risk management','technical analysis',
  'order block','liquidity','market structure','supply and demand','trading session','ema ','sma ',
  'doji','engulfing','hammer candle','pin bar','head and shoulders','flag pattern','wedge pattern',
  'usd','eur','gbp','jpy','xau','gold trading','crypto trading','stock trading','trading hours',
  'pip in forex','pips in forex','forex pip','lot size','pip value','what is a pip','currency trading',
];
// Ambiguous tokens: only count if they co-occur with a STRICT forex/trading context word.
const AMBIG = ['pip','lot','trend','channel','spread','session','pair','indicator','trade','trader'];
const CONTEXT = ['forex','fx','trading','currency','candlestick','chart pattern','broker','leverage','pip value','lot size','pips','margin','technical analysis'];
// Hard exclusions even if matched.
const KILL = [
  'apple','directv','garland','damien','construction equipment','share price','pip berry',
  'python','pip install','ventilat','joint','foot','medical','reddit','-q','qqq','etf','stock price',
  'job','salary','resume','course price','near me','app download','login','sign in','definition of pip',
  'metrotrade','metro trader','pipping','pip joint','fee schedule','squeak','doodly','pip pip',
  'new jersey','new york pip','insurance','nursing','ventilation','spy support','spy resistance',
  'qqq','aapl','tesla','nvidia','pip da','great pip','gladys','character','spy stock','silver 200','forex card','swing trading lab','matlab','excel','pdf download',
];

const isKilled = kw => KILL.some(k => kw.includes(k));
const hasStrong = kw => ANCHORS.some(a => kw.includes(a));
const hasAmbigInContext = kw => AMBIG.some(a => kw.includes(a)) && CONTEXT.some(c => kw.includes(c));

let kws = d.keywords.filter(k => {
  const kw = ' ' + k.keyword.toLowerCase() + ' ';
  if (isKilled(kw)) return false;
  return hasStrong(kw) || hasAmbigInContext(kw);
});

// dedupe near-identical
const norm = s => s.toLowerCase().replace(/[^a-z ]/g,'').replace(/s\b/g,'').replace(/\s+/g,' ').trim();
const byNorm = new Map();
for (const k of kws) { const n = norm(k.keyword); if (!byNorm.has(n) || k.volume > byNorm.get(n).volume) byNorm.set(n, k); }
kws = [...byNorm.values()];

// ---------- 2. KGR proxy tier ----------
const tierOf = diff => diff <= 8 ? 0 : diff <= 14 ? 10 : 20;
for (const k of kws) k.tier = tierOf(k.difficulty);

// ---------- 3. Pillar clusters (MetroTrade-style educational topics) ----------
const PILLARS = [
  { id:'basics',     name:'Forex Basics (What Is / How To)', match:/(what is|what are|how to|how do|how does|meaning|definition|for beginners|forex 101|basics|explained|guide to)/ },
  { id:'patterns',   name:'Candlestick & Chart Patterns',    match:/(candlestick|candle|doji|engulfing|hammer|pin bar|head and shoulders|flag|wedge|pattern|chart pattern|morning star|evening star|harami|marubozu)/ },
  { id:'indicators', name:'Indicators & Technical Analysis',  match:/(indicator|rsi|macd|bollinger|moving average|ema|sma|stochastic|fibonacci|technical analysis|oscillator|atr|ichimoku)/ },
  { id:'strategy',   name:'Strategies & Setups',             match:/(strategy|strategies|scalp|swing|day trad|price action|breakout|trend|setup|system|support and resistance|supply and demand|order block|liquidity|market structure)/ },
  { id:'mechanics',  name:'Trading Mechanics (Pips, Lots, Leverage)', match:/(pip|lot size|lot|leverage|margin|spread|position siz|stop loss|take profit|risk management|drawdown)/ },
  { id:'pairs',      name:'Currency Pairs & Sessions',       match:/(pair|usd|eur|gbp|jpy|xau|session|trading hours|best time|correlation|major|minor|exotic)/ },
  { id:'brokers',    name:'Brokers, Accounts & Tools',       match:/(broker|demo account|account|platform|metatrader|mt4|mt5|spread|commission|regulated)/ },
];
const FALLBACK = { id:'general', name:'General Forex Education' };
const assign = kw => { const k = kw.toLowerCase(); for (const p of PILLARS) if (p.match.test(k)) return p.id; return FALLBACK.id; };
for (const k of kws) k.pillar = assign(k.keyword);

// Preferred hub phrases (fuzzy contains match, in priority order).
const HUB = {
  basics:['what is forex','forex for beginner','how to trade forex','how to start forex'],
  patterns:['candlestick pattern','chart pattern','candlestick'],
  indicators:['forex indicator','best indicator','technical analysis','moving average'],
  strategy:['forex strategy','forex trading strateg','trading strateg','day trading strateg'],
  mechanics:['what is a pip','pip in forex','lot size','leverage in forex'],
  pairs:['currency pair','best time to trade','forex trading hour'],
  brokers:['forex broker','demo account','best forex broker'],
  general:['how to trade forex','how to make money forex','learn forex','forex trading'],
};
const allP = [...PILLARS, FALLBACK];
const groups = allP.map(p => {
  const items = kws.filter(k => k.pillar === p.id).sort((a,b)=>b.volume-a.volume);
  let head = null;
  for (const pref of (HUB[p.id]||[])) { head = items.find(k => k.keyword.toLowerCase().includes(pref)); if (head) break; }
  if (!head) head = items[0] || null;
  const supporting = items.filter(k => k !== head);
  return { ...p, head, supporting, count:items.length, vol:items.reduce((s,k)=>s+k.volume,0),
    avgDiff: items.length ? Math.round(items.reduce((s,k)=>s+k.difficulty,0)/items.length) : 0 };
}).filter(g=>g.count>0).sort((a,b)=>b.vol-a.vol);

// ---------- 4. Publish schedule (front-load easy supporting, pillar after 5 supporting) ----------
const PER_MONTH = 20;
const supportingSorted = kws.slice().sort((a,b)=>(a.tier-b.tier)||(b.volume/(b.difficulty+5)-a.volume/(a.difficulty+5)));
const headKeys = new Set(groups.map(g=>g.head?.keyword.toLowerCase()).filter(Boolean));
const headByPillar = Object.fromEntries(groups.map(g=>[g.id,g.head]));
const queue=[]; const cnt={}; const headDone={};
for (const k of supportingSorted) {
  if (headKeys.has(k.keyword.toLowerCase())) continue;
  queue.push({...k, role:'supporting'});
  cnt[k.pillar]=(cnt[k.pillar]||0)+1;
  if (cnt[k.pillar]===5 && headByPillar[k.pillar] && !headDone[k.pillar]) { queue.push({...headByPillar[k.pillar], role:'pillar'}); headDone[k.pillar]=true; }
}
for (const g of groups) if (g.head && !headDone[g.id]) queue.push({...g.head, role:'pillar'});

const sched = queue.slice(0, PER_MONTH*6);
const months=[]; for(let m=0;m<6;m++) months.push({name:`Month ${m+1}`, articles:sched.slice(m*PER_MONTH,(m+1)*PER_MONTH)});

// ---------- 5. JSON ----------
const plan = {
  generated_at:d.generated_at, total_keywords:kws.length, total_volume:kws.reduce((s,k)=>s+k.volume,0),
  scheduled:sched.length, per_month:PER_MONTH,
  pillars:groups.map(g=>({id:g.id,name:g.name,count:g.count,vol:g.vol,avgDiff:g.avgDiff,head:g.head?.keyword})),
  months:months.map(m=>({name:m.name,count:m.articles.length,articles:m.articles.map(a=>({
    keyword:a.keyword,slug:slugify(a.keyword),volume:a.volume,difficulty:a.difficulty,tier:a.tier,pillar:a.pillar,role:a.role,intents:a.intents }))})),
};
writeFileSync(OUT_JSON, JSON.stringify(plan,null,2));
console.log(`Forex clean: ${kws.length} kw, ${plan.total_volume.toLocaleString()} vol/mo`);
console.log(`Pillars: ${groups.length} | Scheduled ${sched.length} over 6 mo (${PER_MONTH}/mo)`);
groups.forEach(g=>console.log(`  • ${g.name}: ${g.count} kw, ${g.vol.toLocaleString()} vol → HEAD: ${g.head?.keyword}`));

// ---------- 6. HTML ----------
const intentLabel = i => ({I:'Info',C:'Commercial',T:'Transactional',L:'Local',N:'Nav'}[i]||i);
const tBadge = t=>`<span class="tier t${t}">T${t}</span>`;
const dBadge = diff=>`<span class="b ${diff<=8?'green':diff<=14?'amber':'red'}">${diff}</span>`;
const qw = kws.filter(k=>k.difficulty<=8 && k.volume>=150).sort((a,b)=>b.volume-a.volume);

const pillarHTML = groups.map((g,i)=>`<div class="cluster">
  <div class="cluster-head"><h3>${i+1}. ${g.name}</h3><div class="cluster-meta"><span>${g.count} kw</span><span>${g.vol.toLocaleString()} vol/mo</span><span>avg diff ${g.avgDiff}</span></div></div>
  <div class="pillar-head">🏛️ PILLAR: <strong>${g.head?g.head.keyword:'—'}</strong> ${g.head?`(${g.head.volume.toLocaleString()} vol · diff ${g.head.difficulty})`:''}</div>
  <table><thead><tr><th>Supporting keyword</th><th>Vol</th><th>Diff</th><th>Tier</th><th>Intent</th></tr></thead>
  <tbody>${g.supporting.slice(0,10).map(k=>`<tr><td class="kw">${k.keyword}</td><td class="num">${k.volume.toLocaleString()}</td><td class="num">${dBadge(k.difficulty)}</td><td>${tBadge(k.tier)}</td><td>${(k.intents||[]).map(intentLabel).join(', ')}</td></tr>`).join('')}</tbody></table>
  ${g.supporting.length>10?`<p class="more">+ ${g.supporting.length-10} more in this cluster</p>`:''}</div>`).join('');

const monthHTML = months.map((m,mi)=>{const v=m.articles.reduce((s,a)=>s+a.volume,0);
  return `<div class="cluster"><div class="cluster-head"><h3>📅 ${m.name}</h3><div class="cluster-meta"><span>${m.articles.length} articles</span><span>${v.toLocaleString()} vol target</span></div></div>
  <table><thead><tr><th>#</th><th>Keyword</th><th>Role</th><th>Vol</th><th>Diff</th><th>Pillar</th></tr></thead>
  <tbody>${m.articles.map((a,ai)=>`<tr><td class="n">${mi*20+ai+1}</td><td class="kw">${a.keyword}</td><td>${a.role==='pillar'?'<span class="role pillar">Pillar</span>':'<span class="role">Support</span>'}</td><td class="num">${a.volume.toLocaleString()}</td><td class="num">${dBadge(a.difficulty)}</td><td class="sm">${(groups.find(g=>g.id===a.pillar)||{name:a.pillar}).name}</td></tr>`).join('')}</tbody></table></div>`;}).join('');

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TradersYard — Forex Traffic Plan</title><style>
:root{--bg:#F0EEE6;--card:#fff;--ink:#141413;--muted:#6B6A65;--line:#E5E3DA;--accent:#D97757;--green:#3F7E5C;--amber:#B8842A;--red:#BC5B4B}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--ink);line-height:1.5}
.wrap{max-width:1080px;margin:0 auto;padding:48px 24px 80px}h1{font-size:34px;margin:0 0 6px;letter-spacing:-.02em}.sub{color:var(--muted);font-size:16px;margin:0 0 28px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:0 0 32px}.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px}
.stat .v{font-size:28px;font-weight:700;letter-spacing:-.02em}.stat .l{color:var(--muted);font-size:13px;margin-top:4px}
h2{font-size:22px;margin:44px 0 8px}.lead{color:var(--muted);margin:0 0 20px}
.callout{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:12px;padding:18px 22px;margin:0 0 26px}
.model{background:#EEF0FF;border:1px solid #D6DBFF;border-left:3px solid #4250eb;border-radius:12px;padding:18px 22px;margin:0 0 26px}
.cluster{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;margin:0 0 18px}
.cluster-head{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:8px}.cluster-head h3{margin:0;font-size:18px}.cluster-meta{display:flex;gap:14px;color:var(--muted);font-size:13px}
.pillar-head{background:#EEF0FF;border:1px solid #D6DBFF;color:#2d3bb5;border-radius:10px;padding:10px 14px;font-size:14px;margin:6px 0 14px}
table{width:100%;border-collapse:collapse;font-size:14px}th{text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.03em;padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:9px 10px;border-bottom:1px solid var(--line)}tr:last-child td{border-bottom:none}.kw{font-weight:500}.sm{font-size:12px;color:var(--muted)}.n{color:var(--muted);width:28px}.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.b{display:inline-block;font-weight:700;font-size:12px;padding:1px 8px;border-radius:6px}.green{background:#E3F0E8;color:var(--green)}.amber{background:#F5ECD6;color:var(--amber)}.red{background:#F3DEDA;color:var(--red)}
.tier{display:inline-block;font-size:11px;font-weight:700;padding:1px 7px;border-radius:5px}.t0{background:#E3F0E8;color:var(--green)}.t10{background:#F5ECD6;color:var(--amber)}.t20{background:#F3DEDA;color:var(--red)}
.role{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:5px;background:#EDEBE2;color:var(--muted)}.role.pillar{background:#EEF0FF;color:#2d3bb5}
.more{color:var(--muted);font-size:13px;margin:10px 0 0;font-style:italic}.foot{color:var(--muted);font-size:13px;margin-top:40px;border-top:1px solid var(--line);padding-top:18px}code{background:#EDEBE2;padding:1px 5px;border-radius:4px;font-size:.9em}ol{padding-left:20px}ol li{margin:6px 0}
</style></head><body><div class="wrap">
<h1>Forex Traffic Plan</h1>
<p class="sub">TradersYard blog · MetroTrade-style educational SEO · easy-to-rank forex keywords · ${new Date(d.generated_at).toISOString().slice(0,10)}</p>
<div class="stats">
<div class="stat"><div class="v">${kws.length}</div><div class="l">clean forex keywords</div></div>
<div class="stat"><div class="v">${plan.total_volume.toLocaleString()}</div><div class="l">total searches / month</div></div>
<div class="stat"><div class="v">${qw.length}</div><div class="l">quick wins (diff ≤ 8)</div></div>
<div class="stat"><div class="v">${sched.length}</div><div class="l">articles (6 mo)</div></div>
</div>
<div class="model"><strong>📋 The MetroTrade model.</strong> MetroTrade ranks for huge educational terms ("day trading", "engulfing candlestick pattern", "time frame") with definitional blog posts — but they win those on raw domain authority (difficulty 84–95). We can't copy that head-on yet. <strong>So this plan targets the EASY long-tail versions of the same topics</strong> — the "what is", pattern-name, and how-to forex keywords at difficulty ≤ 20 that a growing blog can actually rank for. Same educational SEO engine, winnable entry point. As authority grows, you graduate into their harder terms.</div>
<div class="callout"><strong>Why this is a separate play from prop firms.</strong> This is top-of-funnel traffic — beginner forex traders learning the craft. It pulls a much wider audience than prop-firm buyers, builds domain authority across the whole trading topic, and feeds your prop-firm money pages through internal links once they're on-site. Tiers = SE Ranking difficulty (KGR proxy). Homonym noise (apple pip, directv, construction equipment) stripped via trading-anchor whitelist.</div>

<h2>🏛️ Pillar Clusters</h2>
<p class="lead">Seven educational hubs. Publish the supporting articles, link them up to the pillar.</p>
${pillarHTML}

<h2>📅 The 6-Month Schedule</h2>
<p class="lead">${PER_MONTH} articles/month, easiest first. Pillars land once their cluster has support behind it.</p>
${monthHTML}

<h2>🎯 How to run it</h2>
<div class="callout"><ol>
<li><strong>Educational angle, every article.</strong> Definitional/how-to posts like MetroTrade's — "What is a pip", "How to read a candlestick chart", "RSI explained". Clear, beginner-friendly, snippet-optimized.</li>
<li><strong>Capture the snippet.</strong> Most of these show <code>featured_snippets</code> / <code>people_also_ask</code>. Open each article with a crisp ~50-word definition + an FAQ block.</li>
<li><strong>Funnel to money pages.</strong> Every forex-education article links to a relevant prop-firm / TradersYard CTA. Traffic first, conversion via internal links.</li>
<li><strong>Run it parallel to the prop-firm plan.</strong> Two streams: prop-firm (bottom-funnel buyers) + forex education (top-funnel traffic). Combined they build authority faster than either alone.</li>
</ol></div>
<p class="foot">Source: <code>data/forex-content-plan.json</code> · ${kws.length} keywords from <code>data/forex-keywords.json</code> (838 raw). KGR via SE Ranking difficulty proxy. Regenerate: <code>node scripts/build-forex-plan.mjs</code>.</p>
</div></body></html>`;
mkdirSync(resolve(ROOT_DIR,'output/reports'),{recursive:true});
writeFileSync(OUT_HTML, html);
console.log(`HTML -> ${OUT_HTML}`);
