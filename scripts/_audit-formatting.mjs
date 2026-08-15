import { listItems } from '../lib/webflow.mjs';
import { writeFileSync, mkdirSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
console.log('Total live posts:',all.length,'\n');
let hasFaqText=0,hasFaqDropdown=0,noFaq=0,hasDetails=0;
let shortPosts=0,noH2=0;
const sample=[];
for(const it of all){
  const body=it.fieldData['post-body']||'';
  const text=body.replace(/<[^>]+>/g,' ');
  const words=text.split(/\s+/).filter(Boolean).length;
  const faqHeading=/faq|frequently asked|questions/i.test(body);
  const hasDetailsTag=/<details/i.test(body);
  const accordion=/accordion|w-dropdown|faq-item|toggle/i.test(body);
  if(hasDetailsTag)hasDetails++;
  if(faqHeading&&(hasDetailsTag||accordion))hasFaqDropdown++;
  else if(faqHeading)hasFaqText++;
  else noFaq++;
  if(words<800)shortPosts++;
  if(!/<h2/i.test(body))noH2++;
}
console.log('=== FORMATTING AUDIT ===');
console.log('FAQ as dropdown/accordion/details:',hasFaqDropdown);
console.log('FAQ as flat text (needs dropdown conversion):',hasFaqText);
console.log('No FAQ section:',noFaq);
console.log('Uses <details> tag anywhere:',hasDetails);
console.log('');
console.log('Posts under 800 words (may need depth):',shortPosts);
console.log('Posts with no H2 structure:',noH2);
