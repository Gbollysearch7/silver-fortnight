import { readFileSync, writeFileSync } from 'fs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
const plan=JSON.parse(readFileSync('data/dedup-plan.json','utf8'));
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const fmt=d=>d.toISOString().slice(0,10);
const start=fmt(new Date(Date.now()-92*864e5)),end=fmt(new Date(Date.now()-2*864e5));
const site=GSC_SITE_URL||'sc-domain:tradersyard.com';
async function impr(slug){
  try{
    const r=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:start,endDate:end,dimensions:['page'],rowLimit:5,dimensionFilterGroups:[{filters:[{dimension:'page',operator:'contains',expression:'/blog-posts/'+slug}]}]}});
    let imp=0,clk=0,pos=0,n=0;
    for(const row of (r.data.rows||[])){
      // exact path match (avoid substring overlap)
      if(row.keys[0].endsWith('/blog-posts/'+slug)){imp+=row.impressions;clk+=row.clicks;pos+=row.position;n++;}
    }
    return {imp:Math.round(imp),clk:Math.round(clk),pos:n?+(pos/n).toFixed(1):null};
  }catch(e){return {imp:0,clk:0,pos:null,err:e.message.slice(0,40)};}
}
console.log('=== DEDUP w/ GSC (keep the version Google actually ranks) ===\n');
const revised=[];
for(const p of plan){
  const all=[{...p.keep,role:'keep-by-len'},...p.kill.map(k=>({...k,role:'kill-by-len'}))];
  for(const v of all){v.gsc=await impr(v.slug);}
  // best ranker = most impressions (then clicks)
  all.sort((a,b)=>b.gsc.imp-a.gsc.imp || b.gsc.clk-a.gsc.clk);
  const winner=all[0];
  console.log(p.base);
  for(const v of all){
    const tag=v.slug===winner.slug?'👑 KEEP':'   kill';
    console.log('   '+tag+'  '+v.slug.slice(0,52).padEnd(52)+' impr:'+String(v.gsc.imp).padStart(5)+' clk:'+String(v.gsc.clk).padStart(3)+' pos:'+(v.gsc.pos??'-'));
  }
  // if winner has 0 impr (neither ranks), keep longer
  const keeper = winner.gsc.imp>0 ? winner : all.sort((a,b)=>b.len-a.len)[0];
  revised.push({base:p.base,keep:{slug:keeper.slug,id:keeper.id},kill:all.filter(v=>v.slug!==keeper.slug).map(v=>({slug:v.slug,id:v.id})),decidedBy:winner.gsc.imp>0?'gsc-impressions':'length-tiebreak'});
  console.log('');
}
writeFileSync('data/dedup-plan-final.json',JSON.stringify(revised,null,2));
console.log('Final plan saved. Decided by GSC:',revised.filter(r=>r.decidedBy==='gsc-impressions').length,'| by length (neither ranks):',revised.filter(r=>r.decidedBy==='length-tiebreak').length);
