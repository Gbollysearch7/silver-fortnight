import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
let aiImages=0,bodyImgs=0,thin=0,mid=0,good=0;
const aiImgPosts=[];
for(const it of all){
  const b=it.fieldData['post-body']||'';
  const text=b.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
  if(text<800)thin++;else if(text<1500)mid++;else good++;
  // in-article images (not the feature image) — likely the AI person-at-computer ones
  const imgs=[...b.matchAll(/<img[^>]+src="([^"]+)"/gi)].map(m=>m[1]);
  const aiLike=imgs.filter(u=>/fal\.|ideogram|fal-ai|replicate|oaidalle|dalle|unsplash|pexels/i.test(u));
  if(aiLike.length){aiImages+=aiLike.length;aiImgPosts.push({slug:it.fieldData.slug,n:aiLike.length,sample:aiLike[0].slice(0,60)});}
  bodyImgs+=imgs.length;
}
console.log('=== DEPTH ===');
console.log('Thin (<800w):',thin,'| Mid (800-1500w):',mid,'| Good (1500w+):',good);
console.log('\n=== IN-ARTICLE IMAGES ===');
console.log('Total body <img> tags:',bodyImgs);
console.log('AI/stock-style in-article images (to replace):',aiImages,'across',aiImgPosts.length,'posts');
console.log('\nSample posts with AI/stock in-article images:');
aiImgPosts.slice(0,10).forEach(p=>console.log('  '+p.n+'x  '+p.slug+'  ('+p.sample+'...)'));
