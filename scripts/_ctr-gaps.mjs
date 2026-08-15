import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
const fmt=d=>d.toISOString().slice(0,10);
const now=new Date();const e=fmt(new Date(now-3*864e5)),s=fmt(new Date(now-31*864e5));
// queries: high impressions, position 4-20, low CTR = title/meta rewrite opportunity
const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:s,endDate:e,dimensions:['query'],rowLimit:25000}});
const rows=(r.data.rows||[]).map(x=>({q:x.keys[0],impr:Math.round(x.impressions),clicks:Math.round(x.clicks),ctr:(x.ctr*100),pos:x.position}));
// CTR-gap = pos 4-20, impr>=80, ctr below ~2%
const gaps=rows.filter(x=>x.pos>=4&&x.pos<=20&&x.impr>=80).sort((a,b)=>b.impr-a.impr);
console.log('=== TITLE/META REWRITE OPPORTUNITIES (pos 4-20, high impressions, low clicks) ===');
console.log('Total such queries:',gaps.length,'\n');
console.log('TOP 18 by impressions:');
console.log('IMPR'.padEnd(7)+'CLICKS'.padEnd(8)+'CTR'.padEnd(8)+'POS'.padEnd(7)+'QUERY');
gaps.slice(0,18).forEach(x=>console.log(String(x.impr).padEnd(7)+String(x.clicks).padEnd(8)+(x.ctr.toFixed(1)+'%').padEnd(8)+x.pos.toFixed(1).padEnd(7)+x.q.slice(0,52)));
// striking distance: pos 11-20 specifically
const striking=rows.filter(x=>x.pos>10&&x.pos<=20&&x.impr>=50).sort((a,b)=>b.impr-a.impr);
console.log('\n=== STRIKING DISTANCE (pos 11-20, one push to page 1) ===');
console.log('Count:',striking.length,'| Top 10:');
striking.slice(0,10).forEach(x=>console.log('  '+String(x.impr).padEnd(6)+'impr  pos '+x.pos.toFixed(1).padEnd(5)+x.q.slice(0,50)));
