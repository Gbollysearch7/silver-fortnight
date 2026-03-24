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

// --- fal.ai Ideogram v3 Image Generation ---

async function generateImage(prompt) {
  const res = await fetch('https://fal.run/fal-ai/ideogram/v3', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '3:2',
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

// --- Extract Key Sections (with context) ---

function extractSections(content) {
  // Find all H2 headings, their positions, and the first ~200 chars of section text
  const h2Regex = /^##\s+(.+)$/gm;
  const allSections = [];
  let match;

  while ((match = h2Regex.exec(content)) !== null) {
    allSections.push({
      heading: match[1],
      position: match.index,
      headingEnd: match.index + match[0].length,
    });
  }

  const sections = [];
  for (let i = 0; i < allSections.length; i++) {
    const section = allSections[i];
    const heading = section.heading;

    // Skip FAQ sections and conclusion
    if (
      heading.toLowerCase().includes('faq') ||
      heading.toLowerCase().includes('frequently asked') ||
      heading.toLowerCase().includes('conclusion') ||
      heading.toLowerCase().includes('summary')
    ) {
      continue;
    }

    // Extract first ~200 chars of section body for context
    const nextSectionStart = allSections[i + 1]?.position || content.length;
    const sectionBody = content.slice(section.headingEnd, nextSectionStart).trim();
    const context = sectionBody.replace(/[#*_\[\]()]/g, '').slice(0, 200).trim();

    sections.push({
      heading,
      position: section.position,
      context,
    });
  }

  // Limit images — use --max-images flag if provided, otherwise 3-5 based on section count
  const maxFromArgs = parseInt(args['max-images'], 10);
  const maxImages = maxFromArgs > 0 ? maxFromArgs : Math.min(5, Math.max(3, Math.floor(sections.length / 2)));
  return sections.slice(0, maxImages);
}

// --- Build Contextual Image Prompt ---
// IMPORTANT: Every image MUST visually represent the specific section content.
// Never use generic stock photos — the image should tell the section's story.

function buildImagePrompt(articleTitle, sectionHeading) {
  const heading = sectionHeading.toLowerCase();

  // Build a scene that directly represents what the section is about
  let scene;

  if (heading.includes('risk') || heading.includes('drawdown') || heading.includes('stop-loss') || heading.includes('manage')) {
    scene = 'A professional trader\'s monitor showing a trading chart with clearly marked stop-loss levels as red horizontal lines and take-profit as green lines, a position size calculator visible in a smaller window, the trader\'s hand resting on the mouse with a controlled posture, immaculately organized desk conveying discipline and risk control, cool blue and grey tones';
  } else if (heading.includes('strateg') || heading.includes('plan') || heading.includes('consistency')) {
    scene = 'A calm trader\'s desk with an open trading journal showing a written strategy with rules and checkmarks, a single monitor displaying a methodical chart with few well-placed trades and a steadily rising equity curve, the workspace is clean and organized reflecting consistency over chaos, warm natural lighting';
  } else if (heading.includes('psycholog') || heading.includes('disciplin') || heading.includes('mental') || heading.includes('emotion')) {
    scene = 'A trader sitting calmly at their desk with eyes closed in a moment of composure, trading screens glowing softly in the background showing an open position, hands resting flat on the desk not touching the mouse conveying the discipline of patience, warm side lighting with shallow depth of field';
  } else if (heading.includes('profit') || heading.includes('earn') || heading.includes('money') || heading.includes('payout') || heading.includes('funded')) {
    scene = 'A laptop screen showing a trading account dashboard with a green profit chart trending upward, a payout confirmation notification visible, the trader\'s hands on the keyboard with a confident posture, warm ambient lighting, coffee nearby';
  } else if (heading.includes('math') || heading.includes('statistic') || heading.includes('number') || heading.includes('data') || heading.includes('reality')) {
    scene = 'An overhead flat-lay of a trader\'s desk with a notebook showing handwritten risk-reward calculations and win rate formulas, a calculator with numbers displayed, a printed chart showing a bell curve of trading outcomes, a coffee cup and pen completing the scene, clean editorial style, warm natural lighting from above';
  } else if (heading.includes('challenge') || heading.includes('pass') || heading.includes('phase') || heading.includes('evaluation')) {
    scene = 'A dramatic trader\'s workspace at night with multiple monitors — one showing a challenge countdown timer, another showing a profit/loss tracker approaching a target line, a third with live candlestick charts, a notebook open beside the keyboard, lit by blue screen glow and a warm desk lamp, conveying determination and focus';
  } else if (heading.includes('mistake') || heading.includes('fail') || heading.includes('avoid') || heading.includes('wrong')) {
    scene = 'A tense trading scene — a trader rubbing their temples with frustrated body language, monitors showing red charts with sharp drawdowns, crumpled papers on the desk, an overturned coffee cup, the lighting is harsh and cold, conveying the cost of mistakes and undisciplined trading';
  } else if (heading.includes('platform') || heading.includes('tool') || heading.includes('software') || heading.includes('setup') || heading.includes('technical')) {
    scene = 'A clean professional trading setup with an ultra-wide monitor showing a modern trading platform interface with multiple chart panels and indicators, a second monitor with a scanner or news feed, organized desk with mechanical keyboard and quality mouse, ambient blue lighting reflecting off the screens';
  } else if (heading.includes('beginner') || heading.includes('start') || heading.includes('learn') || heading.includes('basic') || heading.includes('introduction')) {
    scene = 'A person at a coffee shop learning to trade on a laptop, a notebook with handwritten notes and diagrams beside them, educational charts on screen with annotations, a cup of coffee nearby, natural daylight streaming through windows, approachable and warm atmosphere';
  } else if (heading.includes('compar') || heading.includes(' vs ') || heading.includes('differ') || heading.includes('choose')) {
    scene = 'Two monitors side by side on a desk each showing different trading platforms with distinct chart styles, a trader\'s notepad between them with a pros/cons list being written, editorial photography style with clean workspace and balanced composition';
  } else if (heading.includes('account') || heading.includes('fund') || heading.includes('capital') || heading.includes('size')) {
    scene = 'A trader reviewing account options on a laptop with different account tier cards displayed on screen, financial documents and a notepad with calculations on the desk, a professional and organized workspace conveying careful financial planning, natural window light';
  } else if (heading.includes('step') || heading.includes('game plan') || heading.includes('process') || heading.includes('guide') || heading.includes('how to')) {
    scene = 'A trader\'s desk with a clear step-by-step roadmap pinned to a board behind the monitor, the monitor shows a clean trading chart, numbered sticky notes on the desk outlining a process, everything organized and methodical, bright workspace with warm lighting conveying clarity and direction';
  } else if (heading.includes('advanced') || heading.includes('expert') || heading.includes('pro tip') || heading.includes('edge')) {
    scene = 'An experienced trader at a sophisticated multi-monitor setup showing advanced analytics — correlation matrices, order flow charts, and custom indicators — a cup of black coffee and reading glasses on the desk suggesting expertise, moody dramatic lighting with deep blue tones';
  } else if (heading.includes('success') || heading.includes('advantage') || heading.includes('benefit') || heading.includes('support')) {
    scene = 'A confident trader smiling while reviewing positive performance metrics on a large monitor, a clean modern office with city skyline visible through windows, the atmosphere is bright and optimistic, natural lighting portrait style';
  } else if (heading.includes('rule') || heading.includes('requirement') || heading.includes('condition')) {
    scene = 'A clean desk with a printed checklist of trading rules next to a laptop showing a trading platform, each rule has a checkbox, a pen rests on the paper, the setup is immaculate and organized conveying structure and compliance, soft overhead lighting';
  } else if (heading.includes('country') || heading.includes('region') || heading.includes('local')) {
    scene = 'A trader working in a modern co-working space with a city skyline visible through large windows, laptop showing international market data with multiple currency pairs, a world clock widget visible, the atmosphere conveys global connectivity';
  } else if (heading.includes('tax') || heading.includes('legal') || heading.includes('regulat')) {
    scene = 'A desk with official-looking financial documents and tax forms next to a laptop showing trading records, a pen and reading glasses on the papers, clean professional setting with warm overhead lighting conveying seriousness and compliance';
  } else if (heading.includes('journal') || heading.includes('track') || heading.includes('review') || heading.includes('analyz')) {
    scene = 'An open trading journal on a desk with handwritten trade logs showing entry/exit prices and lessons learned, a laptop behind it showing a performance analytics dashboard with charts, a highlighter and pen on the journal, warm study lamp lighting';
  } else {
    // Fallback: use the heading itself to build a contextual scene
    scene = `A professional trading workspace scene that visually represents "${sectionHeading}" — a trader at a modern desk with monitors showing relevant financial data, the composition and mood should match the topic, cinematic lighting, editorial photography style`;
  }

  return `${scene}. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.`;
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
