#!/usr/bin/env node

/**
 * Blog Thumbnail Generator
 * Generates stock-style trading/finance thumbnails using fal.ai Ideogram v3.
 *
 * Style: Photorealistic stock photography — traders, charts, desktops, phones
 * Format: 16:9 landscape
 * Model: Ideogram v3 via fal.ai (~$0.04/image)
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
printInfo('Model: Ideogram v3 | Format: 16:9 landscape');
printInfo('Cost: ~$0.04 per image\n');

ensureDir(THUMBNAILS_DIR);

// --- Prompt builder ---

const SCENE_POOL = {
  guide: [
    'Professional trader analyzing multiple monitor screens showing candlestick charts and technical indicators in a modern home office, warm desk lamp lighting, over-the-shoulder perspective',
    'Close-up of hands on a laptop keyboard with trading platform on screen showing green profit charts, coffee cup nearby, shallow depth of field',
    'Focused trader studying chart patterns on a widescreen monitor in a clean minimalist workspace, blue screen glow on face, professional photography',
  ],
  comparison: [
    'Split-screen dual monitor setup showing different trading platforms side by side, modern desk, clean workspace, editorial photography style',
    'Trader reviewing performance metrics on tablet while laptop shows trading dashboard in background, natural window light',
    'Two smartphones placed on a dark desk each showing different trading apps with charts, overhead flat lay photography',
  ],
  list: [
    'Modern trading desk setup with three monitors displaying financial charts and market data, ambient blue lighting, wide angle shot',
    'Row of professional trading workstations in a modern prop trading office, shallow depth of field, cinematic lighting',
    'Smartphone showing trading app with portfolio gains, held in hand against blurred city skyline background',
  ],
  story: [
    'Confident young trader smiling while looking at profitable trade on laptop screen, casual modern office, natural lighting portrait',
    'Trader celebrating with fist pump at desk with multiple screens showing green charts, authentic candid moment',
    'Person reviewing trading journal at a coffee shop with laptop showing charts, relaxed productive atmosphere',
  ],
  country: [
    'Trader working on laptop in a modern co-working space with city skyline visible through floor-to-ceiling windows, global trading feel',
    'Professional at a standing desk with multiple screens showing international market data, modern minimalist office',
  ],
  education: [
    'Notebook with handwritten trading notes next to a laptop showing candlestick chart tutorial, study desk setup, warm lighting',
    'Person taking notes while watching trading education content on a large monitor, organized desk with textbooks',
    'Clean desk with trading strategy flowchart on paper next to open laptop with charts, overhead shot, educational feel',
  ],
  technical: [
    'Close-up of trading screen showing detailed technical analysis with moving averages and RSI indicators, dark background, screen glow',
    'Multiple chart timeframes displayed on ultra-wide monitor with technical indicators highlighted, professional trading setup',
  ],
};

function buildPrompt(title, theme = 'guide') {
  const scenes = SCENE_POOL[theme] || SCENE_POOL.guide;
  const scene = scenes[Math.floor(Math.random() * scenes.length)];

  return `${scene}. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.`;
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
      num_images: 1,
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
          url: imageUrl, // Use fal.ai URL, not local path
          alt: `${job.title} - TradersYard`,
        },
        updated_at: formatDate(),
      });
    }

    // Update tracker
    updateTrackerPost(TRACKER_PATH, job.slug, {
      thumbnailPath: thumbPath, // Local path for reference
      thumbnailUrl: imageUrl, // fal.ai URL for Webflow
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
