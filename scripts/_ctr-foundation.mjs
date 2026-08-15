import { readFileSync, writeFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
import { listItems } from '../lib/webflow.mjs';

const g = JSON.parse(readFileSync('data/gsc-analysis.json','utf8'));
const ctrGap = g.ctrGap.sort((a,b)=>b.lostClicks-a.lostClicks); // 40 pages
const slugs = ctrGap.map(p => p.url.split('/').pop());

// --- GSC: top queries per page ---
const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf-8'));
const auth = new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc = google.searchconsole({version:'v1',auth});
const fmt=d=>d.toISOString().slice(0,10);
const start=fmt(new Date(Date.now()-92*864e5)), end=fmt(new Date(Date.now()-2*864e5));

console.log('Pulling per-page queries from GSC...');
const pageQueries = {};
for (const p of ctrGap) {
  const res = await sc.searchanalytics.query({
    siteUrl: GSC_SITE_URL||'sc-domain:tradersyard.com',
    requestBody:{ startDate:start, endDate:end, dimensions:['query'], rowLimit:15,
      dimensionFilterGroups:[{filters:[{dimension:'page',operator:'equals',expression:p.url}]}] },
  });
  pageQueries[p.url.split('/').pop()] = (res.data.rows||[]).map(r=>({
    q:r.keys[0], impr:Math.round(r.impressions), pos:+r.position.toFixed(1), ctr:+(r.ctr*100).toFixed(2)
  }));
}

// --- Webflow: current title + meta for each ---
console.log('Pulling live Webflow title/meta...');
const wf = {};
for (let off=0; off<400; off+=100){
  const { items } = await listItems({ limit:100, offset:off });
  if (!items.length) break;
  for (const it of items){
    const s = it.fieldData.slug;
    if (slugs.includes(s)) wf[s] = {
      id: it.id,
      title: it.fieldData.name || '',
      summary: it.fieldData['post-summary'] || '',
    };
  }
}

// --- Merge ---
const out = ctrGap.map(p=>{
  const slug = p.url.split('/').pop();
  return {
    slug, url:p.url, position:p.position, ctr:p.ctr, expectedCtr:p.expectedCtr,
    lostClicks:p.lostClicks, impressions:p.impressions,
    currentTitle: wf[slug]?.title || '(not found in Webflow)',
    currentSummary: wf[slug]?.summary || '',
    titleLen: (wf[slug]?.title||'').length,
    summaryLen: (wf[slug]?.summary||'').length,
    itemId: wf[slug]?.id || null,
    topQueries: pageQueries[slug] || [],
  };
});
writeFileSync('data/ctr-foundation.json', JSON.stringify(out,null,2));
console.log(`\nDone. ${out.length} pages. Found in Webflow: ${out.filter(p=>p.itemId).length}`);
console.log('Sample (first 3):');
out.slice(0,3).forEach(p=>{
  console.log(`\n${p.slug}  [pos ${p.position}, CTR ${p.ctr}%, -${p.lostClicks} clk]`);
  console.log(`  title: ${p.currentTitle}`);
  console.log(`  top q: ${p.topQueries.slice(0,3).map(q=>`"${q.q}"(${q.impr})`).join(', ')}`);
});
