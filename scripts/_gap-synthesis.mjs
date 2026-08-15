import { readFileSync, writeFileSync } from 'fs';
// What we rank for (from query-volumes)
const ours=JSON.parse(readFileSync('data/query-volumes.json','utf8')).all.filter(m=>m.volume>0).map(m=>m.query.toLowerCase());
const ourSet=new Set(ours);
// Competitor content themes observed (PropFirmMatch programmatic + nav)
const competitorThemes=[
  {theme:'instant funding prop firms',type:'challenge-type page'},
  {theme:'no evaluation prop firms',type:'challenge-type page'},
  {theme:'one step prop firms',type:'challenge-type page'},
  {theme:'one step challenge',type:'challenge-type page'},
  {theme:'trailing drawdown prop firms',type:'challenge-type page'},
  {theme:'prop firm demo accounts',type:'feature page'},
  {theme:'prop firm spreads',type:'comparison page'},
  {theme:'prop firm payouts',type:'data page'},
  {theme:'prop firms that allow ea trading',type:'feature page'},
  {theme:'scaling challenge',type:'challenge-type page'},
  {theme:'cheapest prop firms',type:'comparison page'},
  {theme:'prop firm rules',type:'pillar'},
  {theme:'high impact news prop firm',type:'news page'},
  {theme:'prop firm reviews',type:'review hub'},
];
console.log('=== KEYWORD GAP: competitor themes vs what TradersYard ranks for ===\n');
const gaps=[],covered=[];
competitorThemes.forEach(c=>{
  const has=[...ourSet].some(q=>q.includes(c.theme.split(' ').slice(0,2).join(' ')));
  if(has)covered.push(c);else gaps.push(c);
});
console.log('GAPS (competitor targets, we DON\'T rank) — '+gaps.length+':');
gaps.forEach(g=>console.log('  ✗ '+g.theme+'  ['+g.type+']'));
console.log('\nCOVERED (we already rank for the theme) — '+covered.length+':');
covered.forEach(c=>console.log('  ✓ '+c.theme));
writeFileSync('data/keyword-gap.json',JSON.stringify({gaps,covered},null,2));

console.log('\n=== WINNING PAGE ANATOMY (from competitor teardown) ===');
console.log('  1. Comparison table (entities × features)');
console.log('  2. "What is X?" definitional section');
console.log('  3. "Why X matters" + 3 benefit bullets');
console.log('  4. FAQ (3-4 Q&A)');
console.log('  5. Related-pages internal links (cluster)');
console.log('  → For TradersYard (single firm): swap multi-firm table for "TradersYard vs the criteria" + honest "who should pick this" framing.');
