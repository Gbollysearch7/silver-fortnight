#!/usr/bin/env node

/**
 * Generate Redirect CSV for Blog Migration
 * Fetches all blog posts from Webflow CMS and creates a CSV for Cloudflare bulk redirects.
 *
 * Usage:
 *   node scripts/generate-redirect-csv.mjs
 *   node scripts/generate-redirect-csv.mjs --output redirects.csv
 */

import { resolve } from 'path';
import { WEBFLOW_API_KEY, ROOT_DIR, blogConfig } from '../lib/config.mjs';
import { parseArgs, printHeader, printSuccess, printInfo, printError } from '../lib/utils.mjs';

const args = parseArgs();
const outputPath = args.output || resolve(ROOT_DIR, 'data', 'blog-redirects.csv');

printHeader('Generate Blog Redirect CSV');

if (!WEBFLOW_API_KEY) {
  printError('WEBFLOW_API_KEY not set in .env');
  process.exit(1);
}

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';
const COLLECTION_ID = blogConfig.webflow.blogCollectionId;

printInfo('Fetching blog posts from Webflow...');
printInfo(`Collection ID: ${COLLECTION_ID}`);

async function fetchAllBlogPosts() {
  const posts = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      const res = await fetch(
        `${WEBFLOW_API_BASE}/collections/${COLLECTION_ID}/items?offset=${offset}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${WEBFLOW_API_KEY}`,
          },
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Webflow API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const items = data.items || [];

      posts.push(...items);

      printInfo(`Fetched ${posts.length} posts...`);

      // Check if there are more pages
      if (items.length < limit) {
        break;
      }

      offset += limit;
    } catch (err) {
      printError(`Failed to fetch posts: ${err.message}`);
      process.exit(1);
    }
  }

  return posts;
}

async function generateRedirectCSV() {
  const posts = await fetchAllBlogPosts();

  if (posts.length === 0) {
    printInfo('No blog posts found');
    process.exit(0);
  }

  printSuccess(`Found ${posts.length} blog posts`);
  printInfo('Generating redirect mappings...');

  // CSV header
  let csv = 'Source URL,Destination URL,Status Code,Notes\n';

  // Generate redirect rows
  for (const post of posts) {
    const slug = post.fieldData?.slug || post.slug;

    if (!slug) {
      console.warn(`Warning: Post "${post.fieldData?.name || 'Unknown'}" has no slug, skipping`);
      continue;
    }

    // Old URL (subdomain)
    const oldUrl = `https://blog.tradersyard.com/${slug}`;

    // New URL (subdirectory)
    const newUrl = `https://tradersyard.com/blog/${slug}`;

    // Status code (301 = permanent redirect)
    const statusCode = '301';

    // Notes (post title for reference)
    const notes = post.fieldData?.name || post.name || '';

    // Escape commas in notes
    const escapedNotes = notes.replace(/"/g, '""');

    csv += `"${oldUrl}","${newUrl}",${statusCode},"${escapedNotes}"\n`;
  }

  // Add homepage redirect
  csv += `"https://blog.tradersyard.com","https://tradersyard.com/blog",301,"Blog homepage"\n`;

  // Add blog index/archive redirect
  csv += `"https://blog.tradersyard.com/blog","https://tradersyard.com/blog",301,"Blog archive"\n`;

  // Write CSV file
  import('fs').then(fs => {
    fs.writeFileSync(outputPath, csv, 'utf-8');

    printSuccess(`Redirect CSV generated: ${outputPath}`);
    printInfo(`Total redirects: ${posts.length + 2}`);
    console.log('');
    printInfo('Next steps:');
    console.log('  1. Review the CSV file for accuracy');
    console.log('  2. Go to Cloudflare dashboard');
    console.log('  3. Navigate to: Rules → Redirect Rules → Bulk Redirects');
    console.log('  4. Create new list → Upload CSV');
    console.log('  5. Create redirect rule using the list');
    console.log('');
    printInfo('Note: Keep redirects permanent (never delete them)');
  });
}

generateRedirectCSV();
