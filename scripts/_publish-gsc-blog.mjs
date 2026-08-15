import { readFileSync, writeFileSync } from 'fs';
import { createItem, getItem, publishItems } from '../lib/webflow.mjs';
const b=JSON.parse(readFileSync('data/gsc-blog.json','utf8'));
console.log('Title:',b.title,'('+b.title.length+'ch) | Meta:'+b.meta.length+'ch | Words:'+b.words);
const item=await createItem({name:b.title,slug:b.slug,'post-body':b.html,'post-summary':b.meta,'feature-post':false},{isDraft:false});
const after=await getItem(item.id);
const h2=(b.html.match(/<h2>(.*?)<\/h2>/)||[])[1];
const ok=(after.fieldData['post-body']||'').includes('Search Console');
console.log(ok?'✅ created+verified → '+item.id:'❌ verify failed');
if(ok){await publishItems([item.id]);writeFileSync('data/gsc-blog-published.json',JSON.stringify({itemId:item.id,slug:b.slug}));console.log('published');}
