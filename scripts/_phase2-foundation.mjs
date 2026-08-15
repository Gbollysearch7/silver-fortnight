import { readFileSync, writeFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
import { listItems } from '../lib/webflow.mjs';

const g = JSON.parse(readFileSync('data/gsc-analysis.json','utf8'));
const sd = g.strikingDistance;
// group all striking-distance queries by page
const byPage = {};
for (const r of sd) {
  const slug = r.url.split('/').pop();
  (byPage[slug] ||= { slug, url:r.url, queries:[], bestPos:99 });
  byPage[slug].queries.push({ q:r.query, pos:r.position, impr:r.impressions, clk:r.clicks });
  byPage[slug].bestPos = Math.min(byPage[slug].bestPos, r.position);
}
// rank pages by total striking-distance impressions
const pages = Object.values(byPage).map(p=>({
  ...p,
  totalImpr: p.queries.reduce((s,q)=>s+q.impr,0),
  totalClk: p.queries.reduce((s,q)=>s+q.clk,0),
})).sort((a,b)=>b.totalImpr-a.totalImpr);

// fetch live Webflow itemId + title for each
const slugs = pages.map(p=>p.slug);
const wf = {};
for (let off=0; off<400; off+=100){
  const { items } = await listItems({ limit:100, offset:off });
  if (!items.length) break;
  for (const it of items) if (slugs.includes(it.fieldData.slug)) wf[it.fieldData.slug]={id:it.id,title:it.fieldData.name};
}
pages.forEach(p=>{ p.itemId=wf[p.slug]?.id||null; p.title=wf[p.slug]?.title||'(not in webflow)'; });

writeFileSync('data/phase2-foundation.json', JSON.stringify(pages,null,2));
console.log(`${pages.length} striking-distance pages, ${pages.filter(p=>p.itemId).length} in Webflow\n`);
console.log('Pages ranked by recoverable impressions (top 16 = the Phase-2 work queue):\n');
pages.slice(0,16).forEach((p,i)=>{
  console.log(`${String(i+1).padStart(2)}. ${p.slug.slice(0,42)}  [${p.totalImpr} impr, ${p.queries.length} queries, best pos ${p.bestPos}]`);
  console.log(`    queries: ${p.queries.slice(0,5).map(q=>`"${q.q.slice(0,32)}"`).join(', ')}`);
});
