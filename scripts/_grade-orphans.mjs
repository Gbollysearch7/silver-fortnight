import { readFileSync, writeFileSync } from 'fs';
const o = JSON.parse(readFileSync('data/orphan-audit.json','utf8'));
const improved = new Set([
  ...JSON.parse(readFileSync('data/phase2-sections-v2.json','utf8')).map(s=>s.slug),
  ...JSON.parse(readFileSync('data/ctr-rewrites-final.json','utf8')).map(s=>s.slug),
]);
const isCalc = s => /calculator|converter|analyzer|template|journal/i.test(s);
function grade(x){
  if(isCalc(x.slug)) return {g:'TOOL', act:'Link + short intro (tool page, keep short)'};
  if(x.words>=1000 && x.h2>=2 && x.ranks) return {g:'A', act:'Link now — good content already ranking'};
  if(x.words>=1500 && !x.ranks) return {g:'C', act:'Link to wake up — strong content, invisible'};
  if(x.words<700 || x.h2===0) return {g:'B', act:'Fix structure/depth, then link'};
  if(!x.ranks) return {g:'C', act:'Link to wake up'};
  return {g:'A', act:'Link now'};
}
const rows = o.map(x=>{
  const gr=grade(x);
  return {slug:x.slug, words:x.words, h2:x.h2, ext:x.ext, impr:x.totalImpr||0, clk:x.totalClk||0, pos:x.bestPos, ranks:x.ranks, q:x.topQueries||[], grade:gr.g, action:gr.act, already:improved.has(x.slug)};
});
rows.sort((a,b)=> b.impr-a.impr || b.words-a.words);
writeFileSync('data/orphan-report.json', JSON.stringify(rows));
const by = g => rows.filter(r=>r.grade===g);
console.log('A (link now):', by('A').length);
console.log('TOOL (link + intro):', by('TOOL').length);
console.log('C (wake up via links):', by('C').length);
console.log('B (fix first):', by('B').length);
console.log('Already on improve list:', rows.filter(r=>r.already).length);
console.log('Total impr/mo across orphans:', rows.reduce((s,r)=>s+r.impr,0));
console.log('\nGroup B (the only real content work) — full list:');
by('B').forEach(r=>console.log('  '+r.words+'w h2:'+r.h2+'  '+r.slug));
