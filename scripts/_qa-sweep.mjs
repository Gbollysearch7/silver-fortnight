// Verify all this session's live changes are actually serving correctly
const checks=[
  // Phase 2 sections (sample)
  {url:'https://tradersyard.com/blog-posts/prop-firm-copy-trading',expect:'prohibited',label:'P2: copy-trading ban live'},
  {url:'https://tradersyard.com/blog-posts/what-are-prop-firms-and-how-do-they-work',expect:'prop firm',label:'P2: what-are-prop-firms'},
  // calculators (sample)
  {url:'https://tradersyard.com/blog-posts/risk-reward-ratio-calculator',expect:'function tyRR',label:'Calc: risk-reward JS live'},
  {url:'https://tradersyard.com/blog-posts/forex-lot-size-calculator',expect:'tyLot',label:'Calc: lot-size JS live'},
  {url:'https://tradersyard.com/blog-posts/pip-value-converter',expect:'tyPip',label:'Calc: pip-value JS live'},
  // payout stub rewrite
  {url:'https://tradersyard.com/blog-posts/prop-firm-payout-schedule-timeline-when-do-you-get-paid-82413',expect:'payout cycle',label:'Stub: real article live'},
  // interlinking (sample)
  {url:'https://tradersyard.com/blog-posts/best-prop-firms-in-usa',expect:'Related guides',label:'Links: Related block live'},
  // scaffold fixes
  {url:'https://tradersyard.com/blog-posts/are-prop-firms-real',expect:null,notExpect:'[firm name]',label:'Scaffold: placeholder gone'},
];
let pass=0,fail=0;
for(const c of checks){
  try{
    const html=await (await fetch(c.url)).text();
    let ok;
    if(c.expect) ok=new RegExp(c.expect.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(html);
    if(c.notExpect) ok=!html.includes(c.notExpect);
    if(ok){pass++;console.log('✅ '+c.label);}else{fail++;console.log('❌ '+c.label+'  ('+c.url.split('/').pop()+')');}
  }catch(e){fail++;console.log('❌ '+c.label+' — fetch error');}
}
console.log(`\nQA SWEEP: ${pass}/${pass+fail} live checks pass`);
