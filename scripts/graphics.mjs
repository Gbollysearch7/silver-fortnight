#!/usr/bin/env node

/**
 * In-Article Graphics Generator
 *
 * Generates comparison charts, diagrams, and visual assets for blog posts
 * using fal.ai Ideogram v3. Designed for comparison posts, data visualization,
 * and educational graphics.
 *
 * Usage:
 *   node scripts/graphics.mjs --file content/drafts/post.md
 *   node scripts/graphics.mjs --type comparison --topic "FTMO vs Funded Trader"
 *   node scripts/graphics.mjs --file content/drafts/post.md --all-graphics
 *
 * Supported graphic types:
 *   - comparison: Side-by-side comparison tables/charts
 *   - process: Step-by-step flowcharts
 *   - data: Statistics and data visualization
 *   - concept: Educational diagrams
 *
 * Output: output/graphics/{slug}-{type}.png
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { config } from '../lib/config.mjs';
import { parseArgs, slugify, printHeader, printSection, printSuccess, printError, printWarning, printInfo } from '../lib/utils.mjs';
import { parseFile as parseFrontmatter } from '../lib/markdown.mjs';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

const colorize = {
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
  dim: (text) => `${colors.dim}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`
};

// Parse CLI arguments
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`
${colorize.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${colorize.bold('  📊 In-Article Graphics Generator')}
${colorize.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${colorize.dim('Generate comparison charts and diagrams for blog posts')}

${colorize.yellow('Usage:')}
  node scripts/graphics.mjs --file content/drafts/post.md
  node scripts/graphics.mjs --type comparison --topic "FTMO vs Funded Trader"
  node scripts/graphics.mjs --file content/drafts/post.md --all-graphics

${colorize.yellow('Options:')}
  --file <path>         Markdown file to generate graphics for
  --type <type>         Graphic type (comparison, process, data, concept)
  --topic <text>        Topic for manual generation
  --all-graphics        Generate all detected graphics from post
  --dry-run            Preview prompts without generating images
  --help               Show this help message

${colorize.yellow('Graphic Types:')}
  ${colorize.green('comparison')}  Side-by-side comparison tables (e.g., "FTMO vs Funded Trader")
  ${colorize.green('process')}     Step-by-step flowcharts (e.g., "How to pass challenge")
  ${colorize.green('data')}        Statistics and data visualization (e.g., "Success rates")
  ${colorize.green('concept')}     Educational diagrams (e.g., "What is drawdown?")

${colorize.yellow('Examples:')}
  ${colorize.dim('# Generate comparison chart for specific post')}
  node scripts/graphics.mjs --file content/drafts/ftmo-vs-funded-trader.md

  ${colorize.dim('# Generate all graphics mentioned in post')}
  node scripts/graphics.mjs --file content/drafts/post.md --all-graphics

  ${colorize.dim('# Manual generation')}
  node scripts/graphics.mjs --type comparison --topic "FTMO vs MyFundedFX"

${colorize.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
  `);
  process.exit(0);
}

/**
 * Generate image via fal.ai Ideogram v3
 */
async function generateImage(prompt, imageSize = 'landscape_16_9', seed = null) {
  const FAL_KEY = config.env.FAL_KEY;

  if (!FAL_KEY) {
    throw new Error('FAL_KEY not found in environment variables');
  }

  console.log(colorize.blue('\n📡 Calling fal.ai Ideogram v3...'));

  const payload = {
    prompt,
    image_size: imageSize,
    magic_prompt_option: 'AUTO',
    ...(seed && { seed })
  };

  const response = await fetch('https://fal.run/fal-ai/ideogram/v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${FAL_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`fal.ai API error (${response.status}): ${error}`);
  }

  const result = await response.json();

  if (!result.images || result.images.length === 0) {
    throw new Error('No images returned from fal.ai');
  }

  return result.images[0];
}

/**
 * Download image from URL
 */
async function downloadImage(url, outputPath) {
  console.log(colorize.blue(`\n⬇️  Downloading image...`));

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  writeFileSync(outputPath, Buffer.from(buffer));

  console.log(colorize.green(`✅ Saved to: ${outputPath}`));
}

