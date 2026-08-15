import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';
import { GOOGLE_SERVICE_ACCOUNT_PATH } from '../lib/config.mjs';
const sa = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const urls = JSON.parse(readFileSync('data/phase2-sections-v2.json','utf8')).filter(s=>s.itemId).map(s=>`https://tradersyard.com/blog-posts/${s.slug}`);
const key = await importPKCS8(sa.private_key,'RS256');
const now=Math.floor(Date.now()/1000);
const jwt=await new SignJWT({scope:'https://www.googleapis.com/auth/indexing'}).setProtectedHeader({alg:'RS256',typ:'JWT'}).setIssuer(sa.client_email).setSubject(sa.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt(now).setExpirationTime(now+3600).sign(key);
const tok=await(await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`})).json();
let ok=0;
for(const url of urls){const r=await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish',{method:'POST',headers:{Authorization:`Bearer ${tok.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({url,type:'URL_UPDATED'})});if(r.status===200)ok++;await new Promise(r=>setTimeout(r,150));}
console.log(`Indexing: ${ok}/${urls.length} accepted`);
