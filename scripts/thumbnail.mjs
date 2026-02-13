#!/usr/bin/env node

/**
 * Blog Thumbnail Generator
 * Generates professional blog thumbnails using fal.ai Ideogram v3.
 *
 * Style: Professional fintech/trading, dark navy + electric blue (#4250EB)
 * Format: 16:9 landscape (1200x630 for OG images)
 * Model: Ideogram v3 via fal.ai
 *
 * Usage:
 *   node scripts/thumbnail.mjs --file content/drafts/slug.md
 *   node scripts/thumbnail.mjs --slug "best-prop-firms" --title "Best Prop Firms"
 *   node scripts/thumbnail.mjs --all-missing
 */

import { existsSync, createWriteStream, readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { get as httpsGet } from 'https';
import { ROOT_DIR, FAL_KEY, TRACKER_PATH, DRAFTS_DIR, PUBLISHED_DIR, APPROVED_DIR, REVIEW_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, ensureDir, updateTrackerPost, formatDate } from '../lib/utils.mjs';
import { parseFile, updateFrontmatter } from '../lib/markdown.mjs';

const args = parseArgs();
const THUMBNAILS_DIR = resolve(ROOT_DIR, 'output', 'thumbnails');

if (!args.file && !args.slug && !args['all-missing']) {
  console.log('Usage: node scripts/thumbnail.mjs [options]');
  console.log('\nTargets:');
  console.log('  --file <path>      Generate thumbnail for a blog post file');
  console.log('  --slug <slug>      Slug to use for the filename');
  console.log('  --title <title>    Title for prompt generation (with --slug)');
  console.log('  --all-missing      Generate for all posts without thumbnails');
  console.log('\nOptions:');
  console.log('  --prompt <text>    Custom prompt (overrides auto-generated)');
  console.log('  --theme <type>     Theme: guide, comparison, technical, feature, story');
  console.log('  --dry-run          Show the prompt without generating');
  process.exit(0);
}

if (!FAL_KEY) {
  printError('FAL_KEY not set in .env');
  process.exit(1);
}

printHeader('Thumbnail Generator');
printInfo('Model: Ideogram v3 | Format: 16:9 (1200x630)');
printInfo('Cost: ~$0.04 per image\n');

ensureDir(THUMBNAILS_DIR);

// --- Prompt builder ---

const THEME_ELEMENTS = {
  guide: 'glowing open book icon with light rays, step-by-step pathway visualization',
  comparison: 'glowing podium with 3D trophy icon, side-by-side comparison layout',
  technical: 'high-speed data streams and gear icons, circuit board patterns',
  feature: 'spotlight on a glowing feature card, product showcase',
  story: 'silhouette of a person at a trading desk, success chart going up',
  education: 'graduation cap with trading chart, lightbulb icon glowing',
  country: 'world map with highlighted country, flag elements, global trading network',
  list: 'numbered ranking podium, stars and badges, leaderboard visualization',
};

function buildPrompt(title, theme = 'guide') {
  const themeElement = THEME_ELEMENTS[theme] || THEME_ELEMENTS.guide;

  // Extract short display text for the image (max ~4 words)
  const shortTitle = title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\d{4}/g, '')
    .replace(/[:|–—]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 5)
    .join(' ')
    .trim();

  return [
    'Professional dark fintech blog thumbnail,',
    themeElement + ',',
    'trading charts in electric blue (#4250EB) glow,',
    'modern minimalist tech style,',
    'dark navy background (#0F172A),',
    `clean white text "${shortTitle}" centered,`,
    'no clutter, no stock photo feel,',
    '16:9 aspect ratio, 4K quality, ultra sharp',
  ].join(' ');
}

function detectTheme(frontmatter, content) {
  const title = (frontmatter.title || '').toLowerCase();
  const category = (frontmatter.category || '').toLowerCase();
  const template = (frontmatter.template || '').toLowerCase();

  if (template === 'comparison' || title.includes(' vs ')) return 'comparison';
  if (template === 'listicle' || title.includes('best ') || title.includes('top ')) return 'list';
  if (template === 'success-story') return 'story';
  if (category.includes('country') || /\bin [a-z]+(?!\s*\d)/.test(title)) return 'country';
  if (title.includes('how to') || template === 'how-to') return 'guide';
  if (title.includes('what is') || category.includes('education')) return 'education';
  return 'guide';
}

