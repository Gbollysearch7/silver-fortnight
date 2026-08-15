import { readFileSync } from 'fs';
const csv=readFileSync('.claude/NEW CSV DOWNLOADS SEO/21--JUNE_pages_2026-06-21.csv','utf8');
function pr(line){const o=[];let c='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){o.push(c);c='';}else c+=ch;}o.push(c);return o;}
const lines=csv.split(/\r?\n/);const h=pr(lines[0]);const ci={kw:h.indexOf('Keyword'),vol:h.indexOf('Volume')};
const byKw={};for(let i=1;i<lines.length;i++){if(!lines[i])continue;const r=pr(lines[i]);const kw=(r[ci.kw]||'').toLowerCase().trim();if(!kw)continue;const v=parseInt(r[ci.vol]||'0')||0;if(!byKw[kw]||v>byKw[kw])byKw[kw]=v;}
const kws=Object.entries(byKw).map(([kw,vol])=>({kw,vol}));
console.log('=== ALL single-word keywords ===');
kws.filter(k=>k.kw.split(' ').length===1).forEach(k=>console.log('  '+String(k.vol).padStart(5)+'  "'+k.kw+'"'));
console.log('\n=== ALL "no prop-firm relevance" keywords ===');
kws.filter(k=>!/prop|firm|fund|trad|challeng|payout|drawdown|evaluation|ftmo|apex|topstep|tradeify|lucid|maven|alpha|e8|bulenox/.test(k.kw)).forEach(k=>console.log('  '+String(k.vol).padStart(5)+'  "'+k.kw+'"'));
console.log('\n=== zero-volume keywords ===');
kws.filter(k=>k.vol===0).forEach(k=>console.log('  "'+k.kw+'"'));
