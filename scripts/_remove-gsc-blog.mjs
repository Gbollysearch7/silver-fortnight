import { readFileSync, writeFileSync } from 'fs';
import { getItem, deleteItem } from '../lib/webflow.mjs';
import { WEBFLOW_API_KEY, blogConfig } from '../lib/config.mjs';
const COLLECTION_ID = blogConfig.webflow.blogCollectionId;
const API_BASE = blogConfig.webflow.apiBase;

const pub=JSON.parse(readFileSync('data/gsc-blog-published.json','utf8'));
const it=await getItem(pub.itemId);
writeFileSync('data/seo-fixes/backup-gsc-blog-removed.json',JSON.stringify({itemId:pub.itemId,fieldData:it.fieldData},null,2));
console.log('Backed up. Removing from TradersYard...');

// 1. delete LIVE (unpublish from the domain)
const rLive=await fetch(`${API_BASE}/collections/${COLLECTION_ID}/items/${pub.itemId}/live`,{method:'DELETE',headers:{Authorization:'Bearer '+WEBFLOW_API_KEY}});
console.log('Unpublish (live delete):',rLive.status);
// 2. delete staged item
try{ await deleteItem(pub.itemId); console.log('✅ Deleted from CMS'); }
catch(e){ console.log('staged delete:',e.message); }
