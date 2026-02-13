#!/usr/bin/env node

/**
 * SEO Avalanche Tier Calculator
 * Analyzes Google Search Console data to determine current traffic tier.
 *
 * Per SEO Avalanche Technique:
 * 1. Get daily organic Google traffic over past 3 months
 * 2. Find range (min to max daily visitors)
 * 3. Calculate average daily traffic
 * 4. This determines which KGR tier you can naturally rank in
 *
 * Usage:
 *   node scripts/tier-calculator.mjs
 *   node scripts/tier-calculator.mjs --days 90
 *   node scripts/tier-calculator.mjs --verbose
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { google } from 'googleapis';
import { ROOT_DIR, GSC_SITE_URL, GOOGLE_SERVICE_ACCOUNT_PATH } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError, formatDate } from '../lib/utils.mjs';

const args = parseArgs();
const days = parseInt(args.days || '90', 10);
const verbose = args.verbose || false;

printHeader('SEO Avalanche Tier Calculator');

if (!GOOGLE_SERVICE_ACCOUNT_PATH) {
  printError('GOOGLE_SERVICE_ACCOUNT_PATH not set in .env');
  printInfo('Set the path to your Google service account JSON file');
  process.exit(1);
}

const serviceAccountPath = resolve(ROOT_DIR, GOOGLE_SERVICE_ACCOUNT_PATH);

// Load service account
let auth;
try {
  const credentials = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
} catch (err) {
  printError(`Failed to load service account: ${err.message}`);
  process.exit(1);
}

const searchconsole = google.searchconsole({ version: 'v1', auth });

printInfo(`Analyzing ${days} days of traffic data...`);
printInfo(`Site: ${GSC_SITE_URL}`);
console.log('');

async function getDailyTraffic() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: GSC_SITE_URL,
      requestBody: {
        startDate: startDateStr,
        endDate: endDateStr,
        dimensions: ['date'],
        rowLimit: 25000,
      },
    });

    const rows = response.data.rows || [];

    if (rows.length === 0) {
      printWarning('No traffic data found in GSC');
      return null;
    }

    // Build daily traffic map
    const dailyTraffic = {};
    for (const row of rows) {
      const date = row.keys[0];
      const clicks = row.clicks || 0;
      dailyTraffic[date] = clicks;
    }

    return dailyTraffic;
  } catch (err) {
    printError(`GSC API error: ${err.message}`);
    return null;
  }
}

async function calculateTier() {
  const dailyTraffic = await getDailyTraffic();

  if (!dailyTraffic) {
    printError('Failed to fetch traffic data');
    process.exit(1);
  }

  const dates = Object.keys(dailyTraffic).sort();
  const clicks = dates.map(d => dailyTraffic[d]);

  const totalClicks = clicks.reduce((sum, c) => sum + c, 0);
  const avgDailyClicks = Math.round(totalClicks / clicks.length);
  const minDailyClicks = Math.min(...clicks);
  const maxDailyClicks = Math.max(...clicks);

  printSection('Traffic Analysis');
  printInfo(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
  printInfo(`Days analyzed: ${clicks.length}`);
  printInfo(`Total clicks: ${totalClicks.toLocaleString()}`);
  console.log('');

  printSection('Daily Traffic Stats');
  console.log(`  Minimum: ${minDailyClicks} clicks/day`);
  console.log(`  Maximum: ${maxDailyClicks} clicks/day`);
  console.log(`  Average: ${avgDailyClicks} clicks/day`);
  console.log('');

  // Determine tier based on average daily traffic
  let tier, tierLabel, nextTier, nextTierLabel;

  if (avgDailyClicks < 10) {
    tier = 0;
    tierLabel = '0-10';
    nextTier = 10;
    nextTierLabel = '10-20';
  } else if (avgDailyClicks < 20) {
    tier = 10;
    tierLabel = '10-20';
    nextTier = 20;
    nextTierLabel = '20-50';
  } else if (avgDailyClicks < 50) {
    tier = 20;
    tierLabel = '20-50';
    nextTier = 50;
    nextTierLabel = '50-100';
  } else if (avgDailyClicks < 100) {
    tier = 50;
    tierLabel = '50-100';
    nextTier = 100;
    nextTierLabel = '100-200';
  } else if (avgDailyClicks < 200) {
    tier = 100;
    tierLabel = '100-200';
    nextTier = 200;
    nextTierLabel = '200-500';
  } else if (avgDailyClicks < 500) {
    tier = 200;
    tierLabel = '200-500';
    nextTier = 500;
    nextTierLabel = '500+';
  } else {
    tier = 500;
    tierLabel = '500+';
    nextTier = null;
    nextTierLabel = 'Maximum';
  }

  printSection('Current Tier');
  printSuccess(`Tier ${tier} (${tierLabel} daily clicks)`);
  console.log('');

  printSection('KGR Keyword Recommendations');
  console.log(`  Target monthly search volume: ${tier}-${tier === 0 ? 10 : tier === 10 ? 20 : tier === 20 ? 50 : tier === 50 ? 100 : tier === 100 ? 200 : tier === 200 ? 500 : 1000}`);
  console.log(`  KGR formula: Allintitle Results ÷ Monthly Search Volume ≤ 0.25`);
  console.log(`  Find 30-45 keywords in this tier to target`);
  console.log('');

  if (nextTier !== null) {
    printSection('Tier Progression');
    console.log(`  Current average: ${avgDailyClicks} clicks/day`);
    console.log(`  Next tier threshold: ${nextTier} clicks/day`);
    console.log(`  Clicks needed: ${nextTier - avgDailyClicks} more daily clicks`);
    console.log(`  Next tier target: Tier ${nextTier} (${nextTierLabel} monthly search volume)`);
    console.log('');
    printInfo('Do NOT target next tier keywords until you consistently exceed current tier threshold');
  } else {
    printSuccess('You are at the maximum tier! Target any keyword volume that makes sense.');
  }

  console.log('');
  printSection('Next Steps');
  console.log('  1. Find 30-45 KGR keywords in your current tier');
  console.log(`  2. Add them to data/keyword-queue.json with tier=${tier}`);
  console.log('  3. Publish 1-2 articles per day targeting these keywords');
  console.log('  4. Track rankings — should hit top 20 within 2 weeks');
  console.log('  5. Once average daily traffic exceeds current tier, move to next tier');
  console.log('');

  // Show daily breakdown if verbose
  if (verbose) {
    printSection('Daily Breakdown (last 30 days)');
    const recentDates = dates.slice(-30);
    for (const date of recentDates) {
      console.log(`  ${date}: ${dailyTraffic[date]} clicks`);
    }
    console.log('');
  }

  // Export summary JSON
  const summary = {
    calculatedAt: formatDate(),
    daysAnalyzed: clicks.length,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    traffic: {
      total: totalClicks,
      average: avgDailyClicks,
      min: minDailyClicks,
      max: maxDailyClicks,
    },
    tier: {
      current: tier,
      label: tierLabel,
      next: nextTier,
      nextLabel: nextTierLabel,
      clicksToNextTier: nextTier ? nextTier - avgDailyClicks : 0,
    },
    recommendations: {
      targetMonthlySearchVolume: `${tier}-${tier === 0 ? 10 : tier === 10 ? 20 : tier === 20 ? 50 : tier === 50 ? 100 : tier === 100 ? 200 : tier === 200 ? 500 : 1000}`,
      keywordsToFind: '30-45 KGR keywords',
      publishingRate: '1-2 articles per day',
      expectedRankingTime: '2 weeks to top 20',
    },
  };

  return summary;
}

// Run
const summary = await calculateTier();

// Save summary to file
import('fs').then(fs => {
  const outputPath = resolve(ROOT_DIR, 'data', 'tier-status.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');
  printInfo(`Tier status saved to: data/tier-status.json`);
});
