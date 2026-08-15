import { readFileSync, writeFileSync } from 'fs';
const thin=JSON.parse(readFileSync('data/thin-posts.json','utf8'));
const kws=JSON.parse(readFileSync('data/keywords-clean.json','utf8'));
// match each thin post to the highest-volume clean keyword whose tokens best overlap its slug
const stop=new Set(['the','a','to','of','for','in','and','is','do','you','best','prop','firm','firms','trading','what','how','your','with','2026','guide']);
const tok=s=>s.replace(/[^a-z0-9-]/g,' ').split(/[-\s]/).filter(w=>w.length>2&&!stop.has(w));
const mapped=thin.map(p=>{
  const pt=new Set(tok(p.slug));
  let best=null,bestScore=0;
  for(const k of kws){
    const overlap=tok(k.kw).filter(t=>pt.has(t)).length;
    if(overlap>bestScore || (overlap===bestScore && best && k.vol>best.vol)){bestScore=overlap;best=k;}
  }
  return {slug:p.slug,id:p.id,words:p.words,target:best&&bestScore>0?best.kw:null,targetVol:best?best.vol:0,targetKd:best?best.kd:0,score:bestScore};
});
writeFileSync('data/thin-targets.json',JSON.stringify(mapped,null,2));
console.log('=== THIN POSTS → BEST TARGET KEYWORD ===\n');
mapped.forEach(m=>{console.log(String(m.words).padStart(4)+'w · '+(m.target?'"'+m.target+'" ('+m.targetVol+'/mo KD'+m.targetKd+')':'NO MATCH — off-topic')+'\n      '+m.slug.slice(0,50));});
const noMatch=mapped.filter(m=>!m.target);
console.log('\nWith a target:',mapped.filter(m=>m.target).length,'| No match (consider deprecating):',noMatch.length);
