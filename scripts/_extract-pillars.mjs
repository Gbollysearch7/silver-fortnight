import { readFileSync, writeFileSync } from 'fs';
const raw=readFileSync('/private/tmp/claude-501/-Users-gbolahan-Documents-Active-2026-2026-projects-TY-Blog-Automation/79412bed-156a-4691-b329-5b4b44ed27fd/tasks/wnek2o3lo.output','utf8');
let data;try{data=JSON.parse(raw);}catch{const m=raw.match(/\{[\s\S]*"pillars"[\s\S]*\}\s*$/);data=JSON.parse(m[0]);}
const pillars=data.pillars||data.result?.pillars;
const dec=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
const input=JSON.parse(readFileSync('data/pillar-input.json','utf8'));
const nameById={};input.forEach(p=>nameById[p.id]=p.name);

const out=pillars.map(p=>{
  const html=dec(p.sectionHtml);
  const words=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  const h2s=(html.match(/<h2>(.*?)<\/h2>/g)||[]).map(h=>h.replace(/<[^>]+>/g,''));
  const intLinks=(html.match(/href="https:\/\/tradersyard\.com\/blog-posts\//g)||[]).length;
  const cta=/tradersyard\.com\/#pricing/.test(html);
  return {id:p.id,name:nameById[p.id]||p.id,title:dec(p.title||''),meta:dec(p.metaDescription||''),html,words,h2s,intLinks,cta,
    titleLen:dec(p.title||'').length,metaLen:dec(p.metaDescription||'').length,
    verifyWithHuman:p.verifyWithHuman||[]};
});
writeFileSync('data/pillars-final.json',JSON.stringify(out,null,2));

// validation
const brands=/maven|ftmo|apex|topstep|funderpro|the5ers|fundednext|tradeday|fundedhive/i;
console.log('=== 11 PILLARS EXTRACTED + VALIDATED ===\n');
out.forEach((p,i)=>{
  const brandInH2=p.h2s.some(h=>brands.test(h));
  const badCopy=/tradersyard[^.]*allow[^.]*copy trad/i.test(p.html);
  console.log(`${String(i+1).padStart(2)}. ${p.name.slice(0,40).padEnd(40)} ${String(p.words).padStart(4)}w | T:${p.titleLen} M:${p.metaLen} | ${p.intLinks} links${p.cta?'+CTA':''} ${brandInH2?'⚠BRAND-H2':''} ${badCopy?'⚠COPY-CLAIM':''}`);
});
console.log('\nTotals: '+out.reduce((s,p)=>s+p.words,0)+' words, '+out.reduce((s,p)=>s+p.intLinks,0)+' internal links');
console.log('Titles in range (50-60):',out.filter(p=>p.titleLen>=48&&p.titleLen<=62).length+'/11');
console.log('Brand in any H2:',out.filter(p=>p.h2s.some(h=>brands.test(h))).length);
console.log('Wrong copy-trading claim:',out.filter(p=>/tradersyard[^.]*allow[^.]*copy/i.test(p.html)).length);
