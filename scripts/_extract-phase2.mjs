import { readFileSync, writeFileSync } from 'fs';
const raw = readFileSync('/private/tmp/claude-501/-Users-gbolahan-Documents-Active-2026-2026-projects-TY-Blog-Automation/79412bed-156a-4691-b329-5b4b44ed27fd/tasks/w20g3pwru.output','utf8');
let data; try { data = JSON.parse(raw); } catch { const m=raw.match(/\{[\s\S]*"sections"[\s\S]*\}\s*$/); data=JSON.parse(m[0]); }
const sections = data.sections || data.result?.sections;
const dec = s => s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");

const input = JSON.parse(readFileSync('data/phase2-input.json','utf8'));
// match returned section -> original page by slug-prefix OR by H2 keyword overlap
function matchPage(s){
  // try exact
  let f = input.find(p=>p.slug===s.slug); if(f) return f;
  // try: original slug is a prefix of the (rewritten) returned slug
  f = input.find(p=>s.slug.startsWith(p.slug)); if(f) return f;
  // try: returned slug starts with first 18 chars of original
  f = input.find(p=>s.slug.startsWith(p.slug.slice(0,18))); if(f) return f;
  // map known rewrites by keyword
  const map={ 'france':'prop-trading-france','ctrader':'which-prop-firms-use-ctrader','become-a-prop-trader':'prop-firm-trading-jobs',
    'real-account-or-demo':'which-prop-firm-gives-real-account','fast-payout':'fast-payout-prop-firms-guide',
    'profit-split':'prop-firm-profit-split-comparison','copy-trading':'prop-firm-copy-trading',
    'europe':'prop-firms-in-europe','futures-prop-firms-legit':'are-futures-prop-firms-recommended-and-legal',
    'netherlands':'best-prop-firms-in-netherlands' };
  for(const [k,slug] of Object.entries(map)) if(s.slug.includes(k)) return input.find(p=>p.slug===slug);
  return null;
}
const merged=[];
for(const s of sections){
  const f=matchPage(s); if(!f){console.log('!! still unmatched:',s.slug);continue;}
  const html=dec(s.sectionHtml);
  const words=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  const h2s=(html.match(/<h2>(.*?)<\/h2>/g)||[]).map(h=>h.replace(/<[^>]+>/g,''));
  merged.push({slug:f.slug,itemId:f.itemId,title:f.title,totalImpr:f.totalImpr,bestPos:f.bestPos,
    sectionHtml:html,wordCount:words,h2s,linkSuggestions:s.linkSuggestions||[],fabricationRisk:s.fabricationRisk||'none'});
}
merged.sort((a,b)=>b.totalImpr-a.totalImpr);
writeFileSync('data/phase2-sections-final.json',JSON.stringify(merged,null,2));
console.log(`\nMatched ${merged.length}/${sections.length}, all with itemId: ${merged.every(m=>m.itemId)}`);
console.log('Flagged for verification:', merged.filter(m=>m.fabricationRisk!=='none').map(m=>m.slug).join(', '));
