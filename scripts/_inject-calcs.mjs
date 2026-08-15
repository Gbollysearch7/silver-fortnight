import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const ONE=process.argv.find(a=>a.startsWith('--slug='))?.split('=')[1];
const calcs=JSON.parse(readFileSync('data/calculators.json','utf8'));

// slug pattern -> calculator type
const MAP=[
  [/lot-size|position-siz/i,'forex-lot-size-calculator'],
  [/risk-reward/i,'risk-reward-ratio-calculator'],
  [/risk-management|managing-risk/i,'risk-management-calculator'],
  [/pip-value/i,'pip-value-converter'],
  [/drawdown/i,'drawdown'],
  [/profit-split|profit splits/i,'profit-split'],
  [/profit-target|profit target/i,'profit-target'],
  [/consistency/i,'consistency'],
  [/payout-schedule|withdrawal-process|how-long.*payout/i,'payout-timing'],
];
const pick=slug=>{for(const [rx,c] of MAP)if(rx.test(slug))return c;return null;};
const MARKER='<!--ty-calc-->';

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// build live target list (dedupe — prefer the one without random suffix if both exist? just use live slugs)
const hasCalc=b=>/id="tyCalc"|wrapifai|<input[^>]*type="number"/i.test(b);
let targets=all.filter(it=>{const s=it.fieldData.slug;const b=it.fieldData['post-body']||'';return pick(s)&&!hasCalc(b);});
if(ONE)targets=targets.filter(t=>t.fieldData.slug===ONE);

console.log(`${DRY?'[DRY] ':''}${targets.length} posts to get a calculator\n`);
const backup=[],ids=[];let ok=0;
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
for(const it of targets){
  const slug=it.fieldData.slug;const calcKey=pick(slug);const calc=calcs[calcKey];
  if(!calc){console.log('? no calc for',slug);continue;}
  let body=it.fieldData['post-body']||'';
  if(body.includes(MARKER)||hasCalc(body)){console.log('· already has calc:',slug);continue;}
  // insert after the FIRST </h2> (right after the intro section) — prominent placement
  const firstH2End=body.indexOf('</h2>');
  // skip past the first paragraph after that h2 so the calc follows the intro
  let insertAt=firstH2End>-1?body.indexOf('</p>',firstH2End):0;
  insertAt=insertAt>-1?insertAt+4:body.length;
  const block=`\n${MARKER}<h2>Quick Calculator</h2>\n<p>Use the interactive calculator below to run your own numbers instantly.</p>\n${calc}\n`;
  const newBody=body.slice(0,insertAt)+block+body.slice(insertAt);
  backup.push({slug,id:it.id,body});
  if(DRY){console.log(`DRY ${slug} → [${calcKey}]`);ids.push(it.id);continue;}
  try{await updateItem(it.id,{'post-body':newBody});const af=await getItem(it.id);if((af.fieldData['post-body']||'').includes('id="tyCalc"')){ok++;ids.push(it.id);console.log(`✅ ${slug} → [${calcKey}]`);}else console.log('verify fail',slug);}catch(e){console.log('err',slug,e.message);}
}
if(backup.length)writeFileSync(`data/seo-fixes/backup-calc-inject-${ts}.json`,JSON.stringify(backup,null,2));
if(!DRY&&ids.length){await publishItems(ids);console.log(`\n${ok} calculators added + published.`);}
else if(DRY)console.log(`\n[DRY] ${ids.length} would get a calculator.`);
