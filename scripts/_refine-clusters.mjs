import { readFileSync, writeFileSync } from 'fs';
const csv = readFileSync('.claude/NEW CSV DOWNLOADS SEO/21--JUNE_pages_2026-06-21.csv','utf8');
function parseRow(line){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(c===','&&!q){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;}
const lines=csv.split(/\r?\n/);const header=parseRow(lines[0]);const col=n=>header.indexOf(n);
const Ci={kw:col('Keyword'),vol:col('Volume'),kd:col('Keyword Difficulty'),intent:col('Intent')};
const byKw={};
for(let i=1;i<lines.length;i++){if(!lines[i])continue;const r=parseRow(lines[i]);const kw=(r[Ci.kw]||'').toLowerCase().trim();if(!kw)continue;const o={kw,vol:parseInt(r[Ci.vol]||'0',10)||0,kd:parseInt(r[Ci.kd]||'0',10)||0,intent:(r[Ci.intent]||'').trim()};if(!byKw[kw]||o.vol>byKw[kw].vol)byKw[kw]=o;}
const uniq=Object.values(byKw);

// THE GOAL: actionable content opportunities = decent volume + LOW difficulty (KGR-friendly, avalanche)
// Tier by difficulty for a daily-posting calendar
const easyWins=uniq.filter(k=>k.kd<=15&&k.vol>=30).sort((a,b)=>b.vol-a.vol);
const midWins=uniq.filter(k=>k.kd>15&&k.kd<=30&&k.vol>=50).sort((a,b)=>b.vol-a.vol);
const bigTargets=uniq.filter(k=>k.kd>30&&k.vol>=200).sort((a,b)=>b.vol-a.vol);

console.log('=== CONTENT OPPORTUNITY TIERS (for daily calendar) ===\n');
console.log('TIER 1 — EASY WINS (KD<=15, vol>=30) — post these first:',easyWins.length,'keywords');
easyWins.slice(0,20).forEach(k=>console.log('  '+String(k.vol).padStart(4)+'/mo  KD:'+String(k.kd).padStart(2)+'  '+k.kw));
console.log('\nTIER 2 — MID (KD 16-30, vol>=50):',midWins.length,'keywords');
midWins.slice(0,12).forEach(k=>console.log('  '+String(k.vol).padStart(4)+'/mo  KD:'+String(k.kd).padStart(2)+'  '+k.kw));
console.log('\nTIER 3 — BIG TARGETS (KD>30, vol>=200) — pillar-level:',bigTargets.length,'keywords');
bigTargets.slice(0,10).forEach(k=>console.log('  '+String(k.vol).padStart(4)+'/mo  KD:'+String(k.kd).padStart(2)+'  '+k.kw));

writeFileSync('data/content-tiers.json',JSON.stringify({easyWins,midWins,bigTargets},null,2));
console.log('\nDaily calendar capacity: '+easyWins.length+' easy + '+midWins.length+' mid = '+(easyWins.length+midWins.length)+' posts of runway at 1/day');
