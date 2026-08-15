import { readFileSync, writeFileSync } from 'fs';
const raw = readFileSync('/private/tmp/claude-501/-Users-gbolahan-Documents-Active-2026-2026-projects-TY-Blog-Automation/79412bed-156a-4691-b329-5b4b44ed27fd/tasks/w73vn3hoa.output','utf8');
let data; try{data=JSON.parse(raw);}catch{const m=raw.match(/\{[\s\S]*"sections"[\s\S]*\}\s*$/);data=JSON.parse(m[0]);}
const rebuilt = data.sections || data.result?.sections;
const dec = s => s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");

const orig = JSON.parse(readFileSync('data/phase2-sections-final.json','utf8'));
const omap={}; orig.forEach(s=>omap[s.slug]=s);
// map rebuilt slugs back to canonical (drafts rewrote some)
const slugMap={ 'prop-firm-demo-account-practice':'prop-firm-demo-account-practice-best-platforms',
  'which-futures-prop-trading-firm-offers-the-fastest-payout':'which-futures-prop-trading-firm-offers-the-fastest-payout' };
function canon(s){ if(omap[s])return s; if(slugMap[s])return slugMap[s];
  return orig.find(o=>o.slug.startsWith(s)||s.startsWith(o.slug.slice(0,20)))?.slug || s; }

const rebuiltSlugs=new Set();
const merged = orig.map(o=>({...o})); // start from originals
for(const r of rebuilt){
  const slug=canon(r.slug);
  const target=merged.find(m=>m.slug===slug);
  if(!target){console.log('!! no match for rebuilt',r.slug);continue;}
  const html=dec(r.sectionHtml);
  target.sectionHtml=html;
  target.wordCount=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  target.h2s=(html.match(/<h2>(.*?)<\/h2>/g)||[]).map(h=>h.replace(/<[^>]+>/g,''));
  target.verifyWithHuman=r.verifyWithHuman||[];
  target.rebuilt=true;
  target.gatePassed=r.pass;
  rebuiltSlugs.add(slug);
}
writeFileSync('data/phase2-sections-v2.json',JSON.stringify(merged,null,2));
console.log('Merged set: '+merged.length+' sections ('+rebuiltSlugs.size+' rebuilt, '+(merged.length-rebuiltSlugs.size)+' kept clean)\n');
merged.forEach(m=>{
  const tag=m.rebuilt?(m.gatePassed?'↻✓':'↻✗'):'  ✓';
  console.log(`${tag} ${m.slug.slice(0,46).padEnd(46)} ${String(m.wordCount).padStart(4)}w  ${m.h2s.length}H2`);
});
// brand-in-heading check across ALL
const brands=/maven|ftmo|apex|topstep|funderpro|the5ers|fundednext|tradeday|fundedhive/i;
const headingHits=merged.filter(m=>m.h2s.some(h=>brands.test(h)));
console.log('\nCompetitor brand in any H2:', headingHits.length?headingHits.map(m=>m.slug).join(', '):'NONE ✓');
console.log('Total words across 15:', merged.reduce((s,m)=>s+m.wordCount,0));
