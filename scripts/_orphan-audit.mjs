import { writeFileSync, readFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';

// 1. find the 90 orphans (zero internal links)
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const orphans=[];
for(const it of all){
  const body=it.fieldData['post-body']||'';
  const links=[...body.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
  const internal=links.filter(h=>/tradersyard\.com\/blog-posts\/|^\/blog-posts\//.test(h));
  if(internal.length===0){
    // quality + formatting signals
    const text=body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    const words=text.split(' ').filter(Boolean).length;
    const h2=(body.match(/<h2/g)||[]).length;
    const h3=(body.match(/<h3/g)||[]).length;
    const lists=(body.match(/<ul|<ol/g)||[]).length;
    const tables=(body.match(/<table/g)||[]).length;
    const paras=(body.match(/<p[ >]/g)||[]).length;
    const ext=links.filter(h=>/^https?:\/\//.test(h)&&!/tradersyard\.com/.test(h)).length;
    // scaffold/placeholder detection
    const placeholder=/lorem ipsum|placeholder|\[insert|\bTODO\b|xxxx|to be written|coming soon/i.test(text);
    orphans.push({slug:it.fieldData.slug,id:it.id,words,h2,h3,lists,tables,paras,ext,placeholder});
  }
}
console.log('Orphans found:',orphans.length);

// 2. GSC queries per orphan
const creds=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const auth=new google.auth.GoogleAuth({credentials:creds,scopes:['https://www.googleapis.com/auth/webmasters.readonly']});
const sc=google.searchconsole({version:'v1',auth});
const fmt=d=>d.toISOString().slice(0,10);
const start=fmt(new Date(Date.now()-92*864e5)),end=fmt(new Date(Date.now()-2*864e5));
// one bulk query: page+query for all blog pages, then map
const res=await sc.searchanalytics.query({siteUrl:GSC_SITE_URL||'sc-domain:tradersyard.com',requestBody:{startDate:start,endDate:end,dimensions:['page','query'],rowLimit:25000}});
const byPage={};
for(const r of (res.data.rows||[])){
  const slug=r.keys[0].split('/blog-posts/')[1]?.split(/[?#]/)[0]; if(!slug)continue;
  (byPage[slug]||=[]).push({q:r.keys[1],pos:+r.position.toFixed(1),impr:Math.round(r.impressions),clk:Math.round(r.clicks)});
}
orphans.forEach(o=>{
  const qs=(byPage[o.slug]||[]).sort((a,b)=>b.impr-a.impr);
  o.totalImpr=qs.reduce((s,q)=>s+q.impr,0);
  o.totalClk=qs.reduce((s,q)=>s+q.clk,0);
  o.bestPos=qs.length?Math.min(...qs.map(q=>q.pos)):null;
  o.topQueries=qs.slice(0,5).map(q=>q.q);
  o.ranks=qs.length>0;
});
writeFileSync('data/orphan-audit.json',JSON.stringify(orphans,null,2));

// summary
const thin=orphans.filter(o=>o.words<700);
const noStructure=orphans.filter(o=>o.h2===0);
const ranking=orphans.filter(o=>o.ranks);
const notRanking=orphans.filter(o=>!o.ranks);
const scaffold=orphans.filter(o=>o.placeholder);
console.log('\n=== ORPHAN QUALITY SNAPSHOT ===');
console.log('Thin (<700 words):',thin.length);
console.log('No H2 structure:',noStructure.length);
console.log('Possible scaffold/placeholder:',scaffold.length);
console.log('Ranking for something:',ranking.length,'| Not ranking at all:',notRanking.length);
console.log('Total orphan impressions/mo at stake:',orphans.reduce((s,o)=>s+(o.totalImpr||0),0));
console.log('\nWord-count distribution:');
console.log('  <500w:',orphans.filter(o=>o.words<500).length);
console.log('  500-1000w:',orphans.filter(o=>o.words>=500&&o.words<1000).length);
console.log('  1000-1500w:',orphans.filter(o=>o.words>=1000&&o.words<1500).length);
console.log('  1500w+:',orphans.filter(o=>o.words>=1500).length);
