#!/usr/bin/env node
// One-off batch submitter for the May 2026 SEO fix URLs.
import { readFileSync, writeFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';

const urlFile = process.argv[2] || 'data/seo-fixes/urls-to-index.json';
const urls = JSON.parse(readFileSync(urlFile, 'utf-8'));
const sa = JSON.parse(readFileSync('./data/google-service-account.json', 'utf-8'));

const now = Math.floor(Date.now() / 1000);
const key = await importPKCS8(sa.private_key, 'RS256');
const jwt = await new SignJWT({ scope: 'https://www.googleapis.com/auth/indexing' })
  .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
  .setIssuer(sa.client_email)
  .setSubject(sa.client_email)
  .setAudience('https://oauth2.googleapis.com/token')
  .setIssuedAt(now)
  .setExpirationTime(now + 3600)
  .sign(key);

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  }),
});
const tokenData = await tokenRes.json();
if (!tokenData.access_token) {
  console.error('TOKEN ERROR:', JSON.stringify(tokenData));
  process.exit(1);
}
console.log('Got access token. Submitting', urls.length, 'URLs...\n');

let ok = 0, fail = 0;
const results = [];
for (let i = 0; i < urls.length; i++) {
  const url = urls[i];
  try {
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type: 'URL_UPDATED' }),
    });
    const short = url.split('/blog-posts/')[1];
    if (res.ok) {
      ok++;
      console.log(`  [${i + 1}/${urls.length}] OK  ${short}`);
    } else {
      fail++;
      const t = await res.text();
      console.log(`  [${i + 1}/${urls.length}] FAIL ${res.status} ${short}: ${t.slice(0, 120)}`);
      results.push({ url, status: res.status, error: t.slice(0, 200) });
    }
  } catch (e) {
    fail++;
    console.log(`  [${i + 1}/${urls.length}] ERR ${url}: ${e.message}`);
    results.push({ url, error: e.message });
  }
  await new Promise(r => setTimeout(r, 300));
}
console.log(`\n=== INDEXING SUBMISSION ===\nSubmitted OK: ${ok}\nFailed: ${fail}`);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
writeFileSync(`data/seo-fixes/index-submit-results-${stamp}.json`, JSON.stringify({ ok, fail, results }, null, 2));
