import { writeFileSync, readFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const pages=all.map(it=>({slug:it.fieldData.slug,title:it.fieldData.name||'',bodyLen:(it.fieldData['post-body']||'').length}));
const stop=new Set(['the','a','an','to','of','for','in','and','is','do','you','your','how','what','are','can','best','2026','2025','guide','complete','vs']);
const tok=s=>[...new Set(s.replace(/[^a-z0-9-]/g,'').split('-').filter(w=>w.length>2&&!stop.has(w)))];
const categories={drawdown:/drawdown|trailing|daily-loss|risk-management|max-loss/,payout:/payout|withdraw|profit-split|refund|paid/,rules:/rules|consistency|hedging|scalping|hft|news|time-limit|allow|prohibited|ea-|expert-advisor|copy-trading|weekend/,challenge:/challenge|evaluation|pass|phase|funded-account|verification|target|prepare/,country:/nigeria|kenya|pakistan|usa|uk|india|germany|canada|australia|singapore|france|europe|netherlands|belgium|austria|philippines|south-africa|malaysia|italy|ireland/,whatis:/what-is|what-are|how-do|how-does|meaning|explained|regulated|legit|profitable/,platform:/ctrader|metatrader|mt4|mt5|platform/,beginner:/beginner|start|become|trader|jobs|salary|career|funding|stress/};
const catOf=slug=>Object.entries(categories).filter(([k,rx])=>rx.test(slug)).map(([k])=>k);
const targets=pages.filter(p=>p.bodyLen>2500);
const report=JSON.parse(readFileSync('data/orphan-report.json','utf8'));
// remaining orphans = grade B and C (the 18 + 7)
const remaining=report.filter(r=>r.grade==='B'||r.grade==='C').map(r=>r.slug);
function related(orphanSlug,n=4){const ot=new Set(tok(orphanSlug)),ocats=new Set(catOf(orphanSlug));const scored=targets.filter(t=>t.slug!==orphanSlug).map(t=>({slug:t.slug,title:t.title,score:tok(t.slug).filter(w=>ot.has(w)).length*2+catOf(t.slug).filter(c=>ocats.has(c)).length})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);const seen=new Set(),uniq=[];for(const s of scored){if(!seen.has(s.slug)){seen.add(s.slug);uniq.push(s);}if(uniq.length>=n)break;}return uniq;}
const map={};for(const slug of remaining){const r=related(slug);if(r.length>=2)map[slug]=r;}
// merge into main linkmap file so the insert script picks them up
const existing=JSON.parse(readFileSync('data/orphan-linkmap.json','utf8'));
Object.assign(existing,map);
writeFileSync('data/orphan-linkmap.json',JSON.stringify(existing,null,2));
console.log('Added '+Object.keys(map).length+' grade B/C orphans to link map (of '+remaining.length+')');
console.log('No relevant targets (need manual/pillar):',remaining.length-Object.keys(map).length);
