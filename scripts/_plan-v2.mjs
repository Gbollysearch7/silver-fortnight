import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const kws=JSON.parse(readFileSync('data/keywords-clean.json','utf8'));
// existing pages (to mark exists vs net-new)
let live=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;live.push(...items);}
const liveSlugs=live.map(it=>it.fieldData.slug);
const exists=kw=>{const toks=kw.split(' ').filter(w=>w.length>3&&!['prop','firm','firms','best','trading','what','that','with','your'].includes(w));if(!toks.length)return false;return liveSlugs.some(s=>{const st=s.replace(/-/g,' ');return toks.filter(t=>st.includes(t)).length>=Math.ceil(toks.length*0.6);});};

// pillar mapping (same architecture)
const BRAND=/\b(ftmo|apex|topstep|top ?step|fundednext|funded ?next|funding ?pips|funding ?ticks?|the ?5ers|the5ers|maven|alpha|e8|blue guardian|goat funded|hola prime|my funded futures|mff|tradeify|tradify|earn2trade|bright ?funded|aqua funded|bulenox|lucid|dna funded|think capital|atmos|orion|wsfunded|hantec|quant tekel|finotive|darwinex|fxify|nordic|city traders|audacity|lark|fundedelite|for traders|breakout|oanda|tpt|take profit|tradeday|seacrest|pip ?farm)\b/i;
const pillarOf=kw=>{
  if(BRAND.test(kw))return 'Firm Reviews & Comparisons';
  if(/^(best |top )?prop ?firms?|prop firm list|top prop trading|\b(usa|uk|india|nigeria|kenya|pakistan|canada|australia|germany|france|south africa|uae|philippines|indonesia|malaysia|singapore|europe)\b/.test(kw))return 'Best Prop Firms';
  if(/challenge|evaluation|one[- ]step|two[- ]step|1[- ]step|2[- ]step|instant fund|no eval|verification|phase|how to pass|how to start/.test(kw))return 'Challenge & Evaluation';
  if(/drawdown|consistency|hedg|scalp|\bhft\b|martingale|news trad|time limit|trailing|lot size|leverage|max loss|daily loss|\brule|risk|breach|allowed|\bea\b|expert advisor|copy trad|algo|\bbot\b/.test(kw))return 'Rules & Risk';
  if(/payout|profit split|withdraw|refund|salary|earning|profit target|paid|how much.*(make|earn)/.test(kw))return 'Payouts & Profit';
  if(/\bmt4\b|\bmt5\b|metatrader|ctrader|tradingview|ninjatrader|tradovate|dxtrade|platform|calculator|\btool/.test(kw))return 'Platforms & Tools';
  if(/what is|what are|how do|how does|meaning|explained|become|\blearn|definition|business model|make money/.test(kw))return 'Education / What Is';
  if(/cheap|\bprice|\bcost|\bfee|discount|coupon|promo|\bfree|affordable|activation/.test(kw))return 'Cost & Pricing';
  if(/forex|futures|crypto|stock|option|indices|gold|nasdaq/.test(kw))return 'Best Prop Firms';
  return 'Best Prop Firms';
};

const enriched=kws.map(k=>({...k,pillar:pillarOf(k.kw),exists:exists(k.kw)}));
const netNew=enriched.filter(k=>!k.exists);

// PLAN VIEW 2: EASY-FIRST WAVES (difficulty ascending, volume as tiebreaker)
const wave=k=>k.kd<=10?'Wave 1 — Quick Wins (KD 0-10)':k.kd<=20?'Wave 2 — Easy (KD 11-20)':k.kd<=30?'Wave 3 — Medium (KD 21-30)':'Wave 4 — Competitive (KD 31+)';
const waves={'Wave 1 — Quick Wins (KD 0-10)':[],'Wave 2 — Easy (KD 11-20)':[],'Wave 3 — Medium (KD 21-30)':[],'Wave 4 — Competitive (KD 31+)':[]};
for(const k of netNew)waves[wave(k)].push(k);
for(const w of Object.values(waves))w.sort((a,b)=>a.kd-b.kd||b.vol-a.vol);

writeFileSync('data/plan-v2.json',JSON.stringify({totalClean:kws.length,netNew:netNew.length,waves,enriched},null,2));
console.log('=== PLAN VIEW 2 — EASY-FIRST ===\n');
console.log('Clean keywords:',kws.length,'| Net-new (no page yet):',netNew.length,'\n');
for(const [w,arr] of Object.entries(waves)){
  console.log(`${w}: ${arr.length} pages · ${arr.reduce((s,k)=>s+k.vol,0).toLocaleString()}/mo`);
}
console.log('\n--- WAVE 1 first 15 (write these first) ---');
waves['Wave 1 — Quick Wins (KD 0-10)'].slice(0,15).forEach(k=>console.log('  KD '+String(k.kd).padStart(2)+' · '+String(k.vol).padStart(4)+'/mo · ['+k.pillar.slice(0,18)+'] '+k.kw));
