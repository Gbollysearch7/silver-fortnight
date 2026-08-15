import { readFileSync, writeFileSync } from 'fs';
const v = JSON.parse(readFileSync('data/query-volumes.json','utf8'));
const all = v.all.filter(m => m.volume > 0);
// also use full GSC pages for supporting-page counts
const g = JSON.parse(readFileSync('data/gsc-analysis.json','utf8'));
const pages = g.pages.filter(p=>new URL(p.url).host==='tradersyard.com');

// Define the FULL pillar set (more than 3) by theme
const pillars = [
  { id:'best-firms', name:'Best Prop Firms', money:true,
    rx:/^(best |top )?prop ?firms?$|^prop trading firms?$|^proprietary trading firms?$|^best prop (trading )?firms?$|^top prop (trading )?firms?$|^best prop firm$/i,
    supportRx:/best-prop-firms|top-prop-firm/i },
  { id:'what-is', name:'What Is a Prop Firm / How They Work',
    rx:/what (is|are).*prop|how (do|does).*prop firm.*work|prop firm meaning|prop trading explained|prop firm.*explained|how prop firms work/i,
    supportRx:/what-are-prop-firms|how-do-prop-firms|how-prop-firms|what-is-prop|prop-firm-.*explained/i },
  { id:'futures', name:'Futures Prop Firms',
    rx:/futures prop|futures prop trading|futures.*prop firm/i,
    supportRx:/futures-prop|futures-trading|which-futures/i },
  { id:'options', name:'Options Prop Firms',
    rx:/option.*prop|options trading prop|prop.*options/i,
    supportRx:/options-trading-prop|option-prop|is-there-an-option/i },
  { id:'forex', name:'Forex Prop Firms',
    rx:/forex prop|prop.*forex|forex.*prop firm/i,
    supportRx:/forex-prop|prop-firm-account-in-forex/i },
  { id:'rules', name:'Prop Firm Rules & Risk (drawdown/consistency)',
    rx:/drawdown|consistency|risk|hedging|scalping|hft|time limit|trailing/i,
    supportRx:/drawdown|consistency|manage-risk|hedging|scalping|hft|time-limit|trailing|allow-/i },
  { id:'payouts', name:'Payouts, Profit Split & Withdrawals',
    rx:/payout|withdraw|profit split|refund|activation fee/i,
    supportRx:/payout|withdraw|profit-split|refund|activation-fee|fast-payout/i },
  { id:'demo', name:'Demo / Practice & Real Accounts',
    rx:/demo|practice|practise|real account|real capital/i,
    supportRx:/demo-account|real-account|gives-real|practice/i },
  { id:'jobs', name:'Prop Trading as a Career',
    rx:/prop trader salary|become a prop|prop firm.*job|prop trading.*career|prop trader/i,
    supportRx:/trading-jobs|prop-trader|become-a-prop|career/i },
  { id:'country', name:'Prop Firms by Country (geo hub)',
    rx:/nigeria|kenya|pakistan|france|belgium|austria|netherland|philippines|europe|usa|india|germany|canada|australia|singapore|malaysia|ireland|italy|south africa|\buk\b|united kingdom/i,
    supportRx:/best-prop-firms-in-|prop-trading-france|prop-firms-in-europe|prop-firms-united/i },
  { id:'legit', name:'Are Prop Firms Legit / Profitable / Halal (trust)',
    rx:/legit|scam|profitable|halal|haram|recommended/i,
    supportRx:/legit|profitable|halal|recommended-and-legal|are-prop/i },
];

const out = pillars.map(p=>{
  const q = all.filter(m=>p.rx.test(m.query));
  const vol = q.reduce((s,m)=>s+m.volume,0);
  const support = pages.filter(pg=>p.supportRx.test(pg.url));
  const supImpr = support.reduce((s,pg)=>s+pg.impressions,0);
  const bestQ = q.sort((a,b)=>b.volume-a.volume)[0];
  return {
    id:p.id, name:p.name, money:!!p.money,
    queryCount:q.length, volume:vol,
    topQuery: bestQ?{q:bestQ.query,v:bestQ.volume,pos:bestQ.position}:null,
    supportPages: support.length, supportImpr: supImpr,
    sampleSupport: support.sort((a,b)=>b.impressions-a.impressions).slice(0,6).map(s=>s.url.split('/').pop()),
  };
}).sort((a,b)=>b.volume-a.volume);

writeFileSync('data/pillar-architecture.json', JSON.stringify(out,null,2));
console.log('=== FULL PILLAR ARCHITECTURE (by cluster volume) ===\n');
out.forEach((p,i)=>{
  console.log(`${i+1}. ${p.name}${p.money?'  💰(money-adjacent)':''}`);
  console.log(`   ${p.volume.toLocaleString()}/mo · ${p.queryCount} ranking queries · ${p.supportPages} supporting pages (${p.supportImpr.toLocaleString()} impr)`);
  if(p.topQuery) console.log(`   anchor: "${p.topQuery.q}" (${p.topQuery.v}/mo, pos ${p.topQuery.pos})`);
  console.log('');
});
