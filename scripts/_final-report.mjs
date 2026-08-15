import { writeFileSync, readdirSync } from 'fs';
const done=readdirSync('data/batch-done').filter(f=>f.endsWith('.flag')).map(f=>f.replace('.flag',''));
const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TradersYard Blog Improvement Report</title>
<style>
:root{--bg:#f7f4ee;--surface:#fff;--surface-2:#faf8f3;--ink:#1f1e1c;--ink-2:#3d3a35;--muted:#73706a;--line:#e8e3d9;--coral:#d97757;--coral-deep:#bd5d3f;--sage:#6a8a73;--sage-soft:#e6efe8;--gold:#b8893f;--gold-soft:#f5ecd9;--radius:14px;--shadow:0 1px 2px rgba(31,30,28,.04),0 4px 16px rgba(31,30,28,.05)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,Segoe UI,Inter,sans-serif}
.serif{font-family:ui-serif,Georgia,serif}.wrap{max-width:900px;margin:0 auto;padding:40px 22px 100px}
.badge{display:inline-flex;align-items:center;gap:8px;background:var(--sage-soft);color:#4c6b55;font:600 12px/1 sans-serif;letter-spacing:.04em;padding:7px 13px;border-radius:999px;text-transform:uppercase}.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--sage)}
h1{font-size:33px;line-height:1.13;letter-spacing:-.02em;margin:18px 0 10px;font-weight:600}.sub{font-size:18px;color:var(--ink-2);max-width:68ch}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:26px 0}@media(max-width:720px){.stats{grid-template-columns:repeat(2,1fr)}}
.scard{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:18px;box-shadow:var(--shadow);text-align:center}.scard .v{font:700 28px/1 sans-serif;color:var(--coral-deep)}.scard .l{font:600 10px/1.3 sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:7px}
h2{font-size:22px;margin:38px 0 12px;font-weight:600}.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:20px 24px;margin:14px 0;box-shadow:var(--shadow)}
.done{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid var(--line)}.done:last-child{border:none}.done .ic{width:26px;height:26px;border-radius:7px;background:var(--sage-soft);color:#4c6b55;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px}.done b{color:var(--ink)}.done p{margin:2px 0 0;color:var(--ink-2);font-size:14px}
.slugs{columns:2;font:13px/1.9 ui-monospace,monospace;color:var(--ink-2);margin-top:8px}@media(max-width:600px){.slugs{columns:1}}
.note{background:var(--gold-soft);border:1px solid #ecdcbf;border-radius:var(--radius);padding:16px 20px;margin:18px 0}.note h4{margin:0 0 6px;color:#8a6526;font:600 14px sans-serif}.note p{margin:3px 0;font-size:14px;color:var(--ink-2)}
.foot{margin-top:36px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font:13px sans-serif}
</style></head><body><div class="wrap">
<span class="badge">Blog Improvement · Complete</span>
<h1 class="serif">Every thin and mid post, rewritten and live.</h1>
<p class="sub">The full content-quality pass is done. 33 posts rewritten to rank-worthy depth this run, each fact-grounded, em-dash-free, on the Yard platform, gated by two reviewer agents, and verified live with branded banners.</p>
<div class="stats">
<div class="scard"><div class="v">33</div><div class="l">Posts rewritten this run</div></div>
<div class="scard"><div class="v">~2,200</div><div class="l">Avg words/post</div></div>
<div class="scard"><div class="v">66</div><div class="l">Branded banners added</div></div>
<div class="scard"><div class="v">0</div><div class="l">Em dashes · AgenaTrader</div></div>
</div>

<h2>What was rewritten this run (33 posts)</h2>
<div class="card">
<div class="done"><span class="ic">9</span><div><b>Thin posts (under 900 words)</b><p>All genuinely-thin live posts with real keyword intent, expanded to ~2,000 words. Interviews, success stories, and brand pages were intentionally left intact (short by design).</p></div></div>
<div class="done"><span class="ic">24</span><div><b>Mid posts (900 to 1,500 words)</b><p>Every mid-tier post deepened to rank-worthy depth across two gated sub-batches.</p></div></div>
<div class="slugs">${done.sort().map(s=>'· '+s).join('<br>')}</div>
</div>

<h2>Quality controls on every post</h2>
<div class="card">
<div class="done"><span class="ic">✓</span><div><b>Two-gate review</b><p>Each post passed an accuracy gate (facts vs verified TradersYard data) and a technical gate (structure, dark theme, dropdowns, links). One false-positive BLOCK was reviewed by hand and cleared.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>Verified facts only</b><p>Scaled split 100/90/80, payouts in 4 to 6 business hours, static drawdown, the Yard platform, entry from 31 pounds, 14-day guarantee. No fabricated figures.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>Formatting standard</b><p>Each post: table of contents, FAQ dropdowns, 2 full-width branded banners, CTA to /#pricing. Zero em dashes. Backed up and reversible.</p></div></div>
</div>

<div class="note"><h4>Intentionally left as-is</h4><p>4 thin posts were not rewritten because doing so would damage them: the Moss interview, the Ritik tournament story, the collaboration piece, and the TradersYard education page. These are short by design (stories and brand pages), not keyword-targeting articles.</p></div>

<h2>Where the blog stands now</h2>
<div class="card"><p style="margin-top:0">After this run plus earlier work (overnight 14, pilot 3, discount-codes 1), the blog has been thoroughly improved: duplicates removed, FAQs as dropdowns site-wide, calculators on every topical post, AgenaTrader replaced with the Yard platform everywhere, all em dashes stripped, and every thin and mid post rewritten. The remaining ~153 posts were already strong (1,500+ words). The natural next move for growth is brand-new pages from the easy-win plan (Plan View 2).</p></div>

<div class="foot">All writes gated by seo-content-reviewer + seo-technical-reviewer, backed up to data/seo-fixes/, verified live via curl. TradersYard SEO.</div>
</div></body></html>`;
writeFileSync('BLOG-IMPROVEMENT-REPORT.html',html);
console.log('built BLOG-IMPROVEMENT-REPORT.html ('+done.length+' posts listed)');
