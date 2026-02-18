#!/usr/bin/env node

/**
 * Google Search Console Sitemap Submission
 * Submits the Webflow-generated sitemap.xml to GSC for re-crawling.
 *
 * Webflow auto-generates the sitemap at blog.tradersyard.com/sitemap.xml.
 * This script tells Google to re-process it, ensuring new posts get discovered.
 *
 * Usage:
 *   node scripts/submit-sitemap.mjs              # Submit sitemap
 *   node scripts/submit-sitemap.mjs --status     # Check sitemap status in GSC
 *   node scripts/submit-sitemap.mjs --dry-run    # Show what would happen
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR, GOOGLE_SERVICE_ACCOUNT_PATH, GSC_SITE_URL, blogConfig } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, printWarning, ensureDir, readJsonFile, writeJsonFile, formatDate } from '../lib/utils.mjs';
import { SignJWT, importPKCS8 } from 'jose';

const args = parseArgs();

const SITEMAP_URL = `${blogConfig.site.baseUrl}/sitemap.xml`;
const SITE_URL = GSC_SITE_URL; // sc-domain:tradersyard.com

printHeader('Sitemap Submission');
printInfo(`Sitemap: ${SITEMAP_URL}`);
printInfo(`GSC Site: ${SITE_URL}\n`);

if (!SITE_URL) {
  printError('GSC_SITE_URL not set in .env');
  process.exit(1);
}

// --- Authenticate with Google ---

async function getAccessToken() {
  const saPath = GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!saPath || !existsSync(saPath)) {
    throw new Error(`Service account file not found: ${saPath}`);
  }
  const sa = JSON.parse(readFileSync(saPath, 'utf-8'));

  const privateKey = await importPKCS8(sa.private_key, 'RS256');
  const jwt = await new SignJWT({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
  }

  return tokenData.access_token;
}

// --- Submit Sitemap ---

async function submitSitemap(accessToken) {
  const encodedSiteUrl = encodeURIComponent(SITE_URL);
  const encodedSitemapUrl = encodeURIComponent(SITEMAP_URL);

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (res.ok || res.status === 204) {
    return { status: 'success', httpStatus: res.status };
  }

  const text = await res.text();
  return { status: 'failed', httpStatus: res.status, error: text };
}

// --- Check Sitemap Status ---

async function getSitemapStatus(accessToken) {
  const encodedSiteUrl = encodeURIComponent(SITE_URL);

  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/sitemaps`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get sitemaps: ${res.status} ${text}`);
  }

  return res.json();
}

// --- Log Results ---

function logSubmission(result) {
  ensureDir(DATA_DIR);
  const logPath = resolve(DATA_DIR, 'sitemap-submissions.json');
  const existing = readJsonFile(logPath) || { submissions: [] };

  existing.submissions.push({
    timestamp: formatDate(),
    sitemapUrl: SITEMAP_URL,
    siteUrl: SITE_URL,
    ...result,
  });

  // Keep last 100 entries
  if (existing.submissions.length > 100) {
    existing.submissions = existing.submissions.slice(-100);
  }

  writeJsonFile(logPath, existing);
}

// --- Main ---

try {
  printInfo('Authenticating with Google...');
  const accessToken = await getAccessToken();
  printSuccess('Authenticated');

  if (args.status) {
    // Status mode: show current sitemap info in GSC
    printSection('Sitemap Status');
    const data = await getSitemapStatus(accessToken);

    if (!data.sitemap || data.sitemap.length === 0) {
      printWarning('No sitemaps found in GSC');
    } else {
      for (const sm of data.sitemap) {
        console.log(`  Path: ${sm.path}`);
        console.log(`  Last submitted: ${sm.lastSubmitted || 'never'}`);
        console.log(`  Last downloaded: ${sm.lastDownloaded || 'never'}`);
        console.log(`  Pending: ${sm.isPending ? 'yes' : 'no'}`);
        if (sm.contents) {
          for (const c of sm.contents) {
            console.log(`  URLs: ${c.submitted} submitted, ${c.indexed} indexed (${c.type})`);
          }
        }
        console.log('');
      }
    }
  } else if (args['dry-run']) {
    // Dry run
    printSection('Dry Run');
    printInfo(`Would submit: ${SITEMAP_URL}`);
    printInfo(`To GSC site: ${SITE_URL}`);
    printInfo('No API call made');
  } else {
    // Submit
    printSection('Submitting Sitemap');
    printInfo(`Submitting ${SITEMAP_URL} to GSC...`);

    const result = await submitSitemap(accessToken);

    if (result.status === 'success') {
      printSuccess(`Sitemap submitted successfully (HTTP ${result.httpStatus})`);
    } else {
      printError(`Submission failed: HTTP ${result.httpStatus}`);
      printError(result.error);
    }

    logSubmission(result);
    printInfo(`Results logged to data/sitemap-submissions.json`);
  }
} catch (err) {
  printError(`Error: ${err.message}`);
  process.exit(1);
}
