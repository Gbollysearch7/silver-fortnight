import { readFileSync, writeFileSync } from 'fs';
const raw = readFileSync('/private/tmp/claude-501/-Users-gbolahan-Documents-Active-2026-2026-projects-TY-Blog-Automation/79412bed-156a-4691-b329-5b4b44ed27fd/tasks/w73vn3hoa.output','utf8');
let data;
try { data = JSON.parse(raw); }
catch { const m = raw.match(/\{[\s\S]*"sections"[\s\S]*\}\s*$/); data = JSON.parse(m[0]); }
const sections = data.sections || data.result?.sections;
console.log('parsed sections:', sections?.length);
const dec = s => s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const eu = sections.find(s=>/europe/i.test(s.slug));
if(!eu){ console.log('no europe section found in rebuild output; slugs:', sections.map(s=>s.slug)); process.exit(1); }
const merged = JSON.parse(readFileSync('data/phase2-sections-v2.json','utf8'));
const t = merged.find(m=>m.slug==='prop-firms-in-europe');
const html = dec(eu.sectionHtml);
t.sectionHtml=html; t.wordCount=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
t.h2s=(html.match(/<h2>(.*?)<\/h2>/g)||[]).map(h=>h.replace(/<[^>]+>/g,'')); t.rebuilt=true; t.gatePassed=eu.pass; t.verifyWithHuman=eu.verifyWithHuman||[];
writeFileSync('data/phase2-sections-v2.json',JSON.stringify(merged,null,2));
console.log('Europe fixed:', t.wordCount+'w, gate pass:', eu.pass);
console.log('\nFINAL 15:');
merged.forEach(m=>console.log('  '+(m.rebuilt?'↻':' ')+' '+m.slug.slice(0,44).padEnd(44)+String(m.wordCount).padStart(4)+'w'));
console.log('\nTotal:', merged.reduce((s,m)=>s+m.wordCount,0),'words. Rebuilt avg:', Math.round(merged.filter(m=>m.rebuilt).reduce((s,m)=>s+m.wordCount,0)/merged.filter(m=>m.rebuilt).length)+'w');
