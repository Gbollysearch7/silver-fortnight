import { readFileSync, writeFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const csv=readFileSync('.claude/NEW CSV DOWNLOADS SEO/21--JUNE_pages_2026-06-21.csv','utf8');
function pr(line){const o=[];let c='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){c+='"';i++;}else q=!q;}else if(ch===','&&!q){o.push(c);c='';}else c+=ch;}o.push(c);return o;}
const lines=csv.split(/\r?\n/);const h=pr(lines[0]);const ci={kw:h.indexOf('Keyword'),vol:h.indexOf('Volume'),kd:h.indexOf('Keyword Difficulty')};
const byKw={};for(let i=1;i<lines.length;i++){if(!lines[i])continue;const r=pr(lines[i]);const kw=(r[ci.kw]||'').toLowerCase().trim();if(!kw)continue;const o={kw,vol:parseInt(r[ci.vol]||'0')||0,kd:parseInt(r[ci.kd]||'0')||0};if(!byKw[kw]||o.vol>byKw[kw].vol)byKw[kw]=o;}
const kws=Object.values(byKw);
let live=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;live.push(...items);}
const liveSlugs=live.map(it=>it.fieldData.slug);
const exists=kw=>{const toks=kw.split(' ').filter(w=>w.length>3&&!['prop','firm','firms','best','trading','what','that','with','your'].includes(w));if(!toks.length)return false;return liveSlugs.some(s=>{const st=s.replace(/-/g,' ');return toks.filter(t=>st.includes(t)).length>=Math.ceil(toks.length*0.6);});};

// brand list — these are firm-review/navigational
const BRAND=/\b(ftmo|apex|topstep|top ?step|fundednext|funded ?next|funding ?pips|funding ?ticks|funding ?tick|the ?5ers|the5ers|maven|alpha|e8|blue guardian|goat funded|hola prime|my funded futures|mff|tradeify|tradify|earn2trade|bright ?funded|aqua funded|bulenox|lucid|dna funded|think capital|atmos|orion|wsfunded|hantec|quant tekel|finotive|darwinex|fxify|nordic|city traders|audacity|lark|fundedelite|for traders|breakout|oanda|tpt|take profit|tradeday|funded trading plus|seacrest|pip ?farm)\b/i;

const arch={
  'Best Prop Firms':{exists:true,rx:/^(best |top )?prop ?firms?|prop firm list|all prop firm|top prop trading/, subs:{
    'By Country':/\b(usa|uk|india|nigeria|kenya|pakistan|canada|australia|germany|france|south africa|uae|dubai|philippines|indonesia|malaysia|singapore|europe|brazil|mexico|egypt|ghana|spain|italy|netherlands|poland|sweden|austria|belgium|switzerland|portugal|ireland|us traders|american)\b/,
    'By Instrument':/forex|futures|crypto|stock|option|indices|gold|nasdaq|metal/,
    'For Trader Type':/beginner|day trad|swing|scalp|small account|professional/,
  }},
  'Firm Reviews & Comparisons':{exists:false,rx:BRAND, subs:{
    'Individual Firm Reviews':BRAND,
    'Vs / Comparisons':/\bvs\b|versus|compare|comparison|or |better/,
  }},
  'Challenge & Evaluation':{exists:true,rx:/challenge|evaluation|one[- ]step|two[- ]step|1[- ]step|2[- ]step|instant fund|no eval|verification|phase|how to pass|how to start|express/, subs:{
    'Challenge Types':/one[- ]step|two[- ]step|1[- ]step|2[- ]step|instant fund|no eval|express|rapid/,
    'Passing It':/how to pass|tips|fail|mistake/,
  }},
  'Rules & Risk':{exists:true,rx:/drawdown|consistency|hedg|scalp|\bhft\b|martingale|news trad|time limit|trailing|lot size|leverage|max loss|daily loss|\brule|risk|breach|allowed|mql5|\bea\b|expert advisor|copy trad|algo|\bbot\b/, subs:{
    'Drawdown':/drawdown|trailing|daily loss|max loss/,
    'Trading Style Rules':/scalp|hedg|\bhft\b|martingale|news|\bea\b|expert advisor|copy trad|algo|\bbot\b|mql5|allowed/,
    'Consistency & Limits':/consistency|time limit|lot size|leverage/,
  }},
  'Payouts & Profit':{exists:true,rx:/payout|profit split|withdraw|refund|salary|earning|profit target|how much.*(make|earn|pay)|paid/, subs:{
    'Profit Split':/profit split|split/,'Payout Process':/payout|withdraw|refund|paid|how long/,'Earnings':/salary|earn|make|income|profitable/,
  }},
  'Platforms & Tools':{exists:false,rx:/\bmt4\b|\bmt5\b|metatrader|ctrader|tradingview|ninjatrader|tradovate|dxtrade|matchtrader|platform|calculator|\btool/, subs:{
    'Platforms':/mt4|mt5|metatrader|ctrader|tradingview|ninjatrader|tradovate|dxtrade|platform/,'Calculators':/calculator|tool|converter/,
  }},
  'Education / What Is':{exists:true,rx:/what is|what are|how do|how does|meaning|explained|how to become|\blearn|definition|business model|make money|guide/, subs:{
    'Definitions':/what is|what are|meaning|definition|explained/,'How They Work':/how do|how does|business model|make money/,'Career':/become|\bjob|career/,
  }},
  'Cost & Pricing':{exists:false,rx:/cheap|\bprice|\bcost|\bfee|discount|coupon|promo|\bfree|affordable|activation/, subs:{
    'Pricing & Fees':/price|cost|fee|activation/,'Discounts & Deals':/cheap|discount|coupon|promo|free|deal|affordable/,
  }},
};
const result={};
for(const [p,cfg] of Object.entries(arch)){result[p]={exists:cfg.exists,vol:0,count:0,subs:{}};Object.keys(cfg.subs).forEach(s=>result[p].subs[s]={vol:0,kws:[]});result[p].subs['General']={vol:0,kws:[]};}
const un=[];
for(const k of kws){
  let placed=false;
  // brand keywords ALWAYS go to Firm Reviews first
  const order=BRAND.test(k.kw)?['Firm Reviews & Comparisons',...Object.keys(arch).filter(p=>p!=='Firm Reviews & Comparisons')]:Object.keys(arch);
  for(const p of order){const cfg=arch[p];
    if(cfg.rx.test(k.kw)){let sub='General';for(const [sn,srx] of Object.entries(cfg.subs)){if(srx.test(k.kw)){sub=sn;break;}}result[p].subs[sub].kws.push({...k,exists:exists(k.kw)});result[p].subs[sub].vol+=k.vol;result[p].vol+=k.vol;result[p].count++;placed=true;break;}
  }
  if(!placed)un.push(k);
}
// sort sub kws by volume
for(const p of Object.values(result))for(const s of Object.values(p.subs))s.kws.sort((a,b)=>b.vol-a.vol);
writeFileSync('data/content-architecture.json',JSON.stringify(result,null,2));
const sorted=Object.entries(result).sort((a,b)=>b[1].vol-a[1].vol);
console.log('=== FINAL CONTENT ARCHITECTURE ===\n');
let totNew=0;
for(const [p,d] of sorted){
  const net=Object.values(d.subs).reduce((s,sd)=>s+sd.kws.filter(k=>!k.exists).length,0);totNew+=net;
  console.log(`■ ${p}  ${d.exists?'[EXISTS]':'[NEEDS PILLAR]'}  ${d.count} kws · ${d.vol.toLocaleString()}/mo · ${net} net-new`);
  for(const [s,sd] of Object.entries(d.subs)){if(sd.kws.length)console.log(`    └ ${s}: ${sd.kws.length} (${sd.kws.filter(k=>!k.exists).length} new) — ${sd.vol.toLocaleString()}/mo`);}
}
console.log('\nUnassigned:',un.length,'| Total net-new page opportunities:',totNew);