// --- fal.ai Ideogram v3 API ---

async function generateImage(prompt) {
  const res = await fetch('https://fal.run/fal-ai/ideogram/v3', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '16:9',
      style: 'AUTO',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  if (data.images && data.images[0]) {
    return data.images[0].url;
  }
  throw new Error('No image returned from fal.ai');
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const download = (downloadUrl) => {
      httpsGet(downloadUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          download(response.headers.location);
          return;
        }
        const file = createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    };
    download(url);
  });
}

// --- Gather files to process ---

const jobs = [];

if (args.file) {
  const filePath = resolve(args.file);
  if (!existsSync(filePath)) {
    printError(`File not found: ${filePath}`);
    process.exit(1);
  }
  const { frontmatter, content } = parseFile(filePath);
  const slug = frontmatter.slug || basename(filePath, '.md');
  const theme = args.theme || detectTheme(frontmatter, content);
  const prompt = args.prompt || buildPrompt(frontmatter.title || slug, theme);

  jobs.push({ slug, title: frontmatter.title, theme, prompt, filePath });

} else if (args.slug) {
  const slug = args.slug;
  const title = args.title || slug.replace(/-/g, ' ');
  const theme = args.theme || 'guide';
  const prompt = args.prompt || buildPrompt(title, theme);

  jobs.push({ slug, title, theme, prompt, filePath: null });

} else if (args['all-missing']) {
  // Find all posts without thumbnails
  const dirs = [DRAFTS_DIR, REVIEW_DIR, APPROVED_DIR, PUBLISHED_DIR];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const filePath = resolve(dir, file);
      const { frontmatter, content } = parseFile(filePath);
      const slug = frontmatter.slug || basename(file, '.md');

      // Check if thumbnail already exists
      const thumbPath = resolve(THUMBNAILS_DIR, `${slug}.png`);
      if (existsSync(thumbPath)) continue;

      // Check if featured image URL is already set
      if (frontmatter.featured_image?.url) continue;

      const theme = detectTheme(frontmatter, content);
      const prompt = buildPrompt(frontmatter.title || slug, theme);
      jobs.push({ slug, title: frontmatter.title, theme, prompt, filePath });
    }
  }
}

if (jobs.length === 0) {
  printInfo('No thumbnails to generate');
  process.exit(0);
}

const cost = (jobs.length * 0.04).toFixed(2);
printInfo(`Generating ${jobs.length} thumbnail(s) (~$${cost})\n`);

// --- Generate thumbnails ---

let success = 0;
let failed = 0;

for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  printSection(`[${i + 1}/${jobs.length}] ${job.slug}`);
  printInfo(`Title: ${job.title}`);
  printInfo(`Theme: ${job.theme}`);
  printInfo(`Prompt: ${job.prompt.slice(0, 100)}...`);

  if (args['dry-run']) {
    console.log(`\n  Full prompt:\n  ${job.prompt}\n`);
    continue;
  }

  try {
    const start = Date.now();
    const imageUrl = await generateImage(job.prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    const thumbPath = resolve(THUMBNAILS_DIR, `${job.slug}.png`);
    await downloadImage(imageUrl, thumbPath);

    printSuccess(`Generated in ${duration}s: ${thumbPath}`);

    // Update frontmatter if we have a file
    if (job.filePath) {
      updateFrontmatter(job.filePath, {
        featured_image: {
          url: thumbPath,
          alt: `${job.title} - TradersYard`,
        },
        updated_at: formatDate(),
      });
    }

    // Update tracker
    updateTrackerPost(TRACKER_PATH, job.slug, {
      thumbnailPath: thumbPath,
      thumbnailGeneratedAt: formatDate(),
    });

    success++;
  } catch (err) {
    printError(`Failed: ${err.message}`);
    failed++;
  }

  // Rate limit: small delay between requests
  if (i < jobs.length - 1) {
    await new Promise(r => setTimeout(r, 500));
  }
}

// Summary
printSection('Summary');
printInfo(`Generated: ${success}/${jobs.length}`);
if (failed > 0) printError(`Failed: ${failed}`);
printInfo(`Output: ${THUMBNAILS_DIR}`);
printInfo(`Cost: ~$${(success * 0.04).toFixed(2)}`);
console.log('');
