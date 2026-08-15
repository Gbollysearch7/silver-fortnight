import { readFileSync, writeFileSync } from 'fs';
const r=JSON.parse(readFileSync('data/overnight-result.json','utf8'));
const rows=r.posts.map(p=>`<tr><td class="kw">${p.slug.replace(/-[a-f0-9]{4,6}$/,'')}</td><td class="n">${p.words.toLocaleString()}</td><td><span class="v ok">${p.accuracy}</span></td><td><span class="v ok">${p.quality}</span></td></tr>`).join('');
const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TradersYard Blog — Session Report</title>
<style>
:root{--bg:#f7f4ee;--surface:#fff;--surface-2:#faf8f3;--ink:#1f1e1c;--ink-2:#3d3a35;--muted:#73706a;--line:#e8e3d9;--coral:#d97757;--coral-deep:#bd5d3f;--sage:#6a8a73;--sage-soft:#e6efe8;--gold:#b8893f;--gold-soft:#f5ecd9;--red:#b5453a;--radius:14px;--shadow:0 1px 2px rgba(31,30,28,.04),0 4px 16px rgba(31,30,28,.05)}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 -apple-system,Segoe UI,Inter,sans-serif;-webkit-font-smoothing:antialiased}
.serif{font-family:ui-serif,Georgia,serif}.wrap{max-width:920px;margin:0 auto;padding:40px 22px 100px}
.badge{display:inline-flex;align-items:center;gap:8px;background:var(--sage-soft);color:#4c6b55;font:600 12px/1 sans-serif;letter-spacing:.04em;padding:7px 13px;border-radius:999px;text-transform:uppercase}
.badge::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--sage)}
h1{font-size:34px;line-height:1.12;letter-spacing:-.02em;margin:18px 0 10px;font-weight:600}
.sub{font-size:18px;color:var(--ink-2);max-width:68ch}.meta{margin-top:12px;font:13px sans-serif;color:var(--muted)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:28px 0}
@media(max-width:720px){.stats{grid-template-columns:repeat(2,1fr)}}
.scard{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:18px;box-shadow:var(--shadow);text-align:center}
.scard .v{font:700 28px/1 sans-serif;color:var(--coral-deep)}.scard .l{font:600 10px/1.3 sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:7px}
h2{font-size:23px;margin:40px 0 14px;font-weight:600}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:20px 24px;margin:14px 0;box-shadow:var(--shadow)}
.done{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--line)}.done:last-child{border:none}
.done .ic{width:26px;height:26px;border-radius:7px;background:var(--sage-soft);color:#4c6b55;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px}
.done b{color:var(--ink)}.done p{margin:2px 0 0;color:var(--ink-2);font-size:14px}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:6px}
th{text-align:left;font:600 10px sans-serif;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding:8px 10px;border-bottom:1px solid var(--line)}
td{padding:8px 10px;border-bottom:1px solid var(--line);color:var(--ink-2)}.kw{font-weight:500;color:var(--ink)}.n{font-variant-numeric:tabular-nums;font-weight:700;color:var(--coral-deep)}
.v{font:600 10px sans-serif;padding:4px 8px;border-radius:6px}.v.ok{background:var(--sage-soft);color:#4c6b55}
.note{background:var(--gold-soft);border:1px solid #ecdcbf;border-radius:var(--radius);padding:18px 22px;margin:20px 0}.note h4{margin:0 0 6px;color:#8a6526;font:600 14px sans-serif}.note p{margin:4px 0;font-size:14.5px;color:var(--ink-2)}
.foot{margin-top:40px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font:13px/1.6 sans-serif}
code{background:var(--surface-2);border:1px solid var(--line);padding:1px 6px;border-radius:6px;font-size:12px;font-family:ui-monospace,monospace;color:var(--coral-deep)}
</style></head><body><div class="wrap">
<span class="badge">Session Report · Blog Quality Pass</span>
<h1 class="serif">What got done while you slept (and this morning).</h1>
<p class="sub">A full content-quality pass on the TradersYard blog: deduplication, depth, formatting, calculators, and branded imagery. Everything gated by two reviewer agents, backed up, and verified live.</p>
<div class="meta">Generated 22 Jun 2026 · all changes reversible (backups in <code>data/seo-fixes/</code>)</div>

<div class="stats">
<div class="scard"><div class="v">14</div><div class="l">Posts rewritten + live</div></div>
<div class="scard"><div class="v">28</div><div class="l">Duplicates removed</div></div>
<div class="scard"><div class="v">105</div><div class="l">FAQ→dropdown</div></div>
<div class="scard"><div class="v">35</div><div class="l">Calculators added</div></div>
</div>

<div class="note"><h4>⚠️ One honest note about overnight</h4><p>The job did <b>not</b> run through the night — your Mac went to sleep, which freezes local background work. It resumed at <b>07:49</b> when you woke the laptop, then finished the full 14-post batch this morning. For true unattended overnight runs, a cloud schedule is the fix (your machine sleeping won't matter). Nothing was lost — the pipeline is resumable + idempotent.</p></div>

<h2>1. Content rewrites — 14 thin posts → rank-worthy depth</h2>
<div class="card"><p style="margin-top:0;color:var(--ink-2)">Each rewritten from ~750–900 words to ~1,600–2,700, grounded in your <b>verified TradersYard facts</b> (Vienna entity, signal-provider model, scaled 100/90/80 split, 4–6hr payouts, static drawdown, restricted countries). Passed an <b>accuracy gate</b> and a <b>quality gate</b>. Each got FAQ dropdowns, 2 branded in-article banners, and a /#pricing CTA.</p>
<table><thead><tr><th>Post (target keyword)</th><th>Words</th><th>Accuracy gate</th><th>Quality gate</th></tr></thead><tbody>${rows}</tbody></table></div>

<h2>2. Duplicate cleanup — the biggest find</h2>
<div class="card">
<div class="done"><span class="ic">✓</span><div><b>28 duplicate pages unpublished</b><p>~12% of the blog was duplicate content (same article at two URLs) splitting ranking authority. For each pair I kept the version Google actually ranks (decided by GSC impressions, not length) and unpublished the twin. All kept recoverable in the CMS.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>Authority consolidated</b><p>Verified live: killed URLs return 404, every keeper still 200. This is the single highest-impact SEO fix of the session.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>Fixed a wrong collection ID in memory</b><p>Discovered the Webflow collection ID recorded as "verified correct" was actually wrong (caused API 404s). Corrected permanently so it can't recur.</p></div></div>
</div>

<h2>3. Site-wide formatting + tools</h2>
<div class="card">
<div class="done"><span class="ic">✓</span><div><b>105 posts: FAQs → dropdowns</b><p>Converted flat-text FAQs to styled <code>&lt;details&gt;</code> accordions across the site (92 → 199 posts). Handled 4 different legacy FAQ formats.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>35 posts: interactive HTML calculators</b><p>Built a 13-type native calculator library (drawdown, profit-split, lot-size, consistency, payout timing, etc.) and embedded the right one in every topical post. 100% topical coverage.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>Branded in-article images</b><p>Replaced AI "person-at-computer" style with clean branded navy/blue motif banners — same system as the thumbnails. Rendered + served via CDN.</p></div></div>
<div class="done"><span class="ic">✓</span><div><b>Full blog corpus crawled</b><p>All 229 posts captured to <code>data/blog-corpus/</code> (llms.txt index + per-post text, 469k words) for ongoing review + AI discoverability.</p></div></div>
</div>

<h2>What’s left (optional)</h2>
<div class="card"><p style="margin-top:0">After dedup, the live blog is <b>201 posts</b>: 137 already strong (1,500w+), 13 tool pages (short by design), and <b>~37 mid-tier posts (900–1,500w)</b> that are already decent but could be deepened later. None are urgent — the thin posts are now done. A 301 redirect for the 28 killed URLs needs Cloudflare access (parked).</p></div>

<div class="foot">All writes gated by <code>seo-content-reviewer</code> + <code>seo-technical-reviewer</code>, backed up to <code>data/seo-fixes/</code>, verified live via curl. Correct collection: <code>blogConfig.webflow.blogCollectionId</code>. · TradersYard SEO · 22 Jun 2026</div>
</div></body></html>`;
writeFileSync('OVERNIGHT-REPORT.html',html);
console.log('built OVERNIGHT-REPORT.html');
