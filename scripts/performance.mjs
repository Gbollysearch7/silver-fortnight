#!/usr/bin/env node

/**
 * Blog Performance Tracker
 * Fetches GA4 and GSC data for published blog posts.
 *
 * Usage:
 *   node scripts/performance.mjs
 *   node scripts/performance.mjs --slug how-to-pass-prop-firm-challenge
 *   node scripts/performance.mjs --report
 *   node scripts/performance.mjs --top 20
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import { PUBLISHED_DIR, REPORTS_DIR, TRACKER_PATH, DATA_DIR, GOOGLE_SERVICE_ACCOUNT_PATH, GA_PROPERTY_ID, GSC_SITE_URL, blogConfig } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, printTable, ensureDir, loadTracker, saveTracker, formatDate, formatDateShort } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';
import { google } from 'googleapis';

const args = parseArgs();

if (args.help) {
  console.log('Usage: node scripts/performance.mjs [options]');
  console.log('\nOptions:');
  console.log('  --slug <slug>       Track a specific post');
  console.log('  --report            Generate a markdown report');
  console.log('  --top <n>           Show top N posts by traffic');
  console.log('  --underperforming   Show posts with high impressions but low CTR');
  console.log('  --days <n>          Date range (default: 28)');
  process.exit(0);
}

printHeader('Blog Performance Tracker');

const days = parseInt(args.days || '28', 10);
const endDate = formatDateShort();
const startDate = formatDateShort(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

printInfo(`Date range: ${startDate} to ${endDate} (${days} days)`);

// --- Authenticate with Google ---
let auth;
try {
  const saPath = GOOGLE_SERVICE_ACCOUNT_PATH;
  if (!saPath || !existsSync(saPath)) {
    throw new Error(`Service account not found: ${saPath}`);
  }
  const credentials = JSON.parse(readFileSync(saPath, 'utf-8'));
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/analytics.readonly',
    ],
  });
  printSuccess('Authenticated with Google');
} catch (err) {
  printError(`Auth failed: ${err.message}`);
  printInfo('Showing cached data only');
  auth = null;
}

// --- Fetch GSC data ---
let gscData = {};

if (auth) {
  printSection('Google Search Console');
  try {
    const searchConsole = google.searchconsole({ version: 'v1', auth });
    const gscSiteUrl = GSC_SITE_URL || 'sc-domain:tradersyard.com';

    const res = await searchConsole.searchanalytics.query({
      siteUrl: gscSiteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 500,
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            operator: 'contains',
            expression: '/blog/',
          }],
        }],
      },
    });

    const rows = res.data.rows || [];
    for (const row of rows) {
      const url = row.keys[0];
      const slug = url.split('/blog/')[1]?.split('?')[0]?.split('#')[0] || '';
      if (slug) {
        gscData[slug] = {
          clicks: Math.round(row.clicks),
          impressions: Math.round(row.impressions),
          ctr: Math.round(row.ctr * 10000) / 100,
          position: Math.round(row.position * 10) / 10,
        };
      }
    }

    printSuccess(`Fetched data for ${Object.keys(gscData).length} blog pages`);
  } catch (err) {
    printError(`GSC fetch failed: ${err.message}`);
  }
}

// --- Update tracker ---
const tracker = loadTracker(TRACKER_PATH);

for (const [slug, data] of Object.entries(gscData)) {
  if (!tracker.posts[slug]) {
    tracker.posts[slug] = { slug, title: slug };
  }
  tracker.posts[slug].gscClicks = data.clicks;
  tracker.posts[slug].gscImpressions = data.impressions;
  tracker.posts[slug].gscCtr = data.ctr;
  tracker.posts[slug].gscPosition = data.position;
  tracker.posts[slug].performanceUpdatedAt = formatDate();
}

saveTracker(TRACKER_PATH, tracker);

// --- Display results ---
const posts = Object.values(tracker.posts).filter(p => p.gscClicks !== undefined);

if (posts.length === 0) {
  printInfo('No performance data available yet');
  process.exit(0);
}

// Sort by clicks descending
posts.sort((a, b) => (b.gscClicks || 0) - (a.gscClicks || 0));

const topN = args.top ? parseInt(args.top, 10) : 20;

if (args.slug) {
  // Single post detail
  const post = posts.find(p => p.slug === args.slug);
  if (!post) {
    printError(`No data found for slug: ${args.slug}`);
    process.exit(1);
  }
  printSection(post.title || post.slug);
  console.log(`  Clicks:      ${post.gscClicks}`);
  console.log(`  Impressions: ${post.gscImpressions}`);
  console.log(`  CTR:         ${post.gscCtr}%`);
  console.log(`  Avg Position:${post.gscPosition}`);
} else if (args.underperforming) {
  // High impressions, low CTR
  printSection('Underperforming (High Impressions, Low CTR)');
  const underperf = posts
    .filter(p => (p.gscImpressions || 0) > 50 && (p.gscCtr || 0) < 3)
    .sort((a, b) => (b.gscImpressions || 0) - (a.gscImpressions || 0))
    .slice(0, topN);

  if (underperf.length === 0) {
    printSuccess('No underperforming posts found');
  } else {
    printTable(
      ['Slug', 'Impressions', 'Clicks', 'CTR', 'Position'],
      underperf.map(p => [p.slug?.slice(0, 40), p.gscImpressions, p.gscClicks, `${p.gscCtr}%`, p.gscPosition]),
    );
    printInfo('These posts have visibility but low click-through. Optimize titles and meta descriptions.');
  }
} else {
  // Top posts
  printSection(`Top ${Math.min(topN, posts.length)} Posts`);
  printTable(
    ['Slug', 'Clicks', 'Impressions', 'CTR', 'Position'],
    posts.slice(0, topN).map(p => [p.slug?.slice(0, 40), p.gscClicks, p.gscImpressions, `${p.gscCtr}%`, p.gscPosition]),
  );
}

// --- Generate report ---
if (args.report) {
  ensureDir(REPORTS_DIR);
  const reportPath = resolve(REPORTS_DIR, `blog-performance-${formatDateShort()}.md`);

  const lines = [
    `# Blog Performance Report`,
    `\nDate range: ${startDate} to ${endDate} (${days} days)`,
    `\nTotal blog pages tracked: ${posts.length}`,
    `Total clicks: ${posts.reduce((s, p) => s + (p.gscClicks || 0), 0)}`,
    `Total impressions: ${posts.reduce((s, p) => s + (p.gscImpressions || 0), 0)}`,
    `\n## Top 20 by Clicks\n`,
    '| Slug | Clicks | Impressions | CTR | Position |',
    '|------|--------|-------------|-----|----------|',
    ...posts.slice(0, 20).map(p => `| ${p.slug} | ${p.gscClicks} | ${p.gscImpressions} | ${p.gscCtr}% | ${p.gscPosition} |`),
  ];

  const underperf = posts.filter(p => (p.gscImpressions || 0) > 50 && (p.gscCtr || 0) < 3);
  if (underperf.length > 0) {
    lines.push(`\n## Optimization Opportunities (High Impressions, Low CTR)\n`);
    lines.push('| Slug | Impressions | CTR | Position |');
    lines.push('|------|-------------|-----|----------|');
    for (const p of underperf.slice(0, 10)) {
      lines.push(`| ${p.slug} | ${p.gscImpressions} | ${p.gscCtr}% | ${p.gscPosition} |`);
    }
  }

  writeFileSync(reportPath, lines.join('\n'), 'utf-8');
  printSuccess(`Report saved: ${reportPath}`);
}

console.log('');
