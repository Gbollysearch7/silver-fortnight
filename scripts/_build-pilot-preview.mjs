import { readFileSync, writeFileSync } from 'fs';
const data=JSON.parse(readFileSync('data/pilot-preview-data.json','utf8'));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const cards=data.map((p,i)=>`
<section class="post">
  <div class="phead">
    <span class="num">${i+1}</span>
    <div><h2>${p.slug.replace(/-[a-z0-9]{4,6}$/,'')}</h2>
    <div class="target">Target keyword: <b>${p.target}</b></div></div>
    <div class="verdicts"><span class="v ok">Accuracy: ${p.acc}</span><span class="v ok">Quality: ${p.qual}</span></div>
  </div>
  <div class="wc"><span class="old">BEFORE: ${p.oldwc} words</span> <span class="arrow">→</span> <span class="new">AFTER: ${p.newwc} words</span> <span class="gain">+${Math.round((p.newwc/p.oldwc-1)*100)}%</span></div>
  <div class="cols">
    <div class="col"><div class="lab old">BEFORE (thin / original)</div><div class="render dark">${p.oldHtml}</div></div>
    <div class="col"><div class="lab new">AFTER (rewritten, gated, fact-checked)</div><div class="render dark">${p.newHtml}</div></div>
  </div>
</section>`).join('');
const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Content Pilot — Before / After</title>
<style>
:root{--bg:#f7f4ee;--ink:#1f1e1c;--muted:#73706a;--coral:#d97757;--sage:#6a8a73;--line:#e8e3d9;}
body{margin:0;background:var(--bg);font:15px/1.6 -apple-system,Segoe UI,Inter,sans-serif;color:var(--ink)}
.wrap{max-width:1280px;margin:0 auto;padding:32px 20px 80px}
h1{font-size:30px;margin:0 0 6px}.sub{color:var(--muted);font-size:17px;margin-bottom:28px}
.post{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;margin:22px 0;box-shadow:0 4px 16px rgba(31,30,28,.05)}
.phead{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.num{width:32px;height:32px;border-radius:9px;background:var(--coral);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center}
.phead h2{font-size:18px;margin:0}.target{color:var(--muted);font-size:13px}.target b{color:var(--ink)}
.verdicts{margin-left:auto;display:flex;gap:8px}.v{font:600 11px sans-serif;padding:5px 10px;border-radius:999px}.v.ok{background:#e6efe8;color:#4c6b55}
.wc{margin:14px 0;font:600 13px sans-serif}.old{color:#b5453a}.new{color:var(--sage)}.arrow{color:var(--muted);margin:0 6px}.gain{background:#e6efe8;color:#4c6b55;padding:3px 9px;border-radius:6px;margin-left:8px}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px}
@media(max-width:900px){.cols{grid-template-columns:1fr}}
.lab{font:700 11px sans-serif;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;border-radius:8px 8px 0 0}
.lab.old{background:#f5e6df;color:#b5453a}.lab.new{background:#e6efe8;color:#4c6b55}
.render{border:1px solid var(--line);border-top:none;border-radius:0 0 10px 10px;height:620px;overflow:auto;padding:20px}
.render.dark{background:#12121a;color:#94a3b8}
.render.dark h1{color:#e2e8f0;font-size:24px}.render.dark h2{color:#e2e8f0;font-size:19px}.render.dark h3{color:#e2e8f0}
.render.dark a{color:#4250eb}.render.dark table{width:100%;border-collapse:collapse}.render.dark img{max-width:100%}
.render.dark details{border-bottom:1px solid #2d2d44;padding:10px 0}.render.dark summary{cursor:pointer;color:#e2e8f0;font-weight:600}
</style></head><body><div class="wrap">
<h1>Content Pilot — Before / After</h1>
<div class="sub">3 thin posts rewritten to rank-worthy depth, grounded in verified TradersYard facts, passed through both reviewer gates (accuracy + quality). Scroll each panel. Fabrications removed, FAQs as dropdowns, dark-theme consistent.</div>
${cards}
</div></body></html>`;
writeFileSync('PILOT-BEFORE-AFTER.html',html);
console.log('built PILOT-BEFORE-AFTER.html');
