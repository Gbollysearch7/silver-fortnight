import { readFileSync, writeFileSync } from 'fs';
import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
const DRY=process.argv.includes('--dry-run');
const finals={'can-you-swing-trade-on-prop-firms-40bab':'can-you-swing-trade-on-prop-firms-40bab.html','how-many-prop-firms-are-there':'how-many-prop-firms-are-there.html','how-many-people-get-payouts-from-prop-firms-a8fe0':'payout-final.html'};
const metaTitles={'can-you-swing-trade-on-prop-firms-40bab':'Prop Firms That Let You Swing Trade (2026 List)','how-many-prop-firms-are-there':'How Many Forex Prop Firms Are There? (2026 Count)','how-many-people-get-payouts-from-prop-firms-a8fe0':'What % of Traders Get a Payout From Prop Firms?'};
const metaDescs={'can-you-swing-trade-on-prop-firms-40bab':'Which prop firms let you swing trade? The rules that matter (overnight + weekend holds), why some firms restrict it, and how to pick one that fits your style.','how-many-prop-firms-are-there':'How many forex prop firms are there in 2026? The honest estimate, why no exact count exists, the firms that matter, and how to choose one without getting burned.','how-many-people-get-payouts-from-prop-firms-a8fe0':'What percentage of traders get a payout from prop firms? The honest, data-backed answer: pass rates, payout rates, why most fail, and how to be one who gets paid.'};

let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const backup=[],ids=[];
const ts=new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
for(const [slug,file] of Object.entries(finals)){
  const it=all.find(x=>x.fieldData.slug===slug);if(!it){console.log('? missing',slug);continue;}
  let body=readFileSync('data/pilot-out/'+file,'utf8');
  // CTA → /#pricing (replace auth/register in CTA button hrefs)
  body=body.replace(/https:\/\/tradersyard\.com\/auth\/register/g,'https://tradersyard.com/#pricing');
  backup.push({slug,id:it.id,body:it.fieldData['post-body'],summary:it.fieldData['post-summary'],name:it.fieldData.name});
  const fields={'post-body':body,'post-summary':metaDescs[slug]};
  if(DRY){console.log('[DRY]',slug,'len',body.length,'CTA→pricing:',body.includes('#pricing'));continue;}
  try{
    await updateItem(it.id,fields);
    const af=await getItem(it.id);
    const ok=(af.fieldData['post-body']||'').length>15000 && (af.fieldData['post-body']||'').includes('#pricing');
    if(ok){ids.push(it.id);console.log('✅',slug,'updated ('+body.length+' chars)');}
    else console.log('⚠ verify fail',slug);
  }catch(e){console.log('err',slug,e.message);}
}
writeFileSync('data/seo-fixes/backup-pilot-'+ts+'.json',JSON.stringify(backup,null,2));
if(!DRY&&ids.length){await publishItems(ids);console.log('\nPublished',ids.length,'pilot posts.');}
