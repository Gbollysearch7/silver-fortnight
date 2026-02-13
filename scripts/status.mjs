#!/usr/bin/env node

/**
 * Blog Status Dashboard
 * Shows the current state of all blog posts across the pipeline.
 *
 * Usage:
 *   node scripts/status.mjs
 *   node scripts/status.mjs --verbose
 */

import { existsSync, readdirSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import {
  DRAFTS_DIR, REVIEW_DIR, APPROVED_DIR, PUBLISHED_DIR, CALENDAR_DIR, TRACKER_PATH, blogConfig,
} from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printInfo, printTable, loadTracker, formatDateShort } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';

const args = parseArgs();

printHeader('Blog Status Dashboard');

// --- Count files in each directory ---
const dirs = {
  drafts: DRAFTS_DIR,
  review: REVIEW_DIR,
  approved: APPROVED_DIR,
  published: PUBLISHED_DIR,
};

const counts = {};
for (const [name, dir] of Object.entries(dirs)) {
  if (existsSync(dir)) {
    counts[name] = readdirSync(dir).filter(f => f.endsWith('.md')).length;
  } else {
    counts[name] = 0;
  }
}

const total = Object.values(counts).reduce((a, b) => a + b, 0);

printSection('Pipeline Overview');
console.log(`  Total posts: ${total}`);
console.log(`  Drafts:      ${counts.drafts}`);
console.log(`  In review:   ${counts.review}`);
console.log(`  Approved:    ${counts.approved}`);
console.log(`  Published:   ${counts.published}`);

// --- Recent activity ---
printSection('Recent Drafts');
if (counts.drafts > 0) {
  const files = readdirSync(DRAFTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const filePath = resolve(DRAFTS_DIR, f);
      const stat = statSync(filePath);
      let title = f.replace('.md', '');
      let seoScore = '-';
      try {
        const { frontmatter } = parseFile(filePath);
        title = frontmatter.title || title;
        seoScore = frontmatter.seo_score || '-';
      } catch {}
      return [title.slice(0, 45), seoScore, stat.mtime.toISOString().slice(0, 10)];
    });

  printTable(['Title', 'SEO', 'Modified'], files.slice(0, 10));
} else {
  printInfo('No drafts');
}

// --- Published posts with performance ---
printSection('Published Posts');
const tracker = loadTracker(TRACKER_PATH);
const publishedPosts = Object.values(tracker.posts)
  .filter(p => p.status === 'published' || p.webflowPublished)
  .sort((a, b) => (b.gscClicks || 0) - (a.gscClicks || 0));

if (publishedPosts.length > 0) {
  const rows = publishedPosts.slice(0, 15).map(p => [
    (p.title || p.slug || '').slice(0, 35),
    p.seoScore || '-',
    p.gscClicks ?? '-',
    p.gscImpressions ?? '-',
    p.gscCtr ? `${p.gscCtr}%` : '-',
    p.gscPosition ?? '-',
  ]);

  printTable(
    ['Title', 'SEO', 'Clicks', 'Impressions', 'CTR', 'Position'],
    rows,
  );
} else {
  printInfo('No published posts with performance data');
}

// --- Upcoming calendar ---
printSection('Upcoming Calendar');
if (existsSync(CALENDAR_DIR)) {
  const today = formatDateShort();
  const calFiles = readdirSync(CALENDAR_DIR).filter(f => f.endsWith('.json')).sort();
  const upcoming = [];

  for (const file of calFiles) {
    try {
      const { readFileSync } = await import('fs');
      const cal = JSON.parse(readFileSync(resolve(CALENDAR_DIR, file), 'utf-8'));
      for (const entry of (cal.entries || [])) {
        if (entry.targetDate >= today && entry.status !== 'published' && entry.status !== 'cancelled') {
          upcoming.push(entry);
        }
      }
    } catch {}
  }

  upcoming.sort((a, b) => a.targetDate.localeCompare(b.targetDate));

  if (upcoming.length > 0) {
    const rows = upcoming.slice(0, 10).map(e => [
      e.targetDate,
      e.title.slice(0, 35),
      e.keyword?.slice(0, 20) || '-',
      e.priority,
      e.status,
    ]);
    printTable(['Date', 'Title', 'Keyword', 'Priority', 'Status'], rows);
  } else {
    printInfo('No upcoming calendar items');
  }
} else {
  printInfo('No calendar data');
}

// --- Verbose mode: full tracker dump ---
if (args.verbose) {
  printSection('Full Tracker Data');
  const allPosts = Object.values(tracker.posts);
  if (allPosts.length > 0) {
    for (const post of allPosts) {
      console.log(`\n  ${post.title || post.slug}`);
      for (const [key, val] of Object.entries(post)) {
        if (key !== 'title') console.log(`    ${key}: ${val}`);
      }
    }
  } else {
    printInfo('Tracker is empty');
  }
}

console.log('');
