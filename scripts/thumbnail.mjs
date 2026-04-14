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
import OpenAI from 'openai';
import { ROOT_DIR, FAL_KEY, TRACKER_PATH, DRAFTS_DIR, PUBLISHED_DIR, APPROVED_DIR, REVIEW_DIR } from '../lib/config.mjs';
import { config } from '../lib/config.mjs';
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

// --- AI-powered prompt builder ---

const openaiClient = config.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: config.env.OPENAI_API_KEY,
}) : null;

async function buildPromptWithAI(title) {
  if (!openaiClient) {
    // Fallback if no OpenAI key
    return `A creative, visually striking editorial photograph related to "${title}" in the finance and trading industry. Unique composition, cinematic lighting, professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.`;
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a creative director for a trading/finance blog. Generate a unique, vivid image prompt for a blog thumbnail.

Article title: "${title}"

Rules:
- Describe ONE specific, creative scene that visually represents this article's topic
- DO NOT default to "person staring at monitor screens" — be more creative and varied
- Use diverse compositions: overhead flat-lays, close-up details, conceptual still life, architectural shots, hands-on action shots, abstract financial concepts made visual
- Vary the setting: coffee shops, outdoor terraces, libraries, modern offices, home desks, co-working spaces, airports, city streets
- Include specific visual details: props, lighting direction, color palette, camera angle, depth of field
- Make each image feel DIFFERENT — avoid repetitive monitor-and-charts scenes
- Keep it to 2-3 sentences max
- End with: Professional editorial photography, sharp focus, high resolution, no text or watermarks, no logos.

Write ONLY the image prompt, nothing else.`
      }],
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.log(`  AI prompt generation failed, using fallback: ${err.message}`);
    return `A creative, visually striking editorial photograph related to "${title}" in the finance and trading industry. Unique composition, cinematic lighting, professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.`;
  }
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
      rendering_speed: 'SLOW',  // SLOW = highest quality at standard 1K resolution (not 4K)
      resolution: 'RESOLUTION_1024_576',  // 16:9 at 1K — fast upload, good quality, not 4K bloat
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
  const { frontmatter } = parseFile(filePath);
  const slug = frontmatter.slug || basename(filePath, '.md');
  const title = frontmatter.title || slug.replace(/-/g, ' ');
  const prompt = args.prompt || await buildPromptWithAI(title);

  jobs.push({ slug, title, prompt, filePath });

} else if (args.slug) {
  const slug = args.slug;
  const title = args.title || slug.replace(/-/g, ' ');
  const prompt = args.prompt || await buildPromptWithAI(title);

  jobs.push({ slug, title, prompt, filePath: null });

} else if (args['all-missing']) {
  // Find all posts without thumbnails
  const dirs = [DRAFTS_DIR, REVIEW_DIR, APPROVED_DIR, PUBLISHED_DIR];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter(f => f.endsWith('.md'))) {
      const filePath = resolve(dir, file);
      const { frontmatter } = parseFile(filePath);
      const slug = frontmatter.slug || basename(file, '.md');

      // Check if thumbnail already exists
      const thumbPath = resolve(THUMBNAILS_DIR, `${slug}.png`);
      if (existsSync(thumbPath)) continue;

      // Check if featured image URL is already set
      if (frontmatter.featured_image?.url) continue;

      const title = frontmatter.title || slug.replace(/-/g, ' ');
      // Defer prompt generation to processing loop to avoid rate limits
      jobs.push({ slug, title, prompt: null, filePath });
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

  // Generate AI prompt if not already set (deferred for --all-missing)
  if (!job.prompt) {
    job.prompt = await buildPromptWithAI(job.title);
  }

  printSection(`[${i + 1}/${jobs.length}] ${job.slug}`);
  printInfo(`Title: ${job.title}`);
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
