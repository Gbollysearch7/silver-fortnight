import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const kws=JSON.parse(readFileSync('data/keywords-clean.json','utf8'));
// only LIVE (not drafted dupes) — re-list reflects current state
const exclude=/calculator|converter|analyzer|journal|template|interview|chart-mastery|iphone|moss|ritik|-s\d/i;
const pilotDone=new Set(['can-you-swing-trade-on-prop-firms-40bab','how-many-prop-firms-are-there','how-many-people-get-payouts-from-prop-firms-a8fe0']);
// thin/mid = under 1500 words of TEXT
const cands=[];
for(const it of all){
  const slug=it.fieldData.slug;const b=it.fieldData['post-body']||'';
  if(exclude.test(slug)||pilotDone.has(slug))continue;
  const wc=b.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  if(wc>=1500)continue; // already strong
  if(b.includes('inarticle-html')&&wc>1200)continue;
  cands.push({slug,id:it.id,wc});
}
cands.sort((a,b)=>a.wc-b.wc);
// map each to best target keyword (token overlap)
const stop=new Set(['the','a','to','of','for','in','and','is','do','you','best','prop','firm','firms','trading','what','how','your','with','2026','guide','are','can']);
const tok=s=>s.replace(/[^a-z0-9-]/g,' ').split(/[-\s]/).filter(w=>w.length>2&&!stop.has(w));
for(const c of cands){
  const pt=new Set(tok(c.slug));let best=null,bs=0;
  for(const k of kws){const ov=tok(k.kw).filter(t=>pt.has(t)).length;if(ov>bs||(ov===bs&&best&&k.vol>best.vol)){bs=ov;best=k;}}
  c.target=bs>=2?best.kw:null;c.vol=best?best.vol:0;c.kd=best?best.kd:0;c.score=bs;
}
const withTarget=cands.filter(c=>c.target);
writeFileSync('data/batch-targets.json',JSON.stringify(withTarget,null,2));
console.log('Thin/mid posts needing work:',cands.length,'| with clear target:',withTarget.length,'\n');
console.log('=== BATCH 1 (next 10, thinnest, clear target) ===');
withTarget.slice(0,10).forEach(c=>console.log('  '+String(c.wc).padStart(4)+'w · "'+c.target+'" ('+c.vol+'/mo KD'+c.kd+') · '+c.slug.slice(0,44)));
