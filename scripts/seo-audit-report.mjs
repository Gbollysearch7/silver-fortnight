#!/usr/bin/env node
/**
 * Render data/keyword-map/serp-gap-audit.json (or seo-audit-full.json) into a styled HTML report.
 *   node scripts/seo-audit-report.mjs [--in data/keyword-map/serp-gap-audit.json] [--out SEO-AUDIT-REPORT.html]
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { parseArgs } from '../lib/utils.mjs';

const args = parseArgs();
const ROOT = resolve(import.meta.dirname, '..');
const inPath = resolve(ROOT, args.in || 'data/keyword-map/seo-audit-full.json');
const outPath = resolve(ROOT, args.out || 'SEO-AUDIT-REPORT.html');
if (!existsSync(inPath)) { console.error('No audit data at', inPath, '— run seo-audit.mjs first'); process.exit(1); }
const data = JSON.parse(readFileSync(inPath, 'utf8'));

// normalize both schemas (serp-gap-audit vs seo-audit-full)
const rows = data.map(d => ({
  kw: d.kw, slug: d.slug, ours: d.ourWords,
  avg: d.serp ? d.serp.avg : d.avg, max: d.serp ? d.serp.max : d.max,
  intent: d.serp ? d.serp.intent : d.intent,
  target: d.target || (d.serp ? Math.max(d.serp.avg, Math.round((d.serp.max || 0) * 0.8)) : Math.max(d.avg || 0, Math.round((d.max || 0) * 0.8))),
  verdict: d.lenVerdict || d.verdict,
  onPage: d.onPageScore != null ? d.onPageScore : null,
  impr: d.monthlyImpr || 0, pos: d.topPos || null,
})).sort((a, b) => (b.target - b.ours) - (a.target - a.ours)); // biggest gap first

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const short = rows.filter(r => r.verdict === 'SHORT').length;
const toolI = rows.filter(r => r.intent === 'TOOL' || r.intent === 'TOOL-heavy' || r.intent === 'VIDEO').length;
const totalAddWords = rows.filter(r => r.verdict === 'SHORT').reduce((s, r) => s + Math.max(0, r.target - r.ours), 0);

const tr = rows.map((r, i) => {
  const gap = Math.max(0, r.target - r.ours);
  const vClass = r.verdict === 'SHORT' ? 'short' : r.verdict === 'LONGEST' ? 'good' : r.verdict === 'OK' ? 'ok' : 'na';
  const intentBad = (r.intent || '').startsWith('TOOL') || r.intent === 'VIDEO' || (r.intent || '').includes('FORUM');
  return `<tr>
    <td class=num>${i + 1}</td>
    <td><div class=kw>${esc(r.kw)}</div><a class=u href="https://tradersyard.com/blog-posts/${esc(r.slug)}" target=_blank>${esc(r.slug)}</a></td>
    <td class=num>${r.impr || 0}</td>
    <td class="num ${vClass}">${r.ours}</td>
    <td class=num>${r.avg || '–'}</td>
    <td class=num>${r.max || '–'}</td>
    <td class="num tgt">${r.target || '–'}</td>
    <td class="num ${gap > 0 ? 'short' : 'good'}">${gap > 0 ? '+' + gap : '✓'}</td>
    <td><span class="badge ${intentBad ? 'warn' : 'ok'}">${esc(r.intent)}</span></td>
    <td class=num>${r.onPage != null ? r.onPage + '/7' : '–'}</td>
  </tr>`;
}).join('');

const html = `<!DOCTYPE html><html lang=en><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>SEO Competitive Audit — TradersYard Blog</title><style>
:root{--bg:#0c0f1a;--panel:#151c2e;--panel2:#1a2238;--line:#26304d;--text:#e4e9f4;--muted:#8b96b3;--dim:#5f6a88;--blue:#4250eb;--blue2:#7c8cff;--green:#4ade80;--amber:#fbbf24;--red:#f87171;--mono:'JetBrains Mono',ui-monospace,Menlo,monospace;--sans:'Inter',-apple-system,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.6}
.wrap{max-width:1080px;margin:0 auto;padding:44px 26px 90px}
.kick{font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--blue2);margin-bottom:10px}
h1{font-size:30px;margin:0 0 10px}.sub{color:var(--muted);max-width:680px}
.dash{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}
.c{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:16px 20px;flex:1;min-width:150px}
.c .n{font-size:26px;font-weight:800}.c .n.r{color:var(--red)}.c .n.a{color:var(--amber)}.c .n.g{color:var(--green)}
.c .l{font-size:12px;color:var(--muted);margin-top:4px}
.note{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:10px;padding:16px 20px;margin:22px 0;color:var(--muted);font-size:13.5px}.note b{color:var(--text)}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th{font-family:var(--mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;text-align:left;color:var(--dim);padding:10px 11px;border-bottom:1px solid var(--line);background:rgba(255,255,255,.02);white-space:nowrap}
td{padding:9px 11px;border-bottom:1px solid #1e2740;vertical-align:top;color:var(--muted)}tr:last-child td{border-bottom:none}tr:hover td{background:rgba(66,80,235,.05)}
.num{font-family:var(--mono);font-size:12px;white-space:nowrap}.kw{color:#fff;font-weight:600;font-size:12.5px}.u{font-family:var(--mono);font-size:10px;color:var(--blue2);text-decoration:none}
.short{color:var(--red);font-weight:700}.good{color:var(--green);font-weight:700}.ok{color:var(--amber)}.na{color:var(--dim)}.tgt{color:var(--blue2);font-weight:700}
.badge{font-family:var(--mono);font-size:10px;border-radius:5px;padding:2px 7px}.badge.ok{background:rgba(74,222,128,.1);color:var(--green);border:1px solid rgba(74,222,128,.3)}.badge.warn{background:rgba(251,191,36,.12);color:var(--amber);border:1px solid rgba(251,191,36,.3)}
</style></head><body><div class=wrap>
<div class=kick>● Competitive SERP analysis · read-only</div>
<h1>SEO Audit: can these posts actually rank?</h1>
<p class=sub>For each post: the keyword it ranks for (GSC), how long the page-1 competitors are (live Firecrawl scrape), and whether we're long enough to compete. Sorted by biggest word-count gap first.</p>
<div class=dash>
<div class=c><div class=n>${rows.length}</div><div class=l>posts audited</div></div>
<div class=c><div class="n r">${short}</div><div class=l>too short to outrank (below competitor avg)</div></div>
<div class=c><div class="n a">${toolI}</div><div class=l>intent mismatch (SERP wants a tool/video)</div></div>
<div class=c><div class="n a">${(totalAddWords/1000).toFixed(1)}k</div><div class=l>words to add across short posts to hit target</div></div>
</div>
<div class=note><b>How "target" is calculated:</b> the greater of the competitor average word count and 80% of the longest page-1 result. Beating the average gets you competitive; approaching the longest gets you a real shot at the top. <b>Intent</b> flags when the SERP is dominated by tools, videos, or forums — in those cases a prose article alone won't win, the page needs to match the format (e.g. an embedded calculator).</div>
<table><thead><tr><th>#</th><th>Keyword / post</th><th>Impr/mo</th><th>Ours</th><th>Comp avg</th><th>Comp max</th><th>Target</th><th>Gap</th><th>Intent</th><th>On-page</th></tr></thead><tbody>${tr}</tbody></table>
<div class=note style="border-left-color:var(--blue)"><b>What this changes:</b> word count is now derived from the live SERP, not a guess. The honest finding from the first run: most posts were written to a ~750-word floor while competitors run 1,500–3,300 words. The fix is to expand the SHORT posts to their target length with genuinely useful content (not padding), and convert the TOOL-intent keywords into real interactive pages. Re-run <code>node scripts/seo-audit.mjs</code> any time to re-audit all live posts.</div>
</div></body></html>`;

writeFileSync(outPath, html);
console.log('Wrote', outPath, '—', rows.length, 'rows');
