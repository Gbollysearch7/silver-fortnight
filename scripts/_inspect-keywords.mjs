import { readFileSync } from 'fs';
const csv=readFileSync('.claude/NEW CSV DOWNLOADS SEO/21--JUNE_pages_2026-06-21.csv','utf8');
function pr(line){const o=[];let c='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){o.push(c);c='';}else c+=ch;}o.push(c);return o;}
const lines=csv.split(/\r?\n/);const h=pr(lines[0]);
const ci={kw:h.indexOf('Keyword'),vol:h.indexOf('Volume'),kd:h.indexOf('Keyword Difficulty'),intent:h.indexOf('Intent')};
const byKw={};
for(let i=1;i<lines.length;i++){if(!lines[i])continue;const r=pr(lines[i]);const kw=(r[ci.kw]||'').toLowerCase().trim();if(!kw)continue;const o={kw,vol:parseInt(r[ci.vol]||'0')||0,kd:parseInt(r[ci.kd]||'0')||0,intent:(r[ci.intent]||'').trim()};if(!byKw[kw]||o.vol>byKw[kw].vol)byKw[kw]=o;}
const kws=Object.values(byKw);
console.log('Total unique keywords:',kws.length,'\n');

// junk detectors
const zeroVol=kws.filter(k=>k.vol===0);
const nonEnglish=kws.filter(k=>/[^\x00-\x7F]/.test(k.kw));
const reddit=kws.filter(k=>/reddit|quora|youtube|forum/.test(k.kw));
const login=kws.filter(k=>/login|sign in|sign up|register|app|download|dashboard|affiliate|discord|telegram/.test(k.kw));
const notPropFirm=kws.filter(k=>!/prop|firm|fund|trad|challeng|payout|drawdown|evaluation|ftmo|apex|topstep/.test(k.kw));
const veryLongTail=kws.filter(k=>k.kw.split(' ').length>=8);
const questions=kws.filter(k=>/^(reddit|is |does )/.test(k.kw));
const single=kws.filter(k=>k.kw.split(' ').length===1);

console.log('POTENTIAL JUNK BUCKETS:');
console.log('  Zero volume:',zeroVol.length);
console.log('  Non-English chars:',nonEnglish.length);
console.log('  Reddit/Quora/YouTube/forum:',reddit.length);
console.log('  Login/app/download/affiliate/discord:',login.length);
console.log('  No prop-firm relevance at all:',notPropFirm.length);
console.log('  Very long-tail (8+ words):',veryLongTail.length);
console.log('  Single word:',single.length);
console.log('');
console.log('--- sample: non-English ---'); nonEnglish.slice(0,8).forEach(k=>console.log('  '+k.kw));
console.log('--- sample: no relevance ---'); notPropFirm.slice(0,12).forEach(k=>console.log('  '+String(k.vol).padStart(4)+'  '+k.kw));
console.log('--- sample: login/app ---'); login.slice(0,8).forEach(k=>console.log('  '+k.kw));
