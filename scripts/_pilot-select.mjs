import { listItems } from '../lib/webflow.mjs';
import { writeFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const posts=all.map(it=>{
  const b=it.fieldData['post-body']||'';
  return {slug:it.fieldData.slug,id:it.id,title:(it.fieldData.name||'').replace(/\s*\|\s*TradersYard.*/,''),
    words:b.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length,
    hasAiImg:[...b.matchAll(/<img/g)].length};
}).filter(p=>p.words<800).sort((a,b)=>a.words-b.words);
// exclude tool/calculator pages (meant to be short) from the "thin" expansion list
const exclude=/calculator|converter|analyzer|journal|template/i;
const real=posts.filter(p=>!exclude.test(p.slug));
writeFileSync('data/thin-posts.json',JSON.stringify(real,null,2));
console.log('Genuinely thin posts (excluding tools):',real.length,'\n');
console.log('Pilot 5 (thinnest):');
real.slice(0,5).forEach(p=>console.log('  '+String(p.words).padStart(4)+'w · imgs:'+p.hasAiImg+' · '+p.slug));
