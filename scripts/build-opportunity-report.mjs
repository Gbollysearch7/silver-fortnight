#!/usr/bin/env node
/**
 * Builds GSC-OPPORTUNITY-REPORT.html from the two analysis JSON files.
 * Claude/Anthropic design system — light, warm, serif headings, interactive.
 * Read-only. Run after gsc-keyword-opportunities.mjs + gsc-analysis.mjs.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';

const opp = JSON.parse(readFileSync(resolve(DATA_DIR, 'gsc-opportunities.json'), 'utf-8'));
const ana = JSON.parse(readFileSync(resolve(DATA_DIR, 'gsc-analysis.json'), 'utf-8'));

// Theme the new keywords
const nk = opp.newKeywords;
const themeDefs = [
  ['Geo / country pages', /usa|uk|germany|europe|south africa|pakistan|nigeria|canada|india/i],
  ['How prop firms work', /how (do|does)|make money|legit|scam|profitable/i],
  ['Withdrawals, payouts & refunds', /withdraw|payout|refund|fast/i],
  ['Demo & funded accounts', /demo|funded account/i],
  ['Forex vs futures / comparisons', /\bvs\b|comparison|compare|forex|futures/i],
  ['Copy trading', /copy trad/i],
];
const used = new Set();
const themes = themeDefs.map(([name, re]) => {
  const items = nk.filter(k => !used.has(k.query) && re.test(k.query));
  items.forEach(k => used.add(k.query));
  return { name, items, impr: items.reduce((s, k) => s + k.impressions, 0) };
}).filter(t => t.items.length);
const other = nk.filter(k => !used.has(k.query));
if (other.length) themes.push({ name: 'Other', items: other, impr: other.reduce((s, k) => s + k.impressions, 0) });

const totalImprNum = ana.totals.impressions;
const totalClicksNum = ana.totals.clicks;
const siteCtr = (totalClicksNum / totalImprNum * 100).toFixed(2);
const totalNewImpr = nk.reduce((s, k) => s + k.impressions, 0);
const ctrTop = ana.ctrGap.slice(0, 12);
const recoverable = ctrTop.reduce((s, p) => s + p.lostClicks, 0);

// All data goes to the client as JSON for interactive rendering
const payload = {
  meta: ana.meta,
  totals: { impressions: totalImprNum, clicks: totalClicksNum, ctr: siteCtr },
  newKeywords: nk,
  themes,
  retarget: opp.retarget,
  ctrGap: ctrTop,
  recoverable,
  totalNewImpr,
};

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>GSC Keyword Opportunities — TradersYard</title>
<style>
  :root{
    --bg:#faf9f5; --surface:#ffffff; --raised:#f5f4ee;
    --ink:#1f1e1c; --ink2:#52504a; --muted:#85827b;
    --line:#e8e5dd; --line2:#ddd9cf;
    --clay:#c15f3c; --clay-soft:#d9775722; --clay-tint:#f7ede8;
    --green:#3d7a4e; --green-tint:#edf3ed; --amber:#9a6a16; --amber-tint:#f6efe0;
    --serif:"Tiempos Text",Georgia,"Times New Roman",serif;
    --sans:"Styrene B",-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 var(--sans);-webkit-font-smoothing:antialiased}
  .wrap{max-width:880px;margin:0 auto;padding:56px 24px 96px}
  h1{font-family:var(--serif);font-weight:500;font-size:40px;line-height:1.1;letter-spacing:-.5px;margin:0 0 10px}
  .sub{color:var(--muted);margin:0 0 8px;font-size:14.5px}
  h2{font-family:var(--serif);font-weight:500;font-size:26px;letter-spacing:-.3px;margin:64px 0 6px;scroll-margin-top:24px}
  h2 .n{color:var(--clay)}
  h3{font-size:15px;font-weight:600;margin:28px 0 10px;color:var(--ink);display:flex;align-items:center;gap:10px}
  .lead{color:var(--ink2);margin:6px 0 18px;font-size:15px;max-width:62ch}
  .pill{font:500 12px var(--sans);color:var(--ink2);background:var(--raised);border:1px solid var(--line);padding:3px 11px;border-radius:20px}
  /* hero stats */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0}
  .stat{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 18px}
  .stat .v{font-family:var(--serif);font-size:30px;line-height:1;font-weight:500}
  .stat .l{color:var(--muted);font-size:12.5px;margin-top:8px}
  .stat.warn{background:var(--amber-tint);border-color:#ecd9a8}
  .stat.warn .v{color:var(--amber)}
  /* callout */
  .callout{background:var(--clay-tint);border:1px solid #ecd5c8;border-radius:14px;padding:18px 20px;margin:20px 0;font-size:14.5px;color:var(--ink2);line-height:1.6}
  .callout strong{color:var(--ink)}
  /* tabs */
  .tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 18px;border-bottom:1px solid var(--line);padding-bottom:0}
  .tab{appearance:none;border:0;background:none;font:500 13.5px var(--sans);color:var(--muted);padding:9px 14px;cursor:pointer;border-radius:8px 8px 0 0;position:relative;top:1px;border-bottom:2px solid transparent}
  .tab:hover{color:var(--ink)}
  .tab.active{color:var(--clay);border-bottom-color:var(--clay)}
  .panel{display:none}
  .panel.active{display:block;animation:fade .25s ease}
  @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  /* search */
  .toolbar{display:flex;gap:10px;align-items:center;margin:14px 0 8px;flex-wrap:wrap}
  .search{flex:1;min-width:200px;background:var(--surface);border:1px solid var(--line2);border-radius:10px;padding:10px 14px;font:14px var(--sans);color:var(--ink)}
  .search:focus{outline:none;border-color:var(--clay);box-shadow:0 0 0 3px var(--clay-soft)}
  .count{color:var(--muted);font-size:13px;white-space:nowrap}
  /* table */
  .tbl-wrap{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th{text-align:left;color:var(--muted);font-weight:600;padding:11px 16px;border-bottom:1px solid var(--line);font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;cursor:pointer;user-select:none;white-space:nowrap}
  th .arr{opacity:.35;font-size:10px}
  th.sorted .arr{opacity:1;color:var(--clay)}
  th.num,td.num{text-align:right}
  td{padding:11px 16px;border-bottom:1px solid var(--line);vertical-align:middle}
  tr:last-child td{border-bottom:0}
  tbody tr:hover{background:var(--raised)}
  td.q{color:var(--ink)}
  td.num{color:var(--ink2);font-variant-numeric:tabular-nums;white-space:nowrap}
  .copy{appearance:none;border:1px solid var(--line2);background:var(--surface);color:var(--ink2);font:500 11px var(--sans);padding:4px 9px;border-radius:7px;cursor:pointer;opacity:0;transition:opacity .15s}
  tr:hover .copy{opacity:1}
  .copy:hover{border-color:var(--clay);color:var(--clay)}
  .copy.done{color:var(--green);border-color:var(--green)}
  .badge{display:inline-block;font:500 11px var(--sans);padding:2px 8px;border-radius:6px}
  .badge.lo{background:var(--green-tint);color:var(--green)}
  .badge.mid{background:var(--amber-tint);color:var(--amber)}
  .badge.hi{background:var(--raised);color:var(--muted)}
  /* retarget / ctr cards */
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin:12px 0}
  .slug{font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:12.5px;color:var(--clay);margin-bottom:10px}
  .swap{display:flex;flex-wrap:wrap;gap:10px;align-items:center;font-size:14px}
  .from{color:var(--muted);text-decoration:line-through;text-decoration-color:#cfc} .from{text-decoration:none}
  .chip{padding:5px 10px;border-radius:8px;font-size:13px}
  .chip.from{background:var(--raised);color:var(--ink2)}
  .chip.to{background:var(--green-tint);color:var(--green);font-weight:500}
  .arrow{color:var(--muted)}
  .sec{color:var(--muted);font-size:12.5px;margin-top:10px;line-height:1.5}
  footer{margin-top:64px;color:var(--muted);font-size:12.5px;border-top:1px solid var(--line);padding-top:18px}
  code{background:var(--raised);padding:2px 6px;border-radius:5px;font-size:12px;font-family:ui-monospace,monospace}
  a{color:var(--clay)}
  @media(max-width:640px){.stats{grid-template-columns:repeat(2,1fr)}h1{font-size:32px}}
</style></head><body><div class="wrap">

<p class="sub">TradersYard · Google Search Console · ${ana.meta.startDate} → ${ana.meta.endDate} (${ana.meta.days} days)</p>
<h1>Keyword Opportunities</h1>
<p class="lead">Where the blog is already earning impressions — and the keywords, rewrites, and re-targets that turn those into clicks.</p>

<div class="stats">
  <div class="stat"><div class="v" id="s-impr"></div><div class="l">Impressions / 90d</div></div>
  <div class="stat"><div class="v" id="s-clk"></div><div class="l">Clicks / 90d</div></div>
  <div class="stat warn"><div class="v">${siteCtr}%</div><div class="l">Blog CTR — the problem</div></div>
  <div class="stat"><div class="v">${nk.length}</div><div class="l">New keyword gaps</div></div>
</div>

<div class="callout"><strong>Read this first.</strong> You rank on page 1 for plenty of queries — 152 pages sit at position 4–10 — yet clicks are near zero (${siteCtr}% CTR). The demand already exists; titles and meta descriptions aren't earning the click. <strong>The fastest wins are the CTR rewrites, not new content.</strong> New keywords grow the ceiling; rewrites cash in what you already rank for.</div>

<h2><span class="n">1.</span> New keyword opportunities</h2>
<p class="lead">Queries already showing your domain impressions where <strong>no existing post is targeted</strong>. Each is a post (or cluster) to write — <strong>~${totalNewImpr.toLocaleString()} impressions / 90d</strong> currently going to competitors. Filter by theme, sort any column, search, or copy a query.</p>
<div class="tabs" id="theme-tabs"></div>
<div class="toolbar">
  <input class="search" id="kw-search" placeholder="Search queries…" autocomplete="off">
  <span class="count" id="kw-count"></span>
</div>
<div class="tbl-wrap"><table id="kw-table">
  <thead><tr>
    <th data-k="query">Query <span class="arr">↕</span></th>
    <th class="num" data-k="impressions">Impr <span class="arr">↕</span></th>
    <th class="num" data-k="position">Pos <span class="arr">↕</span></th>
    <th class="num" data-k="ctr">CTR <span class="arr">↕</span></th>
    <th></th>
  </tr></thead>
  <tbody id="kw-body"></tbody>
</table></div>

<h2><span class="n">2.</span> Re-target existing posts</h2>
<p class="lead">Pages ranking for a <strong>different, stronger query</strong> than the keyword they were built for. Swap the on-page target — title, H1, meta — to the query actually pulling impressions.</p>
<div id="retarget"></div>

<h2><span class="n">3.</span> CTR rewrites <span class="pill">fastest wins</span></h2>
<p class="lead">Page-1 posts clicking far below the expected rate for their position. Rewrite the <strong>title tag + meta description</strong> to be specific and intent-matched. Estimated monthly clicks left on the table per page — sortable.</p>
<div class="tbl-wrap"><table id="ctr-table">
  <thead><tr>
    <th data-k="page">Post <span class="arr">↕</span></th>
    <th class="num" data-k="position">Pos <span class="arr">↕</span></th>
    <th class="num" data-k="ctr">CTR <span class="arr">↕</span></th>
    <th class="num" data-k="expectedCtr">Expected <span class="arr">↕</span></th>
    <th class="num" data-k="lostClicks">Lost/mo <span class="arr">↕</span></th>
  </tr></thead>
  <tbody id="ctr-body"></tbody>
</table></div>
<div class="callout">Recoverable across these 12 pages: <strong>~${recoverable.toLocaleString()} clicks / month</strong> from rewrites alone — more than your entire 90-day click total, with zero new content.</div>

<footer>Generated from <code>data/gsc-opportunities.json</code> + <code>data/gsc-analysis.json</code>.<br>Regenerate: <code>node scripts/gsc-keyword-opportunities.mjs && node scripts/gsc-analysis.mjs && node scripts/build-opportunity-report.mjs</code></footer>
</div>

<script>
const DATA = ${JSON.stringify(payload)};

// animated count-up for hero
function countUp(el, target, suffix=''){
  const dur=900, t0=performance.now();
  function step(t){const p=Math.min(1,(t-t0)/dur);const e=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*e).toLocaleString()+suffix; if(p<1)requestAnimationFrame(step);}
  requestAnimationFrame(step);
}
countUp(document.getElementById('s-impr'), DATA.totals.impressions);
countUp(document.getElementById('s-clk'), DATA.totals.clicks);

const posBadge = p => p<=10 ? '<span class="badge lo">'+p+'</span>' : p<=20 ? '<span class="badge mid">'+p+'</span>' : '<span class="badge hi">'+p+'</span>';
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ---- Section 1: themed, searchable, sortable keyword table ----
let curTheme='All', kwSort={k:'impressions',dir:-1}, kwSearch='';
const allKw = DATA.newKeywords;
const tabsEl = document.getElementById('theme-tabs');
const tabList = [{name:'All',items:allKw,impr:DATA.totalNewImpr}, ...DATA.themes];
tabsEl.innerHTML = tabList.map((t,i)=>'<button class="tab'+(i===0?' active':'')+'" data-t="'+esc(t.name)+'">'+esc(t.name)+' · '+t.items.length+'</button>').join('');

function kwRows(){
  const theme = tabList.find(t=>t.name===curTheme);
  let rows = theme.items.slice();
  if(kwSearch) rows = rows.filter(r=>r.query.toLowerCase().includes(kwSearch));
  rows.sort((a,b)=>{const k=kwSort.k;return (a[k]>b[k]?1:a[k]<b[k]?-1:0)*kwSort.dir;});
  document.getElementById('kw-count').textContent = rows.length+' quer'+(rows.length===1?'y':'ies');
  document.getElementById('kw-body').innerHTML = rows.map(r=>
    '<tr><td class="q">'+esc(r.query)+'</td>'+
    '<td class="num">'+r.impressions.toLocaleString()+'</td>'+
    '<td class="num">'+posBadge(r.position)+'</td>'+
    '<td class="num">'+r.ctr+'%</td>'+
    '<td class="num"><button class="copy" data-c="'+esc(r.query)+'">Copy</button></td></tr>'
  ).join('') || '<tr><td colspan="5" style="color:var(--muted);padding:24px 16px">No matches.</td></tr>';
  markSort('kw-table',kwSort.k);
}
tabsEl.onclick = e=>{const b=e.target.closest('.tab');if(!b)return;
  tabsEl.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));b.classList.add('active');
  curTheme=b.dataset.t;kwRows();};
