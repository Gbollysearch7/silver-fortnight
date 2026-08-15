import { readFileSync, writeFileSync } from 'fs';
// Use verified TY facts + gap research to design the programmatic page set
const gap=JSON.parse(readFileSync('data/gap-research.json','utf8'));
// Best single-firm programmatic angles (grounded in what TY actually offers, per docs)
const pageTypes=[
  {type:'Instrument', template:'Trading {instrument} with a Prop Firm: Rules & Payouts', entities:['Forex','Indices','Commodities','Stocks','Crypto','Gold','Futures'], basis:'TY supports these per configurator; leverage tiers known'},
  {type:'Platform', template:'{platform} Prop Firm Trading: Setup & Rules', entities:['AgenaTrader','WebTrader','NinjaTrader'], basis:'TY platforms per docs; "MT5 coming soon" page captures that query'},
  {type:'Challenge size', template:'The ${size} Prop Firm Challenge: Rules, Targets & Payout', entities:['5K','25K','50K','100K','300K'], basis:'TY account sizes; payout caps + scaling known per docs'},
  {type:'Feature', template:'Prop Firms with {feature}: What to Know', entities:['No Time Limit','Instant Funding','No Minimum Trading Days','Scaling Plan'], basis:'TY: no time limits ✓, scaling ✓ — verified facts'},
];
let total=0;
console.log('=== PROGRAMMATIC PAGE DESIGN (single-firm, verified-fact based) ===\n');
pageTypes.forEach(p=>{
  console.log(`${p.type} pages (×${p.entities.length}): "${p.template}"`);
  console.log(`   entities: ${p.entities.join(', ')}`);
  console.log(`   basis: ${p.basis}\n`);
  total+=p.entities.length;
});
console.log(`Total new programmatic pages possible: ${total}`);
console.log('Each: low KD (4-15 per gap research), template-driven, compounds via Avalanche.');
writeFileSync('data/programmatic-design.json',JSON.stringify(pageTypes,null,2));