/**
 * Build prompt for comparison graphic
 */
function buildComparisonPrompt(topic, details = null) {
  const baseStyle = `Professional fintech comparison table.
Navy background #0F172A, electric blue accents #4250EB.
Clean typography, grid layout, easy to read.
Modern minimalist design, high contrast text.`;

  if (details) {
    return `${topic}

Comparison points:
${details}

${baseStyle}`;
  }

  return `Clean comparison table: ${topic}

Key comparison points: pricing, drawdown rules, profit split, scaling plan, payout speed.

${baseStyle}`;
}

/**
 * Build prompt for process flowchart
 */
function buildProcessPrompt(topic, steps = null) {
  const baseStyle = `Professional flowchart diagram.
Navy background #0F172A, electric blue arrows #4250EB.
Clear numbered steps, clean lines, modern design.
High contrast text, easy to follow flow.`;

  if (steps) {
    return `${topic}

Steps:
${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

${baseStyle}`;
  }

  return `Step-by-step process flowchart: ${topic}

${baseStyle}`;
}

/**
 * Build prompt for data visualization
 */
function buildDataPrompt(topic, dataPoints = null) {
  const baseStyle = `Professional data visualization chart.
Navy background #0F172A, electric blue bars/lines #4250EB.
Clean grid, clear labels, modern design.
High contrast, easy to read statistics.`;

  if (dataPoints) {
    return `${topic}

Data points:
${dataPoints}

${baseStyle}`;
  }

  return `Data visualization: ${topic}

${baseStyle}`;
}

/**
 * Build prompt for concept diagram
 */
function buildConceptPrompt(topic, explanation = null) {
  const baseStyle = `Educational concept diagram.
Navy background #0F172A, electric blue highlights #4250EB.
Clear labels, simple illustrations, modern design.
High contrast, easy to understand visual explanation.`;

  if (explanation) {
    return `${topic}

Explanation:
${explanation}

${baseStyle}`;
  }

  return `Educational diagram explaining: ${topic}

${baseStyle}`;
}

/**
 * Detect graphics needed from markdown content
 */
