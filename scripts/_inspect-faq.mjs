import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// find a post that uses <details> and show its FAQ markup
const withDetails=all.find(it=>/<details/i.test(it.fieldData['post-body']||''));
const body=withDetails.fieldData['post-body']||'';
const m=body.match(/<details[\s\S]{0,400}?<\/details>/i);
console.log('EXISTING DROPDOWN PATTERN (from '+withDetails.fieldData.slug+'):\n');
console.log(m?m[0]:'(no match)');
console.log('\n--- now a FLAT-FAQ post to see what we convert FROM ---');
const flat=all.find(it=>{const b=it.fieldData['post-body']||'';return /faq|frequently asked/i.test(b)&&!/<details/i.test(b);});
const fb=flat.fieldData['post-body']||'';
const fi=fb.search(/<h2[^>]*>[^<]*(faq|frequently asked|questions)/i);
console.log('\nfrom '+flat.fieldData.slug+':');
console.log(fb.slice(fi,fi+600));
