import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
const fmt=d=>d.toISOString().slice(0,10);
const now=new Date();const e=fmt(new Date(now-3*864e5)),s=fmt(new Date(now-31*864e5));
const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:s,endDate:e,dimensions:['page'],rowLimit:1000,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'}]}]}});
const rows=(r.data.rows||[]).map(x=>({slug:x.keys[0].replace('https://tradersyard.com/blog-posts/',''),impr:Math.round(x.impressions),clicks:Math.round(x.clicks),ctr:(x.ctr*100),pos:x.position}));
// pages ranking page-1/striking with weak CTR = title rewrite candidates
const cand=rows.filter(x=>x.impr>=150&&x.pos<=15&&x.ctr<2.5).sort((a,b)=>b.impr-a.impr);
console.log('=== PAGES: rank well, get few clicks → title/header rewrite candidates ===');
console.log('IMPR'.padEnd(7)+'CLK'.padEnd(5)+'CTR'.padEnd(7)+'POS'.padEnd(6)+'PAGE');
cand.slice(0,16).forEach(x=>console.log(String(x.impr).padEnd(7)+String(x.clicks).padEnd(5)+(x.ctr.toFixed(1)+'%').padEnd(7)+x.pos.toFixed(1).padEnd(6)+x.slug.slice(0,46)));
console.log('\nTotal candidate pages:',cand.length);
// also: pages already ranking well overall (top by impressions) for the "we rank for these" table
console.log('\n=== TOP PAGES BY IMPRESSIONS (we are visible for these) ===');
rows.sort((a,b)=>b.impr-a.impr).slice(0,12).forEach(x=>console.log('  '+String(x.impr).padEnd(6)+'impr  pos '+x.pos.toFixed(1).padEnd(5)+'  ctr '+x.ctr.toFixed(1)+'%  '+x.slug.slice(0,44)));
