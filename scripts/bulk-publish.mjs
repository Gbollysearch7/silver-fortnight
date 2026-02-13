#!/usr/bin/env node

/**
 * Bulk Publish Staged Content
 * Publishes all staged content from content/approved/ to Webflow after migration.
 *
 * Usage:
 *   node scripts/bulk-publish.mjs                    # Publish all staged content
 *   node scripts/bulk-publish.mjs --limit 10         # Publish first 10 only
 *   node scripts/bulk-publish.mjs --dry-run          # Preview without publishing
 *   node scripts/bulk-publish.mjs --filter staged    # Only items with status=staged
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { ROOT_DIR, DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, printWarning, readJsonFile, writeJsonFile, formatDate } from '../lib/utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = parseArgs();

const QUEUE_PATH = resolve(DATA_DIR, 'keyword-queue.json');
const APPROVED_DIR = resolve(ROOT_DIR, 'content', 'approved');

printHeader('Bulk Publish Staged Content');

// Load queue
function loadQueue() {
  return readJsonFile(QUEUE_PATH) || { queue: [] };
}

function saveQueue(data) {
  writeJsonFile(QUEUE_PATH, data);
}

function updateQueueItem(id, updates) {
  const data = loadQueue();
  const item = data.queue.find(i => i.id === id);
  if (item) {
    Object.assign(item, updates);
    saveQueue(data);
  }
}

// Get all staged items
function getStagedItems() {
  const data = loadQueue();
  const filterStatus = args.filter || 'staged';

  return data.queue
    .filter(item => item.status === filterStatus)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

// Get approved markdown files
function getApprovedFiles() {
  if (!existsSync(APPROVED_DIR)) {
    return [];
  }
  return readdirSync(APPROVED_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => resolve(APPROVED_DIR, f));
}

// Publish one item
async function publishItem(item, filePath, dryRun = false) {
  printSection(`Publishing: ${item.keyword}`);
  printInfo(`File: ${filePath}`);
  printInfo(`Title: ${item.title}`);

  const slug = item.slug || item.title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  try {
    // Step 1: Publish to Webflow
    if (!dryRun) {
      printInfo('Publishing to Webflow...');
      execFileSync('node', [
        resolve(__dirname, 'publish.mjs'),
        '--file', filePath,
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

    // Step 2: Submit for indexing
    if (!dryRun) {
      try {
        printInfo('Submitting to Google Indexing API...');
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
    } else {
      printInfo('[DRY RUN] Would submit to indexing');
    }

    // Update queue status
    if (!dryRun) {
      updateQueueItem(item.id, {
        status: 'published',
        publishedAt: formatDate(),
        bulkPublished: true,
      });
    }

    printSuccess(`✓ ${item.keyword}`);
    return { success: true, slug };
  } catch (err) {
    printError(`Failed: ${err.message}`);

    if (!dryRun) {
      updateQueueItem(item.id, {
        status: 'failed',
        error: err.message.slice(0, 200),
        failedAt: formatDate(),
      });
    }

    return { success: false, error: err.message };
  }
}

// Main
async function main() {
  const dryRun = args['dry-run'] || false;
  const limit = parseInt(args.limit || '999', 10);

  if (dryRun) {
    printWarning('DRY RUN MODE - No changes will be made\n');
  }

  // Get staged items
  const stagedItems = getStagedItems();
  const approvedFiles = getApprovedFiles();

  printInfo(`Found ${stagedItems.length} staged items in queue`);
  printInfo(`Found ${approvedFiles.length} files in content/approved/\n`);

  if (stagedItems.length === 0) {
    printWarning('No staged items to publish. Run with --filter to change status filter.');
    process.exit(0);
  }

  // Match queue items with files
  const toPublish = [];
  for (const item of stagedItems.slice(0, limit)) {
    const slug = item.slug || item.title
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    const filePath = resolve(APPROVED_DIR, `${slug}.md`);

    if (existsSync(filePath)) {
      toPublish.push({ item, filePath });
    } else {
      printWarning(`Missing file: ${slug}.md (skipping)`);
    }
  }

  printInfo(`Ready to publish: ${toPublish.length} items\n`);

  if (toPublish.length === 0) {
    printWarning('No files found to publish');
    process.exit(0);
  }

  // Confirm before bulk publish
  if (!dryRun && !args.yes) {
    printWarning('⚠️  This will publish all items to LIVE Webflow and Google Indexing API');
    printInfo('Run with --dry-run first to preview');
    printInfo('Run with --yes to skip this confirmation\n');
    process.exit(1);
  }

  // Publish each item
  const results = {
    success: [],
    failed: [],
  };

  for (let i = 0; i < toPublish.length; i++) {
    const { item, filePath } = toPublish[i];
    printInfo(`\n[${i + 1}/${toPublish.length}] Processing...`);

    const result = await publishItem(item, filePath, dryRun);

    if (result.success) {
      results.success.push(item.keyword);
    } else {
      results.failed.push({ keyword: item.keyword, error: result.error });
    }

    // Rate limiting: wait 2 seconds between publishes
    if (!dryRun && i < toPublish.length - 1) {
      printInfo('Waiting 2 seconds (rate limiting)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('');
  printSection('Bulk Publish Summary');
  printSuccess(`Successfully published: ${results.success.length}`);

  if (results.failed.length > 0) {
    printError(`Failed: ${results.failed.length}`);
    console.log('');
    console.log('Failed items:');
    for (const fail of results.failed) {
      console.log(`  - ${fail.keyword}: ${fail.error.slice(0, 100)}`);
    }
  }

  console.log('');
  if (!dryRun) {
    printSuccess('Bulk publish complete!');
    printInfo('Check blog tracker: data/blog-tracker.json');
    printInfo('Check Webflow CMS: https://webflow.com/dashboard/sites/67b4bd39747043c9b6d29c6b/cms/collections/67b4bd39747043c9b6d29c6e');
  }
}

main().catch(err => {
  printError(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
