import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { getItem, updateItem, publishItems } from '../lib/webflow.mjs';
mkdirSync('data/seo-fixes',{recursive:true});
const DRY=process.argv.includes('--dry-run')||process.argv.includes('--dry');
const art=JSON.parse(readFileSync('data/payout-article.json','utf8'));
const newTitle='Prop Firm Payout Schedule: When Do You Get Paid?'; // 48 chars
const newMeta='How long until a prop firm actually pays you? The payout cycle, minimum, KYC, and processing time explained — plus a real 14-day, $50-minimum example.'; // ~150
console.log('Title len:',newTitle.length,'| Meta len:',newMeta.length);
// snapshot
const cur=await getItem(art.id);
writeFileSync('data/seo-fixes/backup-payout-stub.json',JSON.stringify({id:art.id,name:cur.fieldData.name,'post-summary':cur.fieldData['post-summary'],body:cur.fieldData['post-body']},null,2));
console.log('Old title:',cur.fieldData.name);
console.log('Old body had [Option:', /\[Option/i.test(cur.fieldData['post-body']||''));
if(DRY){console.log('[DRY] would replace body ('+art.words+'w), title, meta');process.exit(0);}
await updateItem(art.id,{'post-body':art.html,name:newTitle,'post-summary':newMeta});
const after=await getItem(art.id);
const clean=!/\[Option/i.test(after.fieldData['post-body']||'')&&after.fieldData.name===newTitle&&(after.fieldData['post-body']||'').includes('payout cycle');
console.log(clean?'✅ replaced + verified':'❌ verify failed');
if(clean){await publishItems([art.id]);console.log('published');}
