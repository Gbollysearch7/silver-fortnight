import { listItems, getItem, updateItem, publishItems } from '../lib/webflow.mjs';
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const slugs=['which-prop-firms-are-regulated','fast-payout-prop-firms-guide','are-prop-firms-real'];
const backup=[],ids=[];let ok=0;
for(const slug of slugs){const it=all.find(x=>x.fieldData.slug===slug);backup.push({slug,id:it.id,body:it.fieldData['post-body']});}
writeFileSync('data/seo-fixes/backup-firmname.json',JSON.stringify(backup,null,2));
for(const slug of slugs){
  const it=all.find(x=>x.fieldData.slug===slug);
  let body=it.fieldData['post-body']||'';
  // replace bracketed placeholder with a clean generic instruction phrasing
  const newBody=body.replace(/\[firm name\]/gi,"the firm's name").replace(/\[Firm Name\]/g,"the firm's name");
  if(newBody===body){console.log('no change',slug);continue;}
  if(DRY){console.log('DRY would fix',slug,'('+((body.match(/\[firm name\]/gi)||[]).length)+' placeholders)');ids.push(it.id);continue;}
  await updateItem(it.id,{'post-body':newBody});
  const after=await getItem(it.id);
  const clean=!/\[firm name\]/i.test(after.fieldData['post-body']||'');
  if(clean){ok++;ids.push(it.id);console.log('✅',slug);}else console.log('❌ still has placeholder',slug);
}
if(!DRY&&ids.length){await publishItems(ids);console.log(`\n${ok}/${slugs.length} fixed + published`);}
else if(DRY)console.log('\n[DRY] '+ids.length+' would be fixed');
