import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
let noFeatImg=0,noAlt=0,bodyImgNoAlt=0,total=all.length;
for(const it of all){
  const f=it.fieldData;
  const fi=f['feature-image'];
  if(!fi||!fi.url) noFeatImg++;
  else if(!fi.alt) noAlt++;
  // body images missing alt
  const body=f['post-body']||'';
  const imgs=[...body.matchAll(/<img[^>]*>/g)].map(m=>m[0]);
  const missingAlt=imgs.filter(i=>!/alt="[^"]+"/.test(i)).length;
  if(missingAlt>0) bodyImgNoAlt+=missingAlt;
}
console.log('=== IMAGE / ALT-TEXT AUDIT ('+total+' posts) ===');
console.log('Posts with NO feature image:',noFeatImg);
console.log('Feature images with NO alt text:',noAlt);
console.log('Body <img> tags missing alt:',bodyImgNoAlt);
console.log('\nVerdict:',(noFeatImg>10||noAlt>10||bodyImgNoAlt>10)?'⚠ Real gap worth fixing':'✓ Mostly clean');
