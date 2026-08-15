import { listItems } from '../lib/webflow.mjs';
import { writeFileSync } from 'fs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// country/geo pages
const geoRx=/best-prop-firms-in-|prop-firms-in-|prop-trading-(france|germany|usa|uk)|prop-firms-united/i;
const geo=all.filter(it=>geoRx.test(it.fieldData.slug)).map(it=>({slug:it.fieldData.slug,id:it.id,hasPillarLink:(it.fieldData['post-body']||'').includes('/blog-posts/best-prop-firms"')}));
writeFileSync('data/geo-pages.json',JSON.stringify(geo,null,2));
console.log('Geo/country pages found:',geo.length);
console.log('Already link to Best Prop Firms pillar:',geo.filter(g=>g.hasPillarLink).length);
console.log('Need pillar link added:',geo.filter(g=>!g.hasPillarLink).length+'\n');
geo.slice(0,15).forEach(g=>console.log('  '+(g.hasPillarLink?'✓':'+')+' '+g.slug));
if(geo.length>15)console.log('  ... +'+(geo.length-15)+' more');
