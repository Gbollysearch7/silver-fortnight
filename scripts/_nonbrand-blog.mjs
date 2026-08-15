import { readFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
const fmt=d=>d.toISOString().slice(0,10);
const BRAND=/tradersyard|traders yard|trader yard|tradeyard|tradersyad/i;
async function blogNonBrand(start,end){
  // pull all blog-post queries (page+query), filter out brand terms
  const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:start,endDate:end,dimensions:['query','page'],rowLimit:25000,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'}]}]}});
  const rows=r.data.rows||[];
  let clicks=0,impr=0,brandClicks=0,brandImpr=0;const q=new Set();
  for(const x of rows){
    const query=x.keys[0];
    if(BRAND.test(query)){brandClicks+=x.clicks;brandImpr+=x.impressions;continue;}
    clicks+=x.clicks;impr+=x.impressions;q.add(query);
  }
  return {clicks:Math.round(clicks),impr:Math.round(impr),queries:q.size,brandClicks:Math.round(brandClicks),brandImpr:Math.round(brandImpr)};
}
const now=new Date();
const e1=fmt(new Date(now-3*864e5)),s1=fmt(new Date(now-31*864e5));
const e0=fmt(new Date(now-(3+182)*864e5)),s0=fmt(new Date(now-(31+182)*864e5));
const cur=await blogNonBrand(s1,e1), old=await blogNonBrand(s0,e0);
console.log('=== BLOG-ONLY, NON-BRANDED (28-day windows) ===');
console.log('NOW       ('+s1+' to '+e1+')');
console.log('  non-brand blog: clicks '+cur.clicks+', impr '+cur.impr+', queries '+cur.queries);
console.log('  (brand removed: '+cur.brandClicks+' clicks, '+cur.brandImpr+' impr)');
console.log('6 MO AGO  ('+s0+' to '+e0+')');
console.log('  non-brand blog: clicks '+old.clicks+', impr '+old.impr+', queries '+old.queries);
console.log('  (brand removed: '+old.brandClicks+' clicks, '+old.brandImpr+' impr)');
const pct=(a,b)=>b>0?(((a-b)/b)*100).toFixed(0):'n/a';
console.log('\nCHANGE: impr '+pct(cur.impr,old.impr)+'% | clicks '+pct(cur.clicks,old.clicks)+'% | queries '+pct(cur.queries,old.queries)+'%');
