import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
import { GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL } from '../lib/config.mjs';
import { google } from 'googleapis';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const killed=new Set();
for(const f of ['data/dedup-plan-final.json','data/dedup-round2-plan.json']){try{JSON.parse(readFileSync(f,'utf8')).forEach(p=>p.kill.forEach(k=>killed.add(k.slug)));}catch{}}
const pilotDone=new Set(['can-you-swing-trade-on-prop-firms-40bab','how-many-prop-firms-are-there','how-many-people-get-payouts-from-prop-firms-a8fe0']);
const kws=JSON.parse(readFileSync('data/keywords-clean.json','utf8'));
const exclude=/calculator|converter|analyzer|journal|template|interview|chart-mastery|iphone|moss|ritik|-s\d|best-prop-firms-in/i;
const stop=new Set(['the','a','to','of','for','in','and','is','do','you','best','prop','firm','firms','trading','what','how','your','with','2026','guide','are','can']);
const tok=s=>s.replace(/[^a-z0-9-]/g,' ').split(/[-\s]/).filter(w=>w.length>2&&!stop.has(w));
// all LIVE-eligible posts under 1500 words, not killed, not pilot, not excluded
const cands=[];
for(const it of all){
  const slug=it.fieldData.slug;const b=it.fieldData['post-body']||'';
  if(killed.has(slug)||pilotDone.has(slug)||exclude.test(slug))continue;
  const wc=b.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  if(wc>=1500)continue;
  const pt=new Set(tok(slug));let best=null,bs=0;
  for(const k of kws){const ov=tok(k.kw).filter(t=>pt.has(t)).length;if(ov>bs||(ov===bs&&best&&k.vol>best.vol)){bs=ov;best=k;}}
  if(bs<2)continue;
  cands.push({slug,id:it.id,wc,target:best.kw,vol:best.vol,kd:best.kd});
}
cands.sort((a,b)=>a.wc-b.wc);
writeFileSync('data/overnight-queue.json',JSON.stringify(cands,null,2));
console.log('Final overnight queue:',cands.length,'posts (all live, deduped, on-topic, <1500w)');
console.log('  thin <900w:',cands.filter(c=>c.wc<900).length,'| mid 900-1500:',cands.filter(c=>c.wc>=900).length);
