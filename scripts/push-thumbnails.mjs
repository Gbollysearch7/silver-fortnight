#!/usr/bin/env node

/**
 * Push rendered thumbnails to live Webflow posts' feature-image field.
 *
 * Images are served from the committed repo via jsDelivr CDN:
 *   https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/output/thumbnails-html/<slug>.jpg
 *
 * Matches a local thumbnail to a live Webflow item by BASE slug (Webflow slugs
 * carry a random suffix, e.g. "my-post-522af"), then sets feature-image.
 *
 * Usage:
 *   node scripts/push-thumbnails.mjs --dry-run            # show planned changes, no writes
 *   node scripts/push-thumbnails.mjs --slug <baseSlug>    # update ONE post (test)
 *   node scripts/push-thumbnails.mjs --all                # update all matched posts
 *   node scripts/push-thumbnails.mjs --all --overwrite    # also replace existing images
 */

import { existsSync, readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { ROOT_DIR } from '../lib/config.mjs';
import { listItems, updateItem } from '../lib/webflow.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo } from '../lib/utils.mjs';

const args = parseArgs();
const THUMB_DIR = resolve(ROOT_DIR, 'output', 'thumbnails-html');

const GH_OWNER = 'Gbollysearch7';
const GH_REPO = 'silver-fortnight';
const GH_BRANCH = 'main';
const cdnUrl = (slug) => `https://cdn.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/output/thumbnails-html/${slug}.jpg`;

// local thumbnails (base slugs)
const localSlugs = readdirSync(THUMB_DIR).filter(f => f.endsWith('.jpg')).map(f => basename(f, '.jpg'));

// Webflow item slugs carry a random "-xxxxx" suffix; strip it for matching.
function baseSlug(s = '') { return s.replace(/-[a-z0-9]{4,6}$/i, ''); }

printHeader('Push Thumbnails → Webflow');
printInfo(`Local thumbnails: ${localSlugs.length} | CDN: jsDelivr @ ${GH_BRANCH}\n`);

// Fetch all live items (paginate)
let items = [];
for (let offset = 0; ; offset += 100) {
  const { items: page } = await listItems({ limit: 100, offset });
  items.push(...page);
  if (!page || page.length < 100) break;
}
printInfo(`Live Webflow items: ${items.length}\n`);

// Build a match map: baseSlug -> webflow item
const byBase = new Map();
for (const it of items) {
  const wfSlug = it.fieldData?.slug || '';
  byBase.set(baseSlug(wfSlug), it);
  byBase.set(wfSlug, it); // also exact, in case no suffix
}

// Decide targets
let targets = localSlugs;
if (args.slug) targets = localSlugs.filter(s => s === args.slug);
if (!args.slug && !args.all && !args['dry-run']) {
  printError('Specify --slug <baseSlug> (single test), --all, or --dry-run');
  process.exit(1);
}

let matched = 0, updated = 0, skipped = 0, missing = 0, failed = 0;
for (const slug of targets) {
  const item = byBase.get(slug);
  if (!item) {
    printInfo(`· no live match: ${slug}`);
    missing++;
    continue;
  }
  matched++;
  const url = cdnUrl(slug);
  const existing = item.fieldData['feature-image'];
  const hasImage = existing && existing.url;

  if (hasImage && !args.overwrite) {
    printInfo(`· skip (has image): ${item.fieldData.slug}`);
    skipped++;
    continue;
  }

  if (args['dry-run']) {
    printSuccess(`WOULD set: ${item.fieldData.slug}\n    → ${url}`);
    continue;
  }

  try {
    await updateItem(item.id, {
      'feature-image': { url, alt: `${item.fieldData.name || slug} — TradersYard` },
    });
    printSuccess(`updated: ${item.fieldData.slug}`);
    updated++;
  } catch (err) {
    printError(`failed ${item.fieldData.slug}: ${err.message}`);
    failed++;
  }
  await new Promise(r => setTimeout(r, 600)); // rate-limit courtesy
}

printSection('Summary');
printInfo(`Matched: ${matched} | Updated: ${updated} | Skipped(existing): ${skipped} | No match: ${missing}`);
if (failed) printError(`Failed: ${failed}`);
if (args['dry-run']) printInfo('DRY RUN — no live changes made.');
console.log('');
