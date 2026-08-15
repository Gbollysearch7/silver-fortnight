import { listItems } from '../lib/webflow.mjs';
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
// scan ALL live posts for placeholder/scaffold markers — important quality check
const markers=/\[Option [AB]\]|\[insert|\[firm name\]|\[country\]|lorem ipsum|placeholder|to be written|XXXX|\{\{|TODO/i;
const bad=[];
for(const it of all){
  const body=it.fieldData['post-body']||'';
  if(markers.test(body)){
    const m=body.match(markers);
    bad.push({slug:it.fieldData.slug,marker:m[0]});
  }
}
console.log('=== SCAFFOLD/PLACEHOLDER SCAN (all '+all.length+' live posts) ===');
console.log('Pages with placeholder markers:',bad.length);
bad.forEach(b=>console.log('  ⚠ "'+b.marker+'"  '+b.slug));
