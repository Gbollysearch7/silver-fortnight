import { readFileSync, writeFileSync } from 'fs';
const csv = readFileSync('.claude/NEW CSV DOWNLOADS SEO/21--JUNE_pages_2026-06-21.csv','utf8');
// robust-ish CSV parse for the columns we need (handles quoted fields)
function parseRow(line){
  const out=[];let cur='',q=false;
  for(let i=0;i<line.length;i++){const c=line[i];
    if(c==='"'){ if(q&&line[i+1]==='"'){cur+='"';i++;} else q=!q; }
    else if(c===','&&!q){out.push(cur);cur='';}
    else cur+=c;
  }
  out.push(cur);return out;
}
const lines=csv.split(/\r?\n/);
const header=parseRow(lines[0]);
const col=name=>header.indexOf(name);
const Ci={kw:col('Keyword'),vol:col('Volume'),kd:col('Keyword Difficulty'),cpc:col('CPC (USD)'),intent:col('Intent')};
const rows=[];
for(let i=1;i<lines.length;i++){
  if(!lines[i])continue;
  const r=parseRow(lines[i]);
  const kw=(r[Ci.kw]||'').toLowerCase().trim();
  if(!kw)continue;
  rows.push({kw,vol:parseInt(r[Ci.vol]||'0',10)||0,kd:parseInt(r[Ci.kd]||'0',10)||0,intent:(r[Ci.intent]||'').trim()});
}
// dedupe by keyword (keep highest vol)
const byKw={};for(const r of rows){if(!byKw[r.kw]||r.vol>byKw[r.kw].vol)byKw[r.kw]=r;}
const uniq=Object.values(byKw);
console.log('Parsed:',rows.length,'rows →',uniq.length,'unique keywords');
console.log('Total volume:',uniq.reduce((s,r)=>s+r.vol,0).toLocaleString());

// CLUSTER by theme (regex buckets ordered by specificity)
const themes=[
  ['Firm Reviews (brand)', /\b(ftmo|apex|topstep|fundednext|funding ?pips|the ?5ers|maven|alpha capital|e8|blue guardian|goat funded|hola prime|my funded futures|tradeify|earn2trade|funded next|bright ?funded|fundingpips|instant funding|aqua funded|nordic|city traders|audacity|lark funding|finotive|darwinex|fxify)\b/],
  ['Challenge Types', /one[- ]step|two[- ]step|1[- ]step|2[- ]step|instant funding|no evaluation|evaluation|challenge phase|verification/],
  ['Payouts & Profit Split', /payout|profit split|withdraw|refund|profit target|how much.*(make|earn|pay)|salary|earnings/],
  ['Rules & Risk', /drawdown|consistency|hedg|scalp|\bhft\b|martingale|news trading|time limit|trailing|lot size|leverage|max loss|daily loss|risk/],
  ['Demo & Practice', /demo|practice|paper trad|simulat/],
  ['Platforms', /\bmt4\b|\bmt5\b|metatrader|ctrader|tradingview|ninjatrader|tradovate|dxtrade|matchtrader|platform/],
  ['By Country/Region', /\b(usa|uk|india|nigeria|kenya|pakistan|canada|australia|germany|france|south africa|uae|dubai|philippines|indonesia|malaysia|singapore|europe|brazil|mexico|egypt|ghana|spain|italy|netherlands|poland|sweden|austria|belgium|switzerland|portugal|ireland|america|us traders|usa traders)\b/],
  ['Instruments', /forex|futures|crypto|stock|option|indices|commodities|gold|nasdaq|\bndq\b|\bnq\b|metals/],
  ['How-To / Education', /how to|how do|what is|what are|guide|explained|meaning|tutorial|tips|strategy|learn|beginner|pass/],
  ['Legitimacy & Trust', /legit|scam|real|trust|safe|regulated|halal|haram|reliable|reviews/],
  ['Career & Jobs', /job|career|become|salary|hire|recruit|prop trader/],
  ['Cost & Pricing', /cheap|price|cost|fee|discount|coupon|promo|free|affordable/],
  ['Comparisons', /\bvs\b|versus|compare|comparison|better|best/],
];
const clusters={};themes.forEach(([n])=>clusters[n]={kws:[],vol:0});
clusters['Other']={kws:[],vol:0};
for(const r of uniq){
  let placed=false;
  for(const [name,rx] of themes){ if(rx.test(r.kw)){clusters[name].kws.push(r);clusters[name].vol+=r.vol;placed=true;break;} }
  if(!placed){clusters['Other'].kws.push(r);clusters['Other'].vol+=r.vol;}
}
// summary
const summary=Object.entries(clusters).map(([name,c])=>({name,count:c.kws.length,vol:c.vol,
  lowKD:c.kws.filter(k=>k.kd<=20&&k.vol>=20).sort((a,b)=>b.vol-a.vol).slice(0,8).map(k=>({kw:k.kw,vol:k.vol,kd:k.kd}))
})).sort((a,b)=>b.vol-a.vol);
writeFileSync('data/keyword-clusters.json',JSON.stringify({total:uniq.length,totalVol:uniq.reduce((s,r)=>s+r.vol,0),clusters:summary},null,2));
console.log('\n=== CLUSTERS (by volume) ===\n');
summary.forEach(c=>console.log(`${c.name.padEnd(26)} ${String(c.count).padStart(5)} kws  ${String(c.vol).padStart(8).toLocaleString?c.vol.toLocaleString().padStart(9):c.vol} vol`));
