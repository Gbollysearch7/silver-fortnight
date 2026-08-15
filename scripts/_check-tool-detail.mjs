import { listItems } from '../lib/webflow.mjs';
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// find the excel-template one by partial slug
const excel=all.find(x=>/challenge-calculator-excel/i.test(x.fieldData.slug));
console.log('Excel-template page:', excel?excel.fieldData.slug:'NOT FOUND');
// show the iframe src for a couple of tools to confirm they point somewhere real
const samples=['trading-profit-calculator','pip-value-converter','risk-reward-ratio-calculator'];
for(const slug of samples){
  const it=all.find(x=>x.fieldData.slug===slug);
  const body=it.fieldData['post-body']||'';
  const src=(body.match(/<iframe[^>]*src="([^"]+)"/i)||[])[1]||'(no src)';
  console.log('\n'+slug);
  console.log('  iframe src: '+src.slice(0,90));
}
