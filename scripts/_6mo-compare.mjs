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
async function qcount(start,end){
  const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:start,endDate:end,dimensions:['query'],rowLimit:25000}});
  return (r.data.rows||[]).length;
}
async function pcount(start,end){
  const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:start,endDate:end,dimensions:['page'],rowLimit:25000,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'}]}]}});
  return (r.data.rows||[]).length;
}
const now=new Date();
// RECENT: last 28d (data lags ~3 days)
const e1=fmt(new Date(now-3*864e5)), s1=fmt(new Date(now-31*864e5));
// 6 MONTHS AGO: same 28d window, ~6 months prior
const e0=fmt(new Date(now-(3+182)*864e5)), s0=fmt(new Date(now-(31+182)*864e5));
console.log('=== 28-DAY WINDOWS ===');
console.log('NOW       :',s1,'to',e1);
console.log('6 MO AGO  :',s0,'to',e0,'\n');
const cur=await totals(s1,e1), old=await totals(s0,e0);
const curQ=await qcount(s1,e1), oldQ=await qcount(s0,e0);
const curP=await pcount(s1,e1), oldP=await pcount(s0,e0);
const pct=(a,b)=>b>0?(((a-b)/b)*100).toFixed(0):'n/a';
console.log('METRIC          6 MO AGO        NOW          CHANGE');
console.log('Impressions     '+String(old.impr).padEnd(15)+String(cur.impr).padEnd(13)+pct(cur.impr,old.impr)+'%');
console.log('Clicks          '+String(old.clicks).padEnd(15)+String(cur.clicks).padEnd(13)+pct(cur.clicks,old.clicks)+'%');
console.log('Avg CTR         '+String(old.ctr+'%').padEnd(15)+String(cur.ctr+'%').padEnd(13));
console.log('Avg position    '+String(old.pos).padEnd(15)+String(cur.pos).padEnd(13)+(old.pos-cur.pos>0?'improved':'')+' '+(old.pos-cur.pos).toFixed(1));
console.log('Queries ranking '+String(oldQ).padEnd(15)+String(curQ).padEnd(13)+pct(curQ,oldQ)+'%');
console.log('Blog pages rank '+String(oldP).padEnd(15)+String(curP).padEnd(13)+pct(curP,oldP)+'%');
