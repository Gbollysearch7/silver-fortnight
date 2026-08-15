import { readFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const plan=JSON.parse(readFileSync('data/dedup-plan-final.json','utf8'));
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const find=s=>all.find(x=>x.fieldData.slug===s);
const hasCalc=b=>/id="tyCalc"|<input[^>]*type="number"/i.test(b);
console.log('=== for pairs where KILL had a calculator, does KEEPER have one? ===\n');
for(const p of plan){
  const keeper=find(p.keep.slug);
  for(const k of p.kill){
    const kill=find(k.slug);
    if(kill&&hasCalc(kill.fieldData['post-body']||'')){
      const keeperHas=keeper&&hasCalc(keeper.fieldData['post-body']||'');
      console.log((keeperHas?'OK   ':'PORT ')+p.base);
      console.log('       kill HAS calc; keeper '+(keeperHas?'also has it':'MISSING — must port before unpublish'));
    }
  }
}
