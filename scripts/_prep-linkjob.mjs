import { writeFileSync, readFileSync } from 'fs';
import { listItems } from '../lib/webflow.mjs';
const map = JSON.parse(readFileSync('data/orphan-linkmap.json','utf8'));
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const byslug={}; all.forEach(it=>byslug[it.fieldData.slug]=it);

const jobs=[];
for(const [slug,targets] of Object.entries(map)){
  const it=byslug[slug]; if(!it||targets.length<2) continue;
  const body=it.fieldData['post-body']||'';
  // skip tool pages with tiny text bodies (they don't have prose to link from) — handle separately
  const textLen=body.replace(/<[^>]+>/g,'').length;
  jobs.push({
    slug, id:it.id, textLen,
    targets: targets.slice(0,3).map(t=>({url:`https://tradersyard.com/blog-posts/${t.slug}`, slug:t.slug, title:t.title})),
    // send only the body (truncate very long ones — agent inserts links, returns full)
    body
  });
}
writeFileSync('data/linkjob-input.json',JSON.stringify(jobs));
console.log(jobs.length+' link jobs prepared');
console.log('Tool pages (low text, link in intro):',jobs.filter(j=>j.textLen<600).length);
console.log('Article pages (link in prose):',jobs.filter(j=>j.textLen>=600).length);
console.log('Total body chars to process:',jobs.reduce((s,j)=>s+j.body.length,0));
