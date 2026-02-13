#!/usr/bin/env node

/**
 * Webflow CMS Publisher
 * Converts markdown to styled HTML and publishes to Webflow CMS.
 *
 * Usage:
 *   node scripts/publish.mjs --file content/approved/slug.md
 *   node scripts/publish.mjs --file content/approved/slug.md --live
 *   node scripts/publish.mjs --file content/approved/slug.md --dry-run
 *   node scripts/publish.mjs --list-fields
 */

import { existsSync, renameSync, writeFileSync } from 'fs';
import { resolve, basename } from 'path';
import {
  PUBLISHED_DIR, HTML_DIR, TRACKER_PATH, OUTPUT_DIR,
} from '../lib/config.mjs';
import { parseArgs, formatDate, printHeader, printSection, printSuccess, printError, printWarning, printInfo, ensureDir, updateTrackerPost } from '../lib/utils.mjs';
import { parseFile, updateFrontmatter, toHtml, extractHeadings } from '../lib/markdown.mjs';
import { styleForWebflow } from '../lib/html-styler.mjs';
import { createItem, updateItem, publishItems, getCollectionFields, buildFieldData, uploadAsset } from '../lib/webflow.mjs';

const args = parseArgs();

if (!args.file && !args['list-fields'] && !args['all-approved']) {
  console.log('Usage: node scripts/publish.mjs --file <path> [options]');
  console.log('\nTargets:');
  console.log('  --file <path>      Publish a specific markdown file');
  console.log('  --all-approved     Publish all files in content/approved/');
  console.log('  --list-fields      List Webflow collection fields');
  console.log('\nOptions:');
  console.log('  --live             Publish live immediately (default: draft)');
  console.log('  --dry-run          Generate HTML without calling Webflow API');
  console.log('  --update           Update existing Webflow item instead of creating');
  console.log('  --no-move          Don\'t move file to published/ after success');
  process.exit(0);
}

printHeader('Webflow Publisher');

// List fields mode
if (args['list-fields']) {
  printSection('Collection Fields');
  try {
    const collection = await getCollectionFields();
    console.log(`  Collection: ${collection.displayName}`);
    console.log(`  Slug: ${collection.slug}`);
    console.log(`  ID: ${collection.id}\n`);
    for (const field of (collection.fields || [])) {
      console.log(`  ${field.slug.padEnd(25)} ${field.type.padEnd(15)} ${field.isRequired ? '(required)' : ''}`);
    }
  } catch (err) {
    printError(`Failed to fetch fields: ${err.message}`);
  }
  process.exit(0);
}

// Gather files
const files = [];
if (args.file) {
  const filePath = resolve(args.file);
  if (!existsSync(filePath)) {
    printError(`File not found: ${filePath}`);
    process.exit(1);
  }
  files.push(filePath);
} else if (args['all-approved']) {
  const { readdirSync } = await import('fs');
  const approvedDir = resolve('content/approved');
  if (existsSync(approvedDir)) {
    const mdFiles = readdirSync(approvedDir).filter(f => f.endsWith('.md'));
    for (const f of mdFiles) files.push(resolve(approvedDir, f));
  }
}

if (files.length === 0) {
  printWarning('No files to publish');
  process.exit(0);
}

let published = 0;
let failed = 0;

for (const filePath of files) {
  const slug = basename(filePath, '.md');
  printSection(`Publishing: ${slug}`);

  try {
    // Parse markdown
    const { frontmatter, content } = parseFile(filePath);
    printInfo(`Title: ${frontmatter.title}`);
    printInfo(`Words: ${content.split(/\s+/).length}`);

    // Convert to HTML
    const rawHtml = toHtml(content);
    const headings = extractHeadings(content);
    const styledHtml = styleForWebflow(rawHtml, frontmatter, headings);

    // Upload thumbnail to Webflow if exists
    let thumbnailUrl = null;
    const thumbnailPath = resolve(OUTPUT_DIR, 'thumbnails', `${slug}.png`);
    if (existsSync(thumbnailPath)) {
      printInfo('Uploading thumbnail to Webflow...');
      try {
        thumbnailUrl = await uploadAsset(thumbnailPath, `${slug}-thumbnail.png`);
        printSuccess(`Thumbnail uploaded: ${thumbnailUrl}`);
      } catch (err) {
        printWarning(`Thumbnail upload failed: ${err.message}`);
      }
    }

    // Save HTML payload
    ensureDir(HTML_DIR);
    const payload = buildFieldData(frontmatter, styledHtml, thumbnailUrl);
    const payloadPath = resolve(HTML_DIR, `${slug}.json`);
    writeFileSync(payloadPath, JSON.stringify({ fieldData: payload }, null, 2), 'utf-8');
    printSuccess(`HTML payload saved: ${payloadPath}`);

    // Dry run stops here
    if (args['dry-run']) {
      printInfo('Dry run - skipping Webflow API call');
      continue;
    }

    // Publish to Webflow
    let itemId = frontmatter.webflow_item_id;
    let result;

    if (itemId && args.update) {
      // Update existing item
      printInfo(`Updating existing item: ${itemId}`);
      result = await updateItem(itemId, payload);
      printSuccess('Webflow item updated');
    } else {
      // Create new item
      const isDraft = !args.live;
      printInfo(`Creating ${isDraft ? 'draft' : 'live'} item...`);
      result = await createItem(payload, { isDraft });
      itemId = result.id;
      printSuccess(`Webflow item created: ${itemId}`);

      // Publish if --live
      if (args.live) {
        await publishItems([itemId]);
        printSuccess('Item published live');
      }
    }

    // Update frontmatter
    const now = formatDate();
    updateFrontmatter(filePath, {
      webflow_item_id: itemId,
      webflow_published: !!args.live,
      published_at: args.live ? now : frontmatter.published_at,
      updated_at: now,
      status: args.live ? 'published' : 'approved',
    });

    // Move to published directory
    if (args.live && !args['no-move']) {
      ensureDir(PUBLISHED_DIR);
      const destPath = resolve(PUBLISHED_DIR, `${slug}.md`);
      renameSync(filePath, destPath);
      printSuccess(`Moved to: ${destPath}`);
    }

    // Update tracker
    updateTrackerPost(TRACKER_PATH, slug, {
      status: args.live ? 'published' : 'approved',
      webflowItemId: itemId,
      webflowPublished: !!args.live,
      publishedAt: args.live ? now : null,
      updatedAt: now,
    });

    published++;
    console.log(`\n  URL: https://tradersyard.com/blog/${slug}`);
  } catch (err) {
    printError(`Failed to publish ${slug}: ${err.message}`);
    failed++;
  }
}

// Summary
printSection('Summary');
printInfo(`Published: ${published}`);
if (failed > 0) printError(`Failed: ${failed}`);
console.log('');
