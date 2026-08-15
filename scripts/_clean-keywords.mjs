import { readFileSync, writeFileSync } from 'fs';
const csv=readFileSync('.claude/NEW CSV DOWNLOADS SEO/21--JUNE_pages_2026-06-21.csv','utf8');
function pr(line){const o=[];let c='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){o.push(c);c='';}else c+=ch;}o.push(c);return o;}
const lines=csv.split(/\r?\n/);const h=pr(lines[0]);
const ci={kw:h.indexOf('Keyword'),vol:h.indexOf('Volume'),kd:h.indexOf('Keyword Difficulty'),intent:h.indexOf('Intent'),cpc:h.indexOf('CPC (USD)')};
const byKw={};
for(let i=1;i<lines.length;i++){if(!lines[i])continue;const r=pr(lines[i]);const kw=(r[ci.kw]||'').toLowerCase().trim();if(!kw)continue;const o={kw,vol:parseInt(r[ci.vol]||'0')||0,kd:parseInt(r[ci.kd]||'0')||0,intent:(r[ci.intent]||'').trim(),cpc:parseFloat(r[ci.cpc]||'0')||0};if(!byKw[kw]||o.vol>byKw[kw].vol)byKw[kw]=o;}
let kws=Object.values(byKw);
const before=kws.length;
const removed={garbage:[],zeroVol:[],navNoise:[],dupes:[]};

// RULE 1: parsing garbage (URLs, html fragments, pure numbers/punctuation, <=2 char fragments)
kws=kws.filter(k=>{
  const bad=/\.html|\.htm|^-|indeed\.com|^[\d"']+$|^[a-z]{1,2}$|jobs\.html|^\W/.test(k.kw) || k.kw.length<3;
  if(bad)removed.garbage.push(k.kw);return !bad;
});
// RULE 2: zero volume (no search demand = not a content target)
kws=kws.filter(k=>{if(k.vol===0){removed.zeroVol.push(k.kw);return false;}return true;});
// RULE 3: navigational/operational noise (not content opportunities)
const navRx=/\b(login|log in|sign in|sign up|register|dashboard|app download|download app|affiliate program|affiliate link|discord (server|link)|telegram (group|link|channel)|customer service number|phone number|contact number)\b/;
kws=kws.filter(k=>{if(navRx.test(k.kw)){removed.navNoise.push(k.kw);return false;}return true;});
// RULE 4: dedupe trivial singular/plural + spacing variants (keep highest vol)
const norm=s=>s.replace(/\bfirms\b/g,'firm').replace(/\baccounts\b/g,'account').replace(/\btraders\b/g,'trader').replace(/\bchallenges\b/g,'challenge').replace(/\bpayouts\b/g,'payout').replace(/[\s-]+/g,' ').trim();
const seen={};
const deduped=[];
for(const k of kws.sort((a,b)=>b.vol-a.vol)){
  const n=norm(k.kw);
  if(seen[n]){removed.dupes.push(k.kw+' → kept "'+seen[n]+'"');continue;}
  seen[n]=k.kw;deduped.push(k);
}
kws=deduped;

writeFileSync('data/keywords-clean.json',JSON.stringify(kws,null,2));
writeFileSync('data/keywords-removed.json',JSON.stringify(removed,null,2));
console.log('=== KEYWORD CLEANING ===\n');
console.log('Before:',before,'unique keywords');
console.log('Removed — parsing garbage:',removed.garbage.length);
console.log('Removed — zero volume:',removed.zeroVol.length);
console.log('Removed — nav/operational noise:',removed.navNoise.length);
console.log('Removed — singular/plural dupes:',removed.dupes.length);
console.log('\nCLEAN SET:',kws.length,'keywords ·',kws.reduce((s,k)=>s+k.vol,0).toLocaleString(),'/mo combined volume');
console.log('\nNav noise removed (sample):');removed.navNoise.slice(0,6).forEach(k=>console.log('  - '+k));
console.log('\nDupes merged (sample):');removed.dupes.slice(0,6).forEach(k=>console.log('  - '+k));
