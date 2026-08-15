import { readFileSync, writeFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';
import { GOOGLE_SERVICE_ACCOUNT_PATH } from '../lib/config.mjs';

const DRY = process.argv.includes('--dry');
const sa = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_PATH,'utf8'));
const urls = JSON.parse(readFileSync('data/ctr-rewrites-final.json','utf8'))
  .filter(r => r.itemId)
  .map(r => `https://tradersyard.com/blog-posts/${r.slug}`);

console.log(`${DRY?'[DRY] ':''}Submitting ${urls.length} URLs to Google Indexing API (URL_UPDATED)`);
console.log(`Service account: ${sa.client_email}\n`);
if (DRY) { urls.forEach(u=>console.log('  '+u)); process.exit(0); }

// JWT for indexing scope
const key = await importPKCS8(sa.private_key, 'RS256');
const now = Math.floor(Date.now()/1000);
const jwt = await new SignJWT({ scope:'https://www.googleapis.com/auth/indexing' })
  .setProtectedHeader({ alg:'RS256', typ:'JWT' })
  .setIssuer(sa.client_email).setSubject(sa.client_email)
  .setAudience('https://oauth2.googleapis.com/token')
  .setIssuedAt(now).setExpirationTime(now+3600).sign(key);

const tok = await (await fetch('https://oauth2.googleapis.com/token',{
  method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body:`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
})).json();

if (!tok.access_token) { console.log('❌ Auth failed:', JSON.stringify(tok)); process.exit(1); }

const results = [];
for (const url of urls) {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish',{
    method:'POST',
    headers:{ 'Authorization':`Bearer ${tok.access_token}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ url, type:'URL_UPDATED' }),
  });
  const ok = res.status === 200;
  const body = await res.text();
  results.push({ url, status:res.status, ok });
  console.log(`${ok?'✅':'❌'} ${res.status}  ${url.split('/').pop()}${ok?'':' — '+body.slice(0,120)}`);
  await new Promise(r=>setTimeout(r,200));
}
const ok = results.filter(r=>r.ok).length;
writeFileSync('data/indexing-results-ctr.json', JSON.stringify(results,null,2));
console.log(`\n${ok}/${results.length} accepted by Google.`);
