import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
const fmt=d=>d.toISOString().slice(0,10);
async function totals(start,end){
  const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:start,endDate:end,dimensions:[]}});
  const row=(r.data.rows||[])[0]||{};
  return {clicks:Math.round(row.clicks||0),impr:Math.round(row.impressions||0),ctr:((row.ctr||0)*100).toFixed(2),pos:(row.position||0).toFixed(1)};
}
// last 28 days vs prior 28 days
const now=new Date();
const e1=fmt(new Date(now-3*864e5)), s1=fmt(new Date(now-31*864e5));
const e2=fmt(new Date(now-31*864e5)), s2=fmt(new Date(now-59*864e5));
const cur=await totals(s1,e1), prev=await totals(s2,e2);
console.log('=== GSC TOTALS (blog domain) ===');
console.log('Last 28d ('+s1+' to '+e1+'): clicks '+cur.clicks+', impr '+cur.impr+', CTR '+cur.ctr+'%, avg pos '+cur.pos);
console.log('Prior 28d ('+s2+' to '+e2+'): clicks '+prev.clicks+', impr '+prev.impr+', CTR '+prev.ctr+'%, avg pos '+prev.pos);
console.log('Δ clicks:',(cur.clicks-prev.clicks),'| Δ impr:',(cur.impr-prev.impr));
// top blog pages by impressions
const pages=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:s1,endDate:e1,dimensions:['page'],rowLimit:1000,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'}]}]}});
const blogRows=(pages.data.rows||[]);
let bClicks=0,bImpr=0;blogRows.forEach(r=>{bClicks+=r.clicks;bImpr+=r.impressions;});
console.log('\n=== BLOG-ONLY (last 28d) ===');
console.log('Blog pages ranking:',blogRows.length,'| blog clicks:',Math.round(bClicks),'| blog impr:',Math.round(bImpr));
console.log('\nTop 8 blog pages by impressions:');
blogRows.sort((a,b)=>b.impressions-a.impressions).slice(0,8).forEach(r=>console.log('  '+Math.round(r.impressions)+' impr, pos '+r.position.toFixed(1)+'  '+r.keys[0].replace('https://tradersyard.com/blog-posts/','')));
