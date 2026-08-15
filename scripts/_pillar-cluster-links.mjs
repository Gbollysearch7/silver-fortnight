import { listItems } from '../lib/webflow.mjs';
import { writeFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const bySlug={};all.forEach(it=>bySlug[it.fieldData.slug]={id:it.id,title:(it.fieldData.name||'').replace(/\s*\|\s*TradersYard.*$/i,'').trim(),body:it.fieldData['post-body']||''});

// each pillar -> regex matching its cluster's supporting pages
const clusters={
  'best-prop-firms':/^best-prop-firms-(in|for)-|^best-prop-firms-united|^prop-firms-in-(europe|uk)|^prop-trading-(france|germany)/i,
  'futures-prop-firms':/futures-prop|which-futures|forex-vs-futures|consistency-at-futures/i,
  'prop-firm-payouts-profit-split-withdrawals':/payout|withdraw|profit-split|refund|fast-payout|activation-fee/i,
  'prop-firm-rules-and-risk-management':/drawdown|consistency|hedging|scalping|\bhft\b|time-limit|allow-|trailing|news-trading|risk/i,
  'are-prop-firms-legit-profitable-halal':/legit|profitable|halal|scam|recommended-and-legal|regulated|tax-deductible/i,
  'prop-firm-demo-practice-real-accounts':/demo-account|real-account|gives-real|practice|paper-trading/i,
  'prop-trading-as-a-career':/trading-jobs|prop-trader|become-a-prop|salary|skills|consistency|position-sizing|career|stress/i,
  'options-prop-firms':/option/i,
  'forex-prop-firms':/forex-prop|prop-firm-account-in-forex|pass-forex/i,
  'what-is-a-prop-firm-and-how-do-they-work':/what-is-prop|what-are-prop|how-do-prop|how-does-prop|prop-firm-meaning|hedging|account-size|how-prop-firms/i,
  'prop-firms-by-country-global-guide':/^best-prop-firms-(in|for)-|^best-prop-firms-united|^prop-firms-in-(europe|uk)|^prop-trading-(france|germany)/i,
};
const map={};
for(const [pillar,rx] of Object.entries(clusters)){
  if(!bySlug[pillar])continue;
  const already=new Set([...(bySlug[pillar].body.matchAll(/blog-posts\/([a-z0-9-]+)/g))].map(m=>m[1]));
  // candidate supporting pages not the pillar itself, not already linked, with decent body
  const cands=all.filter(it=>{
    const s=it.fieldData.slug;
    return s!==pillar && rx.test(s) && !already.has(s) && (it.fieldData['post-body']||'').length>2000 && !Object.keys(clusters).includes(s);
  }).map(it=>({slug:it.fieldData.slug,title:bySlug[it.fieldData.slug].title}));
  // up to 8 more per pillar
  map[pillar]=cands.slice(0,8);
}
writeFileSync('data/pillar-cluster-links.json',JSON.stringify(map,null,2));
console.log('Additional cluster links available per pillar:');
for(const [k,v] of Object.entries(map))console.log('  +'+String(v.length).padStart(2)+'  '+k);
console.log('\nTotal new links to add:',Object.values(map).reduce((s,v)=>s+v.length,0));
