import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const thin=JSON.parse(readFileSync('data/thin-posts.json','utf8'));
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const fmt=d=>d.toISOString().slice(0,10);
const start=fmt(new Date(Date.now()-92*864e5)),end=fmt(new Date(Date.now()-2*864e5));
console.log('=== THIN POSTS: real target query (from GSC) + how they rank ===\n');
for(const p of thin.slice(0,12)){
  const res=await sc.searchanalytics.query({siteUrl:GSC_SITE_URL||'sc-domain:tradersyard.com',requestBody:{startDate:start,endDate:end,dimensions:['query'],rowLimit:3,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'+p.slug}]}]}});
  const rows=res.data.rows||[];
  const top=rows.sort((a,b)=>b.impressions-a.impressions)[0];
  console.log(p.words+'w · '+p.slug.slice(0,42));
  if(top)console.log('   → "'+top.keys[0]+'" ('+Math.round(top.impressions)+' impr, pos '+top.position.toFixed(1)+')');
  else console.log('   → (no GSC queries — not ranking for anything yet)');
}
