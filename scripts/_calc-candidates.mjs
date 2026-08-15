import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// topics that genuinely warrant an interactive calculator
const calcTopics={
  'Profit Split': /profit-split|profit split|how much.*earn|earnings|payout-calc/i,
  'Drawdown': /drawdown.*calcul|calculate.*drawdown|max-drawdown|trailing-drawdown/i,
  'Lot / Position Size': /lot-size|position-siz|lot size|position size/i,
  'Risk / Risk-Reward': /risk-reward|risk reward|risk-management|risk per trade/i,
  'Pip Value': /pip-value|pip value/i,
  'Profit Target': /profit-target|profit target/i,
  'Challenge Cost/Fee': /challenge-cost|cost-calcul|fee-calcul|activation-fee/i,
  'Consistency Rule': /consistency-rule|consistency rule/i,
  'Payout/Withdrawal timing': /payout-schedule|withdrawal-process|how-long.*payout/i,
};
const hasCalc=b=>/id="tyCalc"|wrapifai|<input[^>]*type="number"|tyLot\(|tyRR\(|calculator-/i.test(b);
console.log('=== POSTS THAT SHOULD HAVE A CALCULATOR ===\n');
const candidates=[];
for(const it of all){
  const slug=it.fieldData.slug;const body=it.fieldData['post-body']||'';
  for(const [topic,rx] of Object.entries(calcTopics)){
    if(rx.test(slug)){
      const has=hasCalc(body);
      candidates.push({slug,topic,hasCalc:has});
      break;
    }
  }
}
const need=candidates.filter(c=>!c.hasCalc);
console.log('Topical posts needing a calculator (no calc yet):',need.length);
need.forEach(c=>console.log('  ['+c.topic+']  '+c.slug));
console.log('\nAlready have a calculator:',candidates.filter(c=>c.hasCalc).length);
candidates.filter(c=>c.hasCalc).forEach(c=>console.log('  ✓ '+c.slug));
