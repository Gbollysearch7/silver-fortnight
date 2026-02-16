#!/usr/bin/env node
/**
 * Add In-Article Images
 * Generates contextual images for key sections and inserts them into markdown content
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { createWriteStream } from 'fs';
import { get as httpsGet } from 'https';
import {
  DRAFTS_DIR, REVIEW_DIR, APPROVED_DIR, PUBLISHED_DIR, OUTPUT_DIR,
  FAL_KEY,
} from '../lib/config.mjs';
import { parseArgs, printSection, printInfo, printSuccess, printError, printWarning, ensureDir } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';

const args = parseArgs();

const IMAGES_DIR = resolve(OUTPUT_DIR, 'in-article-images');
ensureDir(IMAGES_DIR);

// --- fal.ai Image Generation ---

async function generateImage(prompt) {
  const res = await fetch('https://fal.run/fal-ai/ideogram/v3', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '4:3', // 4:3 for in-article images
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

// --- Extract Key Sections ---

function extractSections(content) {
  // Find all H2 headings and extract the section title
  const h2Regex = /^##\s+(.+)$/gm;
  const sections = [];
  let match;

  while ((match = h2Regex.exec(content)) !== null) {
    const heading = match[1];
    // Skip FAQ sections and conclusion
    if (
      heading.toLowerCase().includes('faq') ||
      heading.toLowerCase().includes('frequently asked') ||
      heading.toLowerCase().includes('conclusion') ||
      heading.toLowerCase().includes('summary')
    ) {
      continue;
    }
    sections.push({
      heading,
      position: match.index,
    });
  }

  // Limit to 3-5 images
  const maxImages = Math.min(5, Math.max(3, Math.floor(sections.length / 2)));
  return sections.slice(0, maxImages);
}

// --- Build Image Prompt ---

function buildImagePrompt(articleTitle, sectionHeading) {
  // Create detailed, professional prompt inspired by TYSEO AGENT approach
  const prompt = `Professional trading and finance themed illustration for blog section.

**Section**: ${sectionHeading}
**Article**: ${articleTitle}

**Style**: Modern, clean, professional financial/trading aesthetic
**Elements to include**:
- Abstract trading charts, candlestick patterns, or financial data visualizations
- Clean geometric shapes representing growth, analysis, or strategy
- Professional dark blue or navy gradient background (#0F172A to #1a1a2e)
- Electric blue (#4250EB) and cyan accents for highlights
- Subtle grid or data overlay patterns
- Corporate, trustworthy fintech look

**Mood**: Professional, sophisticated, modern, trustworthy
**Quality**: High resolution, sharp clean edges, vector-like clarity
**Important**: NO text, NO words on the image - only visual elements
**Format**: 4:3 aspect ratio, suitable for blog article section

Think: Bloomberg Terminal aesthetics meets modern SaaS design`;

  return prompt;
}

// --- Insert Images into Markdown ---

function insertImages(content, images) {
  let updatedContent = content;
  let offset = 0;

  // Sort images by position (reverse order to maintain positions)
  const sortedImages = [...images].sort((a, b) => b.position - a.position);

  for (const img of sortedImages) {
    // Insert image right after the H2 heading
    const insertPosition = img.position + offset;
    const imageMarkdown = `\n\n![${img.alt}](${img.url})\n\n`;

    // Find the end of the H2 line
    const lineEnd = content.indexOf('\n', insertPosition);
    updatedContent =
      updatedContent.slice(0, lineEnd + 1) +
      imageMarkdown +
      updatedContent.slice(lineEnd + 1);

    offset += imageMarkdown.length;
  }

  return updatedContent;
}

// --- Main Execution ---

printSection('Add In-Article Images');

if (!args.file) {
  printError('Usage: node scripts/add-images.mjs --file <path>');
  printInfo('Example: node scripts/add-images.mjs --file content/drafts/article.md');
  process.exit(1);
}

const filePath = resolve(args.file);
if (!existsSync(filePath)) {
  printError(`File not found: ${filePath}`);
  process.exit(1);
}

const { frontmatter, content } = parseFile(filePath);
const slug = frontmatter.slug || basename(filePath, '.md');
const articleTitle = frontmatter.title;

printInfo(`Article: ${articleTitle}`);
printInfo(`Slug: ${slug}`);

// Extract sections
const sections = extractSections(content);
printInfo(`Found ${sections.length} sections for images\n`);

if (sections.length === 0) {
  printWarning('No suitable sections found for images');
  process.exit(0);
}

if (args['dry-run']) {
  printInfo('DRY RUN - Images that would be generated:');
  sections.forEach((section, i) => {
    console.log(`  ${i + 1}. ${section.heading}`);
    const prompt = buildImagePrompt(articleTitle, section.heading);
    console.log(`     Prompt: ${prompt}\n`);
  });
  printInfo(`Total cost: ~$${(sections.length * 0.04).toFixed(2)}`);
  process.exit(0);
}

const cost = (sections.length * 0.04).toFixed(2);
printInfo(`Generating ${sections.length} images (~$${cost})\n`);

// Generate images
const generatedImages = [];
let success = 0;
let failed = 0;

for (let i = 0; i < sections.length; i++) {
  const section = sections[i];
  printInfo(`[${i + 1}/${sections.length}] ${section.heading}`);

  try {
    const prompt = buildImagePrompt(articleTitle, section.heading);
    printInfo(`Generating...`);

    const start = Date.now();
    const imageUrl = await generateImage(prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    // Download image
    const imagePath = resolve(IMAGES_DIR, `${slug}-${i + 1}.png`);
    await downloadImage(imageUrl, imagePath);

    printSuccess(`Generated in ${duration}s: ${imagePath}`);

    generatedImages.push({
      position: section.position,
      url: imageUrl,
      alt: `${section.heading} - ${articleTitle}`,
      localPath: imagePath,
    });

    success++;

    // Rate limit delay
    if (i < sections.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    printError(`Failed: ${err.message}`);
    failed++;
  }
}

if (generatedImages.length === 0) {
  printError('No images generated successfully');
  process.exit(1);
}

// Insert images into content
printInfo('\nInserting images into markdown...');
const updatedContent = insertImages(content, generatedImages);

// Write back to file
const fileContent = readFileSync(filePath, 'utf-8');
const frontmatterEnd = fileContent.indexOf('---', 3) + 3;
const newFileContent = fileContent.slice(0, frontmatterEnd) + '\n' + updatedContent;

writeFileSync(filePath, newFileContent, 'utf-8');
printSuccess(`Updated: ${filePath}`);

printSection('Summary');
printInfo(`Generated: ${success}/${sections.length}`);
if (failed > 0) printWarning(`Failed: ${failed}`);
printInfo(`Cost: ~$${cost}`);
printSuccess('Images inserted into markdown ✓');
