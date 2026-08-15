import { listItems } from '../lib/webflow.mjs';
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const tools=all.filter(x=>/calculator|converter|analyzer|template|journal/i.test(x.fieldData.slug)&&/<iframe/i.test(x.fieldData['post-body']||''));
console.log('Verifying every embedded tool ('+tools.length+' pages):\n');
let dead=0,live=0;
for(const it of tools){
  const body=it.fieldData['post-body']||'';
  const src=(body.match(/<iframe[^>]*src="([^"]+)"/i)||[])[1];
  if(!src){console.log('  ? no src  '+it.fieldData.slug);continue;}
  let code='ERR';
  try{const r=await fetch(src,{method:'GET'});code=r.status;}catch(e){code='FAIL';}
  const ok=code>=200&&code<400;
  if(ok)live++;else dead++;
  console.log('  '+(ok?'LIVE '+code:'DEAD '+code)+'  '+it.fieldData.slug.slice(0,46).padEnd(46)+' '+src.replace('https://app.','').slice(0,30));
}
console.log('\nRESULT: '+live+' live, '+dead+' DEAD (returning errors)');
