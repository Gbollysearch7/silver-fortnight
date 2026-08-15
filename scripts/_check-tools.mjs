import { listItems } from '../lib/webflow.mjs';
const toolSlugs = ['trading-performance-analyzer','trading-profit-calculator','trading-journal-template','trading-position-size-calculator','risk-reward-ratio-calculator','risk-management-calculator','pip-value-converter','forex-lot-size-calculator','prop-firm-challenge-calculator-excel-template-free'];
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
console.log('Tool-page audit — does each have an actual interactive tool?\n');
for(const slug of toolSlugs){
  const it=all.find(x=>x.fieldData.slug===slug);
  if(!it){console.log('  ? '+slug+' — NOT FOUND'); continue;}
  const body=it.fieldData['post-body']||'';
  const hasInput=/<input|<select|<textarea/i.test(body);
  const hasScript=/<script/i.test(body);
  const hasIframe=/<iframe/i.test(body);
  const hasForm=/<form/i.test(body);
  const hasTable=/<table/i.test(body);
  const hasDownload=/download|\.xlsx|\.xls|\.csv|google sheets|docs\.google/i.test(body);
  const words=body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  const interactive=hasInput||hasScript||hasIframe||hasForm;
  console.log('  '+(interactive?'TOOL ✓':'TEXT-ONLY ✗')+'  '+slug.slice(0,44).padEnd(44)+' '+words+'w'
    +'  ['+(hasInput?'input ':'')+(hasScript?'js ':'')+(hasIframe?'iframe ':'')+(hasForm?'form ':'')+(hasTable?'table ':'')+(hasDownload?'download':'')+']');
}
