import { writeFileSync, readFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';

let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const pages = all.map(it=>({slug:it.fieldData.slug, id:it.id, title:it.fieldData.name||'', bodyLen:(it.fieldData['post-body']||'').length}));

// lighter stoplist — keep topic words like "prop/firm/drawdown/payout"
const stop=new Set(['the','a','an','to','of','for','in','and','is','do','you','your','how','what','are','can','best','2026','2025','guide','complete','vs']);
const tok=s=>[...new Set(s.replace(/[^a-z0-9-]/g,'').split('-').filter(w=>w.length>2&&!stop.has(w)))];

// topical category anchors (act as mini-pillars for fallback)
const categories={
  drawdown:/drawdown|trailing|daily-loss|risk-management|max-loss/,
  payout:/payout|withdraw|profit-split|refund|fast-payout|paid/,
  rules:/rules|consistency|hedging|scalping|hft|news-trading|time-limit|allow|prohibited|ea-|expert-advisor|copy-trading/,
  challenge:/challenge|evaluation|pass|phase|funded-account|verification|target/,
  country:/nigeria|kenya|pakistan|usa|uk|india|germany|canada|australia|singapore|france|europe|netherlands|belgium|austria|philippines|south-africa|malaysia|italy|ireland/,
  whatis:/what-is|what-are|how-do|how-does|meaning|explained|how-prop/,
  platform:/ctrader|metatrader|mt4|mt5|platform|agenatrader|webtrader/,
  beginner:/beginner|start|how-to-become|prop-trader|jobs|salary|career/,
};
const catOf=slug=>Object.entries(categories).filter(([k,rx])=>rx.test(slug)).map(([k])=>k);

const targets=pages.filter(p=>p.bodyLen>2500);
const report=JSON.parse(readFileSync('data/orphan-report.json','utf8'));
const aPages=report.filter(r=>r.grade==='A'||r.grade==='TOOL').map(r=>r.slug);

function related(orphanSlug, n=4){
  const ot=new Set(tok(orphanSlug));
  const ocats=new Set(catOf(orphanSlug));
  const scored=targets.filter(t=>t.slug!==orphanSlug).map(t=>{
    const tt=tok(t.slug);
    const overlap=tt.filter(w=>ot.has(w)).length;
    const catMatch=catOf(t.slug).filter(c=>ocats.has(c)).length;
    return {slug:t.slug, title:t.title, score:overlap*2+catMatch};
  }).filter(x=>x.score>0);
  // dedupe by slug, sort, take top n
  const seen=new Set(); const uniq=[];
  scored.sort((a,b)=>b.score-a.score);
  for(const s of scored){ if(!seen.has(s.slug)){seen.add(s.slug);uniq.push(s);} if(uniq.length>=n)break; }
  return uniq;
}

const map={};
let under=0;
for(const slug of aPages){
  const r=related(slug,4);
  map[slug]=r;
  if(r.length<3) under++;
}
writeFileSync('data/orphan-linkmap.json',JSON.stringify(map,null,2));
console.log('Link map: '+Object.keys(map).length+' orphans');
console.log('With >=3 targets:',Object.values(map).filter(v=>v.length>=3).length);
console.log('With <3 targets:',under);
console.log('\nSample (improved):');
Object.entries(map).slice(0,6).forEach(([k,v])=>console.log('  '+k.slice(0,38)+'  → '+v.map(t=>t.slug.slice(0,26)).join(', ')));
