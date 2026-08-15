import { readFileSync, writeFileSync } from 'fs';
const raw=readFileSync('/private/tmp/claude-501/-Users-gbolahan-Documents-Active-2026-2026-projects-TY-Blog-Automation/79412bed-156a-4691-b329-5b4b44ed27fd/tasks/wgo38hk27.output','utf8');
let data;try{data=JSON.parse(raw);}catch{const m=raw.match(/\{[\s\S]*"pages"[\s\S]*\}\s*$/);data=JSON.parse(m[0]);}
const pages=data.pages||data.result?.pages;
const dec=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
// clean slug map (workflow may have rewritten ids)
const slugMap={'proprietary-trading-firms-complete-guide':'proprietary-trading-firms','one-step-prop-firm-challenge':'one-step-prop-firm-challenge','instant-funding-prop-firms':'instant-funding-prop-firms','prop-trader-salary':'prop-trader-salary','prop-trading-companies':'prop-trading-companies'};
const volById={'proprietary-trading-firms':6000,'one-step-prop-firm-challenge':70,'instant-funding-prop-firms':20,'prop-trader-salary':170,'prop-trading-companies':100};
const out=pages.map(p=>{
  let slug=slugMap[p.id]||p.id;
  if(!volById[slug]){ // match by keyword
    if(/proprietary/.test(p.id))slug='proprietary-trading-firms';
    else if(/one-step/.test(p.id))slug='one-step-prop-firm-challenge';
    else if(/instant/.test(p.id))slug='instant-funding-prop-firms';
    else if(/salary/.test(p.id))slug='prop-trader-salary';
    else if(/companies/.test(p.id))slug='prop-trading-companies';
  }
  const html=dec(p.sectionHtml);
  const words=html.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  const h2s=(html.match(/<h2>(.*?)<\/h2>/g)||[]).map(h=>h.replace(/<[^>]+>/g,''));
  const links=(html.match(/href="https:\/\/tradersyard\.com\/blog-posts\//g)||[]).length;
  const cta=/tradersyard\.com\/#pricing/.test(html);
  return {id:slug,title:dec(p.title||''),meta:dec(p.metaDescription||''),html,words,h2s,links,cta,titleLen:dec(p.title||'').length,metaLen:dec(p.metaDescription||'').length,vol:volById[slug]||0,verifyWithHuman:p.verifyWithHuman||[]};
});
writeFileSync('data/netnew-final.json',JSON.stringify(out,null,2));
const brands=/maven|ftmo|apex|topstep|funderpro|the5ers|fundednext/i;
console.log('=== 5 NET-NEW PAGES ===\n');
out.forEach((p,i)=>{
  const badCopy=/tradersyard[^.]*allow[^.]*copy trad/i.test(p.html);
  const overclaim=/tradersyard (offers|provides|has) instant funding(?! is| launch)/i.test(p.html);
  console.log(`${i+1}. ${p.id.padEnd(34)} ${String(p.words).padStart(4)}w | T:${p.titleLen} M:${p.metaLen} | ${p.links} links${p.cta?'+CTA':''} ${p.h2s.some(h=>brands.test(h))?'⚠BRAND':''} ${badCopy?'⚠COPY':''} ${overclaim?'⚠INSTANT-OVERCLAIM':''}`);
});
console.log('\nTotals:',out.reduce((s,p)=>s+p.words,0),'words. Titles in range:',out.filter(p=>p.titleLen>=48&&p.titleLen<=62).length+'/5');
