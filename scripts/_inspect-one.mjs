import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
import { listItems } from '../lib/webflow.mjs';

// 1. GSC queries
const creds = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf-8'));
const auth = new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc = google.searchconsole({version:'v1',auth});
const fmt=d=>d.toISOString().slice(0,10);
const res = await sc.searchanalytics.query({
  siteUrl: GSC_SITE_URL||'sc-domain:tradersyard.com',
  requestBody:{
    startDate: fmt(new Date(Date.now()-92*864e5)), endDate: fmt(new Date(Date.now()-2*864e5)),
    dimensions:['query'], rowLimit:25,
    dimensionFilterGroups:[{filters:[{dimension:'page',operator:'equals',expression:'https://tradersyard.com/blog-posts/prop-firm-copy-trading'}]}],
  },
});
console.log("=== TOP QUERIES Google ranks this page for ===");
(res.data.rows||[]).slice(0,12).forEach(r=>{
  console.log(`  ${String(Math.round(r.impressions)).padStart(5)} impr  pos ${r.position.toFixed(1).padStart(5)}  "${r.keys[0]}"`);
});

// 2. Live Webflow current title + meta
console.log("\n=== LIVE WEBFLOW current values ===");
let found=null;
for (let off=0; off<300 && !found; off+=100){
  const { items } = await listItems({ limit:100, offset:off });
  found = items.find(i => i.fieldData.slug === 'prop-firm-copy-trading');
  if (!items.length) break;
}
if (found){
  const f = found.fieldData;
  console.log("  itemId:      ", found.id);
  console.log("  name (title):", JSON.stringify(f.name));
  console.log("  post-summary:", JSON.stringify(f['post-summary']));
  console.log("  summary len: ", (f['post-summary']||'').length, "chars");
} else {
  console.log("  NOT FOUND in first 300 items");
}
