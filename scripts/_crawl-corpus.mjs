import { listItems } from '../lib/webflow.mjs';
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('data/blog-corpus',{recursive:true});
let all=[];for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
all.sort((a,b)=>(a.fieldData.slug||'').localeCompare(b.fieldData.slug||''));

// 1. llms.txt index
let llms='# TradersYard Blog — Full Content Corpus\n\n';
llms+='> '+all.length+' live blog posts. Index below; full content in data/blog-corpus/<slug>.md\n\n## Posts\n\n';
const manifest=[];
for(const it of all){
  const f=it.fieldData;const slug=f.slug;if(!slug)continue;
  const title=(f.name||'').replace(/\s*\|\s*TradersYard.*$/i,'').trim();
  const url='https://tradersyard.com/blog-posts/'+slug;
  const summary=(f['post-summary']||'').slice(0,120);
  llms+=`- [${title}](${url})${summary?': '+summary:''}\n`;
  // 2. per-post markdown (text content for review)
  const body=f['post-body']||'';
  const text=body
    .replace(/<details[^>]*>/gi,'').replace(/<\/details>/gi,'')
    .replace(/<summary[^>]*>/gi,'### ').replace(/<\/summary>/gi,'\n')
    .replace(/<h2[^>]*>/gi,'\n## ').replace(/<\/h2>/gi,'\n')
    .replace(/<h3[^>]*>/gi,'\n### ').replace(/<\/h3>/gi,'\n')
    .replace(/<li[^>]*>/gi,'- ').replace(/<\/li>/gi,'\n')
    .replace(/<\/p>/gi,'\n\n').replace(/<[^>]+>/g,'')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"')
    .replace(/\n{3,}/g,'\n\n').trim();
  const words=text.split(/\s+/).filter(Boolean).length;
  const faqFlat=/frequently asked|faq/i.test(body)&&!/<details/i.test(body);
  writeFileSync('data/blog-corpus/'+slug+'.md',`# ${title}\nURL: ${url}\nWords: ${words}\nFAQ: ${/<details/i.test(body)?'dropdown':faqFlat?'FLAT (convert)':'none'}\n\n${text}`);
  manifest.push({slug,title,url,words,faqFlat,hasDropdown:/<details/i.test(body)});
}
writeFileSync('data/blog-corpus/llms.txt',llms);
writeFileSync('data/blog-corpus-manifest.json',JSON.stringify(manifest,null,2));
console.log('Crawled '+all.length+' posts → data/blog-corpus/');
console.log('  llms.txt index:',llms.length,'bytes');
console.log('  per-post .md files:',manifest.length);
console.log('  FAQ flat (to convert):',manifest.filter(m=>m.faqFlat).length);
console.log('  already dropdown:',manifest.filter(m=>m.hasDropdown).length);
console.log('  total words in corpus:',manifest.reduce((s,m)=>s+m.words,0).toLocaleString());
