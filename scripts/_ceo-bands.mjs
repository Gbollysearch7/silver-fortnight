import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
const fmt=d=>d.toISOString().slice(0,10);
const now=new Date();const e=fmt(new Date(now-3*864e5)),s=fmt(new Date(now-31*864e5));
// queries by position band
const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:s,endDate:e,dimensions:['query'],rowLimit:5000}});
const rows=r.data.rows||[];
let b1=0,b2=0,b3=0,b4=0,imp1=0,imp2=0,imp3=0;
for(const x of rows){const p=x.position;if(p<=3){b1++;imp1+=x.impressions;}else if(p<=10){b2++;imp2+=x.impressions;}else if(p<=20){b3++;imp3+=x.impressions;}else b4++;}
console.log('=== QUERY POSITION BANDS (last 28d) ===');
console.log('Total ranking queries:',rows.length);
console.log('Pos 1-3 (winning):',b1,'queries,',Math.round(imp1),'impr');
console.log('Pos 4-10 (page 1, CTR upside):',b2,'queries,',Math.round(imp2),'impr');
console.log('Pos 11-20 (striking distance):',b3,'queries,',Math.round(imp3),'impr');
console.log('Pos 21+ (long tail):',b4,'queries');
console.log('\nStriking-distance + page-1-CTR = the near-term click upside.');
