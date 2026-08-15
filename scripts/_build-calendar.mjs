import { readFileSync, writeFileSync } from 'fs';
const t=JSON.parse(readFileSync('data/content-tiers.json','utf8'));
const clusters=JSON.parse(readFileSync('data/keyword-clusters.json','utf8'));
// exclude pure competitor-brand keywords from OUR content plan (we don't write "FTMO review" pages strongly; but "X vs Y" is ok)
// Actually competitor reviews ARE valuable traffic. Flag them separately.
const isBrand=k=>/\b(ftmo|apex|topstep|fundednext|funding ?pips|the ?5ers|maven|alpha capital|e8|blue guardian|goat funded|hola prime|my funded futures|tradeify|tradify|earn2trade|bright ?funded|fundingpips|aqua funded|nordic|city traders|audacity|lark funding|finotive|darwinex|fxify|bulenox|lucid|dna funded|think capital|funding ticks|funding tick|alpha trader|alpha futures|alpha prop|atmos|orion|wsfunded|hantec)\b/i.test(k.kw);

const all=[...t.easyWins,...t.midWins];
const ours=all.filter(k=>!isBrand(k));        // pages we write about our topics
const competitor=all.filter(k=>isBrand(k));   // competitor-review/comparison pages (different content type)

// build a 30-day starter calendar from the best "ours" easy wins
const cal=ours.filter(k=>k.kd<=20).sort((a,b)=>b.vol-a.vol).slice(0,60);

writeFileSync('data/calendar-data.json',JSON.stringify({
  totalKeywords:clusters.total, totalVol:clusters.totalVol,
  easyCount:t.easyWins.length, midCount:t.midWins.length,
  oursCount:ours.length, competitorCount:competitor.length,
  clusters:clusters.clusters,
  starter30:cal.slice(0,30),
  competitorTop:competitor.sort((a,b)=>b.vol-a.vol).slice(0,15),
},null,2));
console.log('Content plan built:');
console.log('  Our-topic opportunities:',ours.length);
console.log('  Competitor-review opportunities:',competitor.length,'(separate content type)');
console.log('  30-day starter calendar: ready');
console.log('\nFirst 10 days of the calendar (highest-ROI our-topic easy wins):');
cal.slice(0,10).forEach((k,i)=>console.log('  Day '+String(i+1).padStart(2)+': "'+k.kw+'" ('+k.vol+'/mo, KD '+k.kd+')'));