function detectGraphicsNeeded(content, frontmatter) {
  const graphics = [];

  // Check template type
  const template = frontmatter.template || '';

  // Comparison posts always need comparison graphic
  if (template === 'comparison' || content.includes(' vs ') || content.includes(' versus ')) {
    const vsMatch = content.match(/(?:^|\s)([A-Z][^.!?\n]+)\s+(?:vs|versus)\s+([A-Z][^.!?\n]+)/i);
    if (vsMatch) {
      graphics.push({
        type: 'comparison',
        topic: `${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`
      });
    }
  }

  // How-to posts may need process flowcharts
  if (template === 'how-to' || content.includes('Step 1:') || content.includes('1.')) {
    const stepsMatch = content.match(/##\s*(?:Steps?|How to[^#]+)/i);
    if (stepsMatch) {
      graphics.push({
        type: 'process',
        topic: frontmatter.title || 'Process Flow'
      });
    }
  }

  // Posts with statistics may need data viz
  if (content.match(/\d+%|\d+\s+traders?|success rate|statistics/i)) {
    const dataMatch = content.match(/##\s*(?:Statistics|Data|Numbers|Success Rate)[^#]*/i);
    if (dataMatch) {
      graphics.push({
        type: 'data',
        topic: 'Key Statistics'
      });
    }
  }

  // Educational posts may need concept diagrams
  if (content.match(/##\s*(?:What is|Understanding|Basics of)/i)) {
    const conceptMatch = content.match(/##\s*(?:What is|Understanding|Basics of)\s+([^#\n]+)/i);
    if (conceptMatch) {
      graphics.push({
        type: 'concept',
        topic: conceptMatch[1].trim()
      });
    }
  }

  return graphics;
}

/**
 * Main execution
 */
async function main() {
  console.log(colorize.bold('\n📊 In-Article Graphics Generator\n'));

  const dryRun = args['dry-run'];

  // Ensure output directory exists
  const outputDir = join(config.paths.output, 'graphics');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  let graphicsToGenerate = [];
  let slug = 'manual';

  // Mode 1: Generate from file
  if (args.file) {
    const filePath = args.file;

    if (!existsSync(filePath)) {
      console.error(colorize.red(`❌ File not found: ${filePath}`));
      process.exit(1);
    }

    console.log(colorize.dim(`📄 Reading: ${basename(filePath)}`));

    const fileContent = readFileSync(filePath, 'utf-8');
    const { frontmatter, content } = parseFrontmatter(fileContent);

    slug = frontmatter.slug || slugify(frontmatter.title || basename(filePath, '.md'));

    if (args['all-graphics']) {
      // Auto-detect all graphics needed
      graphicsToGenerate = detectGraphicsNeeded(content, frontmatter);
      console.log(colorize.blue(`\n🔍 Detected ${graphicsToGenerate.length} graphic(s) needed`));
    } else {
      // Use frontmatter or default based on template
      const template = frontmatter.template || 'ultimate-guide';

      if (template === 'comparison') {
        graphicsToGenerate.push({
          type: 'comparison',
          topic: frontmatter.title
        });
      } else if (args.type) {
        graphicsToGenerate.push({
          type: args.type,
          topic: frontmatter.title
        });
      } else {
        console.error(colorize.red('❌ Please specify --type or use --all-graphics'));
        process.exit(1);
      }
    }
  }
  // Mode 2: Manual generation
  else if (args.type && args.topic) {
    graphicsToGenerate.push({
      type: args.type,
      topic: args.topic
    });
    slug = slugify(args.topic);
  }
  else {
    console.error(colorize.red('❌ Please provide --file or both --type and --topic'));
    console.log(colorize.dim('   Use --help for usage information'));
    process.exit(1);
  }

  // Generate each graphic
  for (const [index, graphic] of graphicsToGenerate.entries()) {
    console.log(colorize.blue(`\n━━━ Graphic ${index + 1}/${graphicsToGenerate.length} ━━━`));
    console.log(colorize.dim(`Type: ${graphic.type}`));
    console.log(colorize.dim(`Topic: ${graphic.topic}`));

    // Build prompt based on type
    let prompt;
    switch (graphic.type) {
      case 'comparison':
        prompt = buildComparisonPrompt(graphic.topic, graphic.details);
        break;
      case 'process':
        prompt = buildProcessPrompt(graphic.topic, graphic.steps);
        break;
      case 'data':
        prompt = buildDataPrompt(graphic.topic, graphic.dataPoints);
        break;
      case 'concept':
        prompt = buildConceptPrompt(graphic.topic, graphic.explanation);
        break;
      default:
        console.error(colorize.red(`❌ Unknown graphic type: ${graphic.type}`));
        continue;
    }

    console.log(colorize.yellow('\n📝 Prompt:'));
    console.log(colorize.dim('─'.repeat(50)));
    console.log(prompt);
    console.log(colorize.dim('─'.repeat(50)));

    if (dryRun) {
      console.log(colorize.yellow('\n🔍 DRY RUN - Skipping image generation'));
      continue;
    }

    try {
      // Generate image
      const imageResult = await generateImage(prompt, 'square');

      // Download and save
      const filename = `${slug}-${graphic.type}.png`;
      const outputPath = join(outputDir, filename);

      await downloadImage(imageResult.url, outputPath);

      console.log(colorize.green(`\n✅ Graphic generated successfully!`));
      console.log(colorize.dim(`   Path: ${outputPath}`));
      console.log(colorize.dim(`   Type: ${graphic.type}`));

      // Show markdown snippet
      console.log(colorize.yellow('\n📋 Markdown snippet:'));
      console.log(colorize.dim(`![${graphic.topic}](../../output/graphics/${filename})`));

    } catch (error) {
      console.error(colorize.red(`\n❌ Failed to generate graphic: ${error.message}`));
      if (error.stack) {
        console.error(colorize.dim(error.stack));
      }
    }
  }

  console.log(colorize.green(`\n✅ Graphics generation complete!\n`));
}

// Run
main().catch(error => {
  console.error(colorize.red('\n❌ Fatal error:'), error.message);
  if (error.stack) {
    console.error(colorize.dim(error.stack));
  }
  process.exit(1);
});
