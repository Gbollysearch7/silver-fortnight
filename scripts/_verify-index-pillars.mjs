import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';
import { GOOGLE_SERVICE_ACCOUNT_PATH } from '../lib/config.mjs';
const pub = JSON.parse(readFileSync('data/pillars-published.json','utf8'));
const slugs = Object.values(pub).map(p=>p.slug);

// verify live
console.log('=== LIVE VERIFICATION ===');
let live=0;
for (const slug of slugs) {
  const code = (await fetch('https://tradersyard.com/blog-posts/'+slug)).status;
  if(code===200)live++;
  console.log(`  ${code===200?'✅':'❌'} ${code}  ${slug}`);
}
console.log(`${live}/${slugs.length} serving live\n`);

// index
const sa=JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const key=await importPKCS8(sa.private_key,'RS256');const now=Math.floor(Date.now()/1000);
const jwt=await new SignJWT({scope:'https://www.googleapis.com/auth/indexing'}).setProtectedHeader({alg:'RS256',typ:'JWT'}).setIssuer(sa.client_email).setSubject(sa.client_email).setAudience('https://oauth2.googleapis.com/token').setIssuedAt(now).setExpirationTime(now+3600).sign(key);
const tok=await(await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`})).json();
let idx=0;
for(const slug of slugs){
  const r=await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish',{method:'POST',headers:{Authorization:`Bearer ${tok.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({url:'https://tradersyard.com/blog-posts/'+slug,type:'URL_UPDATED'})});
  if(r.status===200)idx++;
  await new Promise(r=>setTimeout(r,150));
}
console.log(`Indexing: ${idx}/${slugs.length} submitted`);
