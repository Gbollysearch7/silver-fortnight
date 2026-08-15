import { readFileSync, writeFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const groups=JSON.parse(readFileSync('data/dedup-round2.json','utf8'));
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const fmt=d=>d.toISOString().slice(0,10);
const start=fmt(new Date(Date.now()-92*864e5)),end=fmt(new Date(Date.now()-2*864e5));
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
async function impr(slug){try{const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:start,endDate:end,dimensions:['page'],rowLimit:10,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'+slug}]}]}});let imp=0,clk=0;for(const row of(r.data.rows||[]))if(row.keys[0].endsWith('/blog-posts/'+slug)){imp+=row.impressions;clk+=row.clicks;}return{imp:Math.round(imp),clk:Math.round(clk)};}catch(e){return{imp:0,clk:0};}}
const plan=[];
for(const g of groups){
  for(const it of g.items)it.gsc=await impr(it.slug);
  const ranked=[...g.items].sort((a,b)=>b.gsc.imp-a.gsc.imp||b.gsc.clk-a.gsc.clk);
  const winner=ranked[0];
  const keeper=winner.gsc.imp>0?winner:[...g.items].sort((a,b)=>b.len-a.len)[0];
  plan.push({base:g.base,keep:{slug:keeper.slug,id:keeper.id,imp:keeper.gsc.imp,len:keeper.len},kill:g.items.filter(i=>i.slug!==keeper.slug).map(i=>({slug:i.slug,id:i.id,imp:i.gsc.imp,len:i.len})),by:winner.gsc.imp>0?'gsc':'len'});
}
writeFileSync('data/dedup-round2-plan.json',JSON.stringify(plan,null,2));
console.log('=== ROUND 2 DEDUP PLAN (keep ranker) ===\n');
for(const p of plan){
  console.log('KEEP '+p.keep.slug.slice(0,52).padEnd(52)+' impr:'+p.keep.imp+' ['+p.by+']');
  for(const k of p.kill)console.log('  KILL '+k.slug.slice(0,52).padEnd(52)+' impr:'+k.imp);
}
console.log('\nGroups:',plan.length,'| to unpublish:',plan.reduce((s,p)=>s+p.kill.length,0),'| by GSC:',plan.filter(p=>p.by==='gsc').length);