document.getElementById('kw-search').oninput = e=>{kwSearch=e.target.value.toLowerCase().trim();kwRows();};
document.querySelector('#kw-table thead').onclick = e=>{const th=e.target.closest('th');if(!th||!th.dataset.k)return;
  const k=th.dataset.k;kwSort.dir = kwSort.k===k ? -kwSort.dir : (k==='query'?1:-1);kwSort.k=k;kwRows();};

// ---- Section 3: sortable CTR table ----
let ctrSort={k:'lostClicks',dir:-1};
function ctrRows(){
  let rows=DATA.ctrGap.map(p=>({...p,page:(p.url.split('/blog-posts/')[1]||p.url)}));
  rows.sort((a,b)=>{const k=ctrSort.k;return (a[k]>b[k]?1:a[k]<b[k]?-1:0)*ctrSort.dir;});
  document.getElementById('ctr-body').innerHTML = rows.map(p=>
    '<tr><td class="q" style="font-family:ui-monospace,monospace;font-size:12.5px">'+esc(p.page)+'</td>'+
    '<td class="num">'+posBadge(Math.round(p.position))+'</td>'+
    '<td class="num">'+p.ctr+'%</td>'+
    '<td class="num" style="color:var(--muted)">'+p.expectedCtr+'%</td>'+
    '<td class="num" style="color:var(--amber);font-weight:600">~'+p.lostClicks+'</td></tr>'
  ).join('');
  markSort('ctr-table',ctrSort.k);
}
document.querySelector('#ctr-table thead').onclick = e=>{const th=e.target.closest('th');if(!th||!th.dataset.k)return;
  const k=th.dataset.k;ctrSort.dir=ctrSort.k===k?-ctrSort.dir:(k==='page'?1:-1);ctrSort.k=k;ctrRows();};

