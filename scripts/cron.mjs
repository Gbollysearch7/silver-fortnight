#!/usr/bin/env node

/**
 * Autonomous Blog Cron Scheduler
 * Runs on Railway. Picks keywords from the queue and publishes blog posts.
 *
 * Schedule: Runs continuously, publishes 2 posts per day (8 AM and 2 PM UTC).
 * Queue: Reads from data/keyword-queue.json
 * Report: Sends weekly summary via Resend every Sunday.
 *
 * Usage:
 *   node scripts/cron.mjs                # Start the scheduler
 *   node scripts/cron.mjs --once         # Run one cycle and exit
 *   node scripts/cron.mjs --dry-run      # Preview without publishing
 *   node scripts/cron.mjs --staging      # Generate content but don't publish (staging mode)
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { ROOT_DIR, DATA_DIR, TRACKER_PATH } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, printWarning, readJsonFile, writeJsonFile, formatDate, formatDateShort, loadTracker } from '../lib/utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = parseArgs();

const QUEUE_PATH = resolve(DATA_DIR, 'keyword-queue.json');
const LOG_PATH = resolve(DATA_DIR, 'cron-log.json');
const POSTS_PER_DAY = 3;
const PUBLISH_HOURS_UTC = [8, 12, 16]; // 8 AM, 12 PM, and 4 PM UTC

printHeader('Blog Automation Cron');
printInfo(`Schedule: ${POSTS_PER_DAY} posts/day at ${PUBLISH_HOURS_UTC.join(', ')} UTC`);
printInfo(`Queue: ${QUEUE_PATH}`);

// --- Queue management ---

function loadQueue() {
  return readJsonFile(QUEUE_PATH) || { queue: [] };
}

function saveQueue(data) {
  writeJsonFile(QUEUE_PATH, data);
}

function getNextQueued() {
  const data = loadQueue();
  // Sort by priority (lower = higher priority), then by id
  // CRITICAL: Only pick keywords that have been AI-validated and approved
  const queued = data.queue
    .filter(item => {
      // Must be queued status
      if (item.status !== 'queued') return false;

      // Must be AI-validated and approved
      if (!item.ai_validated) return false;
      if (item.ai_validation_result !== 'APPROVE') return false;

      return true;
    })
    .sort((a, b) => (a.priority || 99) - (b.priority || 99) || a.id.localeCompare(b.id));
  return queued[0] || null;
}

function updateQueueItem(id, updates) {
  const data = loadQueue();
  const item = data.queue.find(i => i.id === id);
  if (item) {
    Object.assign(item, updates);
    saveQueue(data);
  }
}

// --- Cron log ---

function logEvent(event) {
  const log = readJsonFile(LOG_PATH) || { events: [] };
  log.events.push({ ...event, timestamp: formatDate() });
  // Keep last 500 events
  if (log.events.length > 500) log.events = log.events.slice(-500);
  writeJsonFile(LOG_PATH, log);
}

// --- Process one keyword ---

async function processKeyword(item, dryRun = false, stagingMode = false) {
  const startTime = Date.now();
  printSection(`Processing: ${item.keyword}`);
  printInfo(`Title: ${item.title}`);
  printInfo(`Template: ${item.template}`);
  printInfo(`Category: ${item.category}`);
  if (stagingMode) printWarning('STAGING MODE: Will generate but NOT publish');

  // Mark as generating
  updateQueueItem(item.id, { status: 'generating', startedAt: formatDate() });

  try {
    // Step 1: Generate the draft
    printInfo('Step 1/4: Generating draft...');
    const genArgs = [
      resolve(__dirname, 'generate.mjs'),
      '--topic', item.title,
      '--template', item.template || 'how-to',
      '--keyword', item.keyword,
      '--category', item.category || 'trading-education',
    ];

    if (!dryRun) {
      execFileSync('node', genArgs, {
        encoding: 'utf-8',
        cwd: ROOT_DIR,
        timeout: 180000,
        env: process.env,
      });
      printSuccess('Draft generated');
    } else {
      printInfo('[DRY RUN] Would generate draft');
    }

    // Determine the slug
    const slug = item.title
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    const draftPath = resolve(ROOT_DIR, 'content', 'drafts', `${slug}.md`);

    // Step 2: Generate thumbnail
    printInfo('Step 2/4: Generating thumbnail...');
    if (!dryRun) {
      try {
        execFileSync('node', [
          resolve(__dirname, 'thumbnail.mjs'),
          '--file', draftPath,
        ], {
          encoding: 'utf-8',
          cwd: ROOT_DIR,
          timeout: 60000,
          env: process.env,
        });
        printSuccess('Thumbnail generated');
      } catch (thumbErr) {
        printWarning(`Thumbnail failed (non-blocking): ${thumbErr.message.slice(0, 100)}`);
      }
    } else {
      printInfo('[DRY RUN] Would generate thumbnail');
    }

    // Step 3: SEO check
    printInfo('Step 3/4: Running SEO check...');
    if (!dryRun) {
      try {
        execFileSync('node', [
          resolve(__dirname, 'seo-check.mjs'),
          '--file', draftPath,
          '--update',
        ], {
          encoding: 'utf-8',
          cwd: ROOT_DIR,
          timeout: 30000,
          env: process.env,
        });
        printSuccess('SEO check complete');
      } catch (seoErr) {
        printWarning(`SEO check warning: ${seoErr.message.slice(0, 100)}`);
      }
    } else {
      printInfo('[DRY RUN] Would run SEO check');
    }

    // Step 4: Publish to Webflow (skip in staging mode)
    if (!stagingMode) {
      printInfo('Step 4/4: Publishing to Webflow...');
      if (!dryRun) {
        execFileSync('node', [
          resolve(__dirname, 'publish.mjs'),
          '--file', draftPath,
          '--live',
        ], {
          encoding: 'utf-8',
          cwd: ROOT_DIR,
          timeout: 60000,
          env: process.env,
        });
        printSuccess('Published to Webflow');
      } else {
        printInfo('[DRY RUN] Would publish to Webflow');
      }

      // Step 5: Submit for indexing
      if (!dryRun) {
        try {
          execFileSync('node', [
            resolve(__dirname, 'index.mjs'),
            '--url', `https://tradersyard.com/blog/${slug}`,
          ], {
            encoding: 'utf-8',
            cwd: ROOT_DIR,
            timeout: 30000,
            env: process.env,
          });
          printSuccess('Submitted for indexing');
        } catch (indexErr) {
          printWarning(`Indexing warning: ${indexErr.message.slice(0, 100)}`);
        }
      }
    } else {
      printInfo('[STAGING] Skipping Webflow publish and indexing');
      printSuccess('Content ready in content/approved/ for future publishing');
    }

    // Mark as published (or staged)
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const finalStatus = stagingMode ? 'staged' : 'published';
    updateQueueItem(item.id, {
      status: finalStatus,
      slug,
      publishedAt: stagingMode ? null : formatDate(),
      stagedAt: stagingMode ? formatDate() : null,
      duration: `${duration}s`,
    });

    logEvent({
      type: stagingMode ? 'staged' : 'published',
      keyword: item.keyword,
      slug,
      duration: `${duration}s`,
    });

    if (stagingMode) {
      printSuccess(`Done in ${duration}s: STAGED at content/approved/${slug}.md`);
    } else {
      printSuccess(`Done in ${duration}s: https://tradersyard.com/blog/${slug}`);
    }
    return { success: true, slug };

  } catch (err) {
    printError(`Failed: ${err.message}`);
    updateQueueItem(item.id, {
      status: 'failed',
      error: err.message.slice(0, 200),
      failedAt: formatDate(),
    });

    logEvent({
      type: 'failed',
      keyword: item.keyword,
      error: err.message.slice(0, 200),
    });

    return { success: false, error: err.message };
  }
}

// --- Scheduler loop ---

async function runOnce(dryRun, stagingMode = false) {
  const item = getNextQueued();
  if (!item) {
    printInfo('No keywords in queue. Add more to data/keyword-queue.json');
    return false;
  }
  await processKeyword(item, dryRun, stagingMode);
  return true;
}

async function shouldPublishNow() {
  const now = new Date();
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Check if we're within 5 minutes of a publish hour
  for (const pubHour of PUBLISH_HOURS_UTC) {
    if (hour === pubHour && minute < 5) {
      return true;
    }
  }
  return false;
}

async function hasPublishedToday() {
  const log = readJsonFile(LOG_PATH) || { events: [] };
  const today = formatDateShort();
  const todayPublishes = log.events.filter(
    e => e.type === 'published' && e.timestamp.startsWith(today)
  );
  return todayPublishes.length;
}

async function shouldSendWeeklyReport() {
  const now = new Date();
  // Sunday at 18:00 UTC
  return now.getUTCDay() === 0 && now.getUTCHours() === 18 && now.getUTCMinutes() < 5;
}

// --- Main ---

const stagingMode = args.staging || false;

if (stagingMode) {
  printWarning('=== STAGING MODE ENABLED ===');
  printWarning('Content will be generated but NOT published to Webflow');
  printWarning('Files saved to content/approved/ ready for future bulk publish');
  console.log('');
}

if (args.once) {
  // Single run mode
  printInfo('Running one cycle...');
  await runOnce(args['dry-run'], stagingMode);
  process.exit(0);
}

// Continuous scheduler mode (for Railway)
printInfo('Starting continuous scheduler...');
printInfo('Checking every 5 minutes for publish windows\n');

async function tick() {
  try {
    const todayCount = await hasPublishedToday();

    if (todayCount >= POSTS_PER_DAY) {
      // Already published enough today
      return;
    }

    if (await shouldPublishNow()) {
      printInfo(`Publish window detected. Published today: ${todayCount}/${POSTS_PER_DAY}`);
      await runOnce(args['dry-run'], stagingMode);
    }

    // Weekly report check
    if (await shouldSendWeeklyReport()) {
      printInfo('Sending weekly report...');
      try {
        execFileSync('node', [resolve(__dirname, 'report.mjs')], {
          encoding: 'utf-8',
          cwd: ROOT_DIR,
          timeout: 30000,
          env: process.env,
        });
        printSuccess('Weekly report sent');
      } catch (reportErr) {
        printWarning(`Report failed: ${reportErr.message.slice(0, 100)}`);
      }
    }
  } catch (err) {
    printError(`Tick error: ${err.message}`);
  }
}

// Run immediately on start, then every 5 minutes
await tick();
setInterval(tick, 5 * 60 * 1000);

// Keep process alive
printInfo('Scheduler running. Press Ctrl+C to stop.');
