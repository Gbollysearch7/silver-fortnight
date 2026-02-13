#!/usr/bin/env node

/**
 * Google Indexing API Submission
 * Submits published blog URLs to Google for indexing.
 *
 * Usage:
 *   node scripts/index.mjs --url https://tradersyard.com/blog/slug
 *   node scripts/index.mjs --file content/published/slug.md
 *   node scripts/index.mjs --all-recent
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { PUBLISHED_DIR, DATA_DIR, GOOGLE_SERVICE_ACCOUNT_PATH, blogConfig } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, ensureDir, readJsonFile, writeJsonFile, formatDate } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';
import { SignJWT, importPKCS8 } from 'jose';

const args = parseArgs();

if (!args.url && !args.file && !args['all-recent']) {
  console.log('Usage: node scripts/index.mjs --url <url> [options]');
  console.log('\nTargets:');
  console.log('  --url <url>        Submit a specific URL');
  console.log('  --file <path>      Submit URL from a blog post file');
  console.log('  --all-recent       Submit all published posts from last 7 days');
  process.exit(0);
}

printHeader('Google Indexing Submission');

// Build list of URLs to submit
const urls = [];

if (args.url) {
  urls.push(args.url);
} else if (args.file) {
  const filePath = resolve(args.file);
  const { frontmatter } = parseFile(filePath);
  urls.push(`${blogConfig.site.baseUrl}${blogConfig.site.blogPath}/${frontmatter.slug}`);
} else if (args['all-recent']) {
  if (existsSync(PUBLISHED_DIR)) {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const files = readdirSync(PUBLISHED_DIR).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const filePath = resolve(PUBLISHED_DIR, f);
      const { frontmatter } = parseFile(filePath);
      const publishedAt = frontmatter.published_at ? new Date(frontmatter.published_at).getTime() : 0;
      if (publishedAt >= cutoff) {
        urls.push(`${blogConfig.site.baseUrl}${blogConfig.site.blogPath}/${frontmatter.slug}`);
      }
    }
  }
}

if (urls.length === 0) {
  printInfo('No URLs to submit');
  process.exit(0);
}

printInfo(`Submitting ${urls.length} URL(s) for indexing...\n`);

// Load service account
let accessToken;
try {
  const saPath = GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!saPath || !existsSync(saPath)) {
    throw new Error(`Service account file not found: ${saPath}`);
  }
  const sa = JSON.parse(readFileSync(saPath, 'utf-8'));

  // Create JWT for Google Indexing API
  const privateKey = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  }
  printSuccess('Authenticated with Google');
} catch (err) {
  printError(`Auth failed: ${err.message}`);
  process.exit(1);
}

// Submit URLs
const results = [];

for (const url of urls) {
  try {
    const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        type: 'URL_UPDATED',
      }),
    });

    const data = await res.json();

    if (res.ok) {
      printSuccess(`Submitted: ${url}`);
      results.push({ url, status: 'success', notifyTime: data.urlNotificationMetadata?.latestUpdate?.notifyTime });
    } else {
      printError(`Failed: ${url} - ${data.error?.message || res.status}`);
      results.push({ url, status: 'failed', error: data.error?.message || res.status });
    }
  } catch (err) {
    printError(`Error: ${url} - ${err.message}`);
    results.push({ url, status: 'error', error: err.message });
  }

  // Rate limit: 200 req/day, be conservative
  await new Promise(r => setTimeout(r, 500));
}

// Save results
ensureDir(DATA_DIR);
const resultsPath = resolve(DATA_DIR, 'indexing-results.json');
const existing = readJsonFile(resultsPath) || { submissions: [] };
existing.submissions.push({
  date: formatDate(),
  results,
});
writeJsonFile(resultsPath, existing);

printSection('Summary');
const succeeded = results.filter(r => r.status === 'success').length;
printInfo(`Submitted: ${succeeded}/${urls.length}`);
if (succeeded < urls.length) {
  printError(`Failed: ${urls.length - succeeded}`);
}
printInfo(`Results saved: ${resultsPath}`);
console.log('');