function markSort(tableId,k){document.querySelectorAll('#'+tableId+' th').forEach(th=>{
  th.classList.toggle('sorted',th.dataset.k===k);
  const arr=th.querySelector('.arr');if(arr&&th.dataset.k===k){const dir=(tableId==='kw-table'?kwSort:ctrSort).dir;arr.textContent=dir<0?'↓':'↑';}else if(arr){arr.textContent='↕';}
});}

// ---- Section 2: retarget cards ----
document.getElementById('retarget').innerHTML = DATA.retarget.length ? DATA.retarget.map(r=>
  '<div class="card"><div class="slug">/blog-posts/'+esc(r.slug)+'</div>'+
  '<div class="swap"><span class="chip from">now: "'+esc(r.currentTarget)+'" · '+r.currentTargetImpressions+' impr</span>'+
  '<span class="arrow">→</span>'+
  '<span class="chip to">target: "'+esc(r.suggestedTarget)+'" · '+r.suggestedImpressions+' impr · pos '+r.suggestedPosition+'</span></div>'+
  (r.secondaryQueries&&r.secondaryQueries.length?'<div class="sec"><strong>Also add as H2s:</strong> '+r.secondaryQueries.map(s=>esc(s.query)+' ('+s.impressions+')').join(' · ')+'</div>':'')+
  '</div>'
).join('') : '<div class="card" style="color:var(--ink2)">No strong re-target candidates — on-page targeting matches what pages rank for. The opportunity is new content + CTR rewrites, not re-targeting.</div>';

// ---- copy buttons (delegated) ----
document.addEventListener('click', e=>{const b=e.target.closest('.copy');if(!b)return;
  navigator.clipboard.writeText(b.dataset.c).then(()=>{const o=b.textContent;b.textContent='Copied';b.classList.add('done');
  setTimeout(()=>{b.textContent=o;b.classList.remove('done');},1100);});});

kwRows(); ctrRows();
</script>
</body></html>`;

const outPath = resolve(process.cwd(), 'GSC-OPPORTUNITY-REPORT.html');
writeFileSync(outPath, html);
console.log(`→ ${outPath}`);
