import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { getItem, updateItem, publishItems, listItems } from '../lib/webflow.mjs';

const DRY = process.argv.includes('--dry-run') || process.argv.includes('--dry');
mkdirSync('data/seo-fixes', { recursive: true });
const map = JSON.parse(readFileSync('data/orphan-linkmap.json','utf8'));
let all=[];
for(let off=0;off<400;off+=100){const{items}=await listItems({limit:100,offset:off});if(!items.length)break;all.push(...items);}
const byslug={}; all.forEach(it=>byslug[it.fieldData.slug]=it);

// natural anchor text from target title (strip year/suffix)
const anchor = (title,slug) => {
  let a = (title||'')
    .replace(/\s*[\[(].*$/,'')
    .replace(/\s*[:|—-].*$/,'')
    .replace(/\s*\b(20\d\d|Complete|Guide|Explained|Ranked|Tested)\b.*$/i,'')
    .replace(/\?$/,'')
    .trim();
  if(!a || a.length<6) a = slug.replace(/-\w{4,6}$/,'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  return a;
};

const MARKER='<!--ty-related-->';
const ts = new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)+'Z';
const backup=[], ids=[]; let ok=0, skip=0;

// PASS 1: snapshot
const slugs=Object.keys(map).filter(s=>map[s].length>=2 && byslug[s]);
for(const s of slugs){ const it=byslug[s]; backup.push({slug:s,id:it.id,body:it.fieldData['post-body']||''}); }
writeFileSync(`data/seo-fixes/backup-links-${ts}.json`,JSON.stringify(backup,null,2));

// PASS 2: insert
for(const s of slugs){
  const it=byslug[s];
  let body=it.fieldData['post-body']||'';
  if(body.includes(MARKER)){ skip++; continue; } // idempotent
  const targets=map[s].slice(0,3);
  const lis=targets.map(t=>`<li><a href="https://tradersyard.com/blog-posts/${t.slug}">${anchor(t.title,t.slug)}</a></li>`).join('');
  const block=`\n${MARKER}<h2>Related guides</h2><ul>${lis}</ul>`;
  const newBody=body+block;
  if(DRY){ ids.push(it.id); continue; }
  try{
    await updateItem(it.id,{'post-body':newBody});
    const after=await getItem(it.id);
    if((after.fieldData['post-body']||'').includes(MARKER)){ok++;ids.push(it.id);}
    else console.log('verify fail',s);
  }catch(e){console.log('err',s,e.message);}
}
if(DRY){ console.log(`[DRY] ${ids.length} would get a Related-guides block (3 internal links each). ${skip} already done.`); }
else { if(ids.length)await publishItems(ids); console.log(`${ok} linked + published. ${skip} skipped (already had links).`); }
