import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
// 1. all live page slugs (what we already target)
let live=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;live.push(...items);}
const slugs=live.map(it=>it.fieldData.slug);
const slugText=slugs.join(' ').replace(/-/g,' ');
// 2. all queries we rank for with volume
const vols=JSON.parse(readFileSync('data/query-volumes.json','utf8')).all.filter(m=>m.volume>0);
// 3. a query is "covered" if a page slug already contains its key tokens
const stop=new Set(['the','a','to','of','for','in','and','is','do','you','best','prop','firm','firms','trading','2026','2025']);
function covered(q){
  const toks=q.toLowerCase().split(' ').filter(w=>w.length>2&&!stop.has(w));
  if(!toks.length) return true;
  // covered if MOST key tokens appear in some single slug
  return slugs.some(s=>{const st=s.replace(/-/g,' ');return toks.filter(t=>st.includes(t)).length>=Math.ceil(toks.length*0.7);});
}
const netNew=vols.filter(m=>!covered(m.query)).sort((a,b)=>b.volume-a.volume);
writeFileSync('data/net-new-queries.json',JSON.stringify(netNew,null,2));
console.log('=== NET-NEW PAGE OPPORTUNITIES (ranking queries with NO dedicated page) ===\n');
console.log(netNew.length+' queries lack a targeted page. Top by volume:\n');
netNew.slice(0,25).forEach(m=>console.log('  '+String(m.volume).padStart(4)+'/mo  KD:'+String(m.difficulty??'-').padStart(2)+'  "'+m.query+'"'));
