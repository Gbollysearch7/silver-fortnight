#!/usr/bin/env node

/**
 * Blog Post Generator (AI-Powered)
 * Researches competitors via Firecrawl, generates full articles via GPT-4o,
 * and saves as markdown drafts with proper frontmatter.
 *
 * Usage:
 *   node scripts/generate.mjs --topic "How to Pass a Prop Firm Challenge" --template ultimate-guide --keyword "prop firm challenge"
 *   node scripts/generate.mjs --topic "Best Prop Firms" --template listicle --keyword "best prop firms" --category country-guides
 *   node scripts/generate.mjs --topic "Title" --keyword "kw" --no-research    # Skip research, use AI only
 *   node scripts/generate.mjs --topic "Title" --keyword "kw" --scaffold       # Old behavior: template scaffold only
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  DRAFTS_DIR, TEMPLATES_DIR, TRACKER_PATH, blogConfig, OPENAI_API_KEY, FIRECRAWL_API_KEY,
  CLAUDE_API_KEY
} from '../lib/config.mjs';
import { parseArgs, slugify, formatDate, printHeader, printSuccess, printError, printInfo, printWarning, ensureDir, updateTrackerPost } from '../lib/utils.mjs';
import { serialize } from '../lib/markdown.mjs';
import { research } from '../lib/researcher.mjs';
// Use new AI writer v2 that supports both Claude and OpenAI
import { generateArticle, compareProvidersForArticle } from '../lib/ai-writer-v2.mjs';
import { validateInternalLinks } from '../lib/internal-link-validator.mjs';

const args = parseArgs();

if (!args.topic) {
  console.log('Usage: node scripts/generate.mjs --topic "Topic" --template <type> --keyword "keyword"');
  console.log('\nTemplates: ultimate-guide, listicle, how-to, comparison, success-story');
  console.log('\nOptions:');
  console.log('  --topic       Blog post topic (required)');
  console.log('  --template    Template type (default: how-to)');
  console.log('  --keyword     Primary keyword');
  console.log('  --category    Category slug');
  console.log('  --slug        Custom slug (auto-generated from topic if omitted)');
  console.log('  --output      Custom output path');
  console.log('  --provider    AI provider: claude (default), openai, auto');
  console.log('  --compare     Generate with both providers and compare results');
  console.log('  --no-research Skip Firecrawl research (use AI generation only)');
  console.log('  --scaffold    Old behavior: create template scaffold without AI');
  process.exit(0);
}

const topic = args.topic;
const template = args.template || 'how-to';
const keyword = args.keyword || '';
const category = args.category || 'trading-education';
const slug = args.slug || slugify(topic);
const now = formatDate();
const scaffoldOnly = args.scaffold || false;
const skipResearch = args['no-research'] || false;
const provider = args.provider || 'claude';  // Default to Claude
const compareMode = args.compare || false;
const tier = parseInt(args.tier, 10) || 0;

printHeader('Blog Post Generator');

// --- TOPIC FILTER GATE ---
// Reject topics that fail the three-question test BEFORE touching any AI credits.
// Based on: lib/blog-writer-agent.md Step 0 — Topic Filtering
if (!scaffoldOnly && !args['skip-filter']) {
  const topicLower = (topic + ' ' + keyword).toLowerCase();

  // Patterns that signal jargon, non-commercial, or zero-search-volume topics
  const REJECT_PATTERNS = [
    // Competitor-only navigational — we can't win these
    /\bis\s+\w+\s+(legit|scam|real|safe|trusted)\b/,
    // Hacked / negative sentiment — no purchase path
    /\b(got hacked|data breach|fraud|lawsuit)\b/,
    // HFT / institutional — wrong audience
    /\b(high.?frequency|hft|algorithmic trading firm|institutional prop)\b/,
    // PR/marketing phrasing — nobody searches this
    /\b(enhance trader experience|contribute to financial education|address slippage|technology.{0,20}prop firm)\b/,
    // Geographic trivia with no commercial intent
    /\b(does [a-z]+ allow prop|prop firms? in [a-z]+ legal|prop firms? banned in)\b/,
    // Platform brand jargon with no commercial intent
    /\b(rithmic feed|tradelocker|fpfx drawdown model|eod trailing rule)\b/,
    // "Do prop firms have X" academic curiosity questions
    /\bdo prop (trading )?firms have (investors|owners|employees|offices)\b/,
  ];

  const rejectedPattern = REJECT_PATTERNS.find(p => p.test(topicLower));
  if (rejectedPattern) {
    printError(`TOPIC REJECTED: "${topic}"`);
    printError(`Matched reject pattern: ${rejectedPattern}`);
    printError('This topic is jargon, non-commercial, or has no real trader searching for it.');
    printError('It would waste AI credits and publish content nobody reads.');
    printError('Fix: Remove this keyword from the queue or replace with a real commercial question.');
    printError('Examples of good topics: "best prop firm for beginners", "how to pass prop firm challenge", "cheapest prop firm with fast payouts"');
    process.exit(1);
  }
}

// Load template content
const templatePath = resolve(TEMPLATES_DIR, `${template}.md`);
let templateContent = '';
if (existsSync(templatePath)) {
  const parsed = readFileSync(templatePath, 'utf-8');
  const match = parsed.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  templateContent = match ? match[1].trim() : parsed;
  printInfo(`Loaded template: ${template}`);
} else {
  printInfo(`Template "${template}" not found, using default structure`);
  templateContent = generateDefaultContent(topic, template, keyword);
}

// Replace template variables
templateContent = templateContent.replace(/\{\{TOPIC\}\}/g, topic).replace(/\{\{KEYWORD\}\}/g, keyword);

// Check if output file already exists
ensureDir(DRAFTS_DIR);
const outputPath = args.output || resolve(DRAFTS_DIR, `${slug}.md`);

if (existsSync(outputPath)) {
  printError(`File already exists: ${outputPath}`);
  printInfo('Use --slug to specify a different slug or delete the existing file');
  process.exit(1);
}

// --- Decide generation mode ---
let articleContent = templateContent;
let description = `Learn everything about ${keyword || topic.toLowerCase()}. Comprehensive guide with actionable tips, strategies, and expert insights.`;
let secondaryKeywords = [];
let aiCost = 0;
let aiProvider = null;

// Check if any AI provider is available
const hasAI = CLAUDE_API_KEY || OPENAI_API_KEY;

// HARD GATE: If no AI key and not explicitly in scaffold mode, ABORT.
// NEVER allow a blank template to be published as a real article.
if (!hasAI && !scaffoldOnly) {
  printError('FATAL: No AI API key available (OPENAI_API_KEY or CLAUDE_API_KEY).');
  printError('Refusing to generate a blank template scaffold that would be published as a real article.');
  printError('This would destroy SEO and publish empty placeholder content to the live site.');
  printError('Fix: Add OPENAI_API_KEY or CLAUDE_API_KEY to your environment variables.');
  process.exit(1);
}

if (scaffoldOnly) {
  printWarning('SCAFFOLD MODE — this file will NOT be published by the cron pipeline.');
  printWarning('Scaffold mode is for manual drafting only. Never run pipeline.mjs on a scaffold output.');
  printInfo('Mode: Template scaffold (no AI generation)');
} else {
  // AI generation mode
  printInfo(`Mode: AI-powered content generation (${compareMode ? 'COMPARE MODE' : provider.toUpperCase()})`);

  // Step 1: Research + Fact-Check (unless skipped)
  let researchData = null;
  if (!skipResearch && FIRECRAWL_API_KEY && keyword) {
    printInfo('Step 1/2: Researching competitors + fact-checking...');
    try {
      researchData = await research(keyword, {
        searchLimit: 5,
        scrapeLimit: 3,
        title: topic,
        template,
      });
      if (researchData.insights) {
        printSuccess(`Research complete: ${researchData.insights.competitorCount} competitors analyzed`);
        printInfo(`Avg competitor word count: ${researchData.insights.avgWordCount}`);
        printInfo(`Common themes: ${researchData.insights.commonThemes.slice(0, 5).map(t => t.theme).join(', ')}`);
      }
      if (researchData.factCheckResult) {
        if (researchData.factCheckResult.verifiedData.propFirms.length > 0) {
          printSuccess(`${researchData.factCheckResult.verifiedData.propFirms.length} prop firms verified`);
        }
        if (researchData.factCheckResult.warnings.length > 0) {
          printWarning(`Fact-check warnings: ${researchData.factCheckResult.warnings.length}`);
        }
      }
    } catch (err) {
      printWarning(`Research failed (continuing without): ${err.message}`);
    }
  } else {
    if (skipResearch) printInfo('Step 1/2: Research skipped (--no-research)');
    else if (!FIRECRAWL_API_KEY) printWarning('No FIRECRAWL_API_KEY — skipping research');
    else printInfo('No keyword set — skipping research');
  }

  // Step 2: Generate article with AI
  if (compareMode) {
    // Compare mode: Generate with both providers
    printInfo(`${researchData ? 'Step 2/2' : 'Generating'}: Comparing Claude vs OpenAI...`);
    try {
      const comparison = await compareProvidersForArticle({
        title: topic,
        keyword,
        secondaryKeywords,
        template,
        category,
        research: researchData,
        templateContent,
        tier
      });

      // Use the better result (or Claude if both succeeded)
      const bestResult = comparison.claude && !comparison.claude.error
        ? comparison.claude
        : comparison.openai;

      if (!bestResult || bestResult.error) {
        throw new Error('Both providers failed');
      }

      articleContent = bestResult.content;
      description = bestResult.description;
      secondaryKeywords = bestResult.secondaryKeywords;
      aiCost = bestResult.cost;
      aiProvider = bestResult.provider;
      printSuccess(`Using ${aiProvider} result: ${bestResult.wordCount} words, $${aiCost.toFixed(4)}`);
    } catch (err) {
      printError(`AI comparison failed: ${err.message}`);
      printError('ABORTING — refusing to publish template scaffold as a real article');
      process.exit(1);
    }
  } else {
    // Normal mode: Single provider
    printInfo(`${researchData ? 'Step 2/2' : 'Generating'}: Writing article with AI...`);
    try {
      const result = await generateArticle({
        title: topic,
        keyword,
        secondaryKeywords,
        template,
        category,
        research: researchData,
        templateContent,
        provider,
        tier
      });

      articleContent = result.content;
      description = result.description;
      secondaryKeywords = result.secondaryKeywords;
      aiCost = result.cost;
      aiProvider = result.provider;
      printSuccess(`Article generated: ${result.wordCount} words, $${aiCost.toFixed(4)} (${aiProvider})`);
    } catch (err) {
      printError(`AI generation failed: ${err.message}`);
      printError('ABORTING — refusing to publish template scaffold as a real article');
      process.exit(1);
    }
  }
}

// CONTENT VALIDATION GATE — final check before writing to disk
// If the content still has unresolved template placeholders, it means
// AI generation silently failed or returned the raw template. HARD ABORT.
const SCAFFOLD_MARKERS = [
  '[Prerequisite 1]',
  '[Action-Oriented First Step]',
  'Step 1: [',
  '[Mistake 1]',
  '[Question]',
  '[Answer]',
  '[Tip 1]',
  '[Specific advice]',
  '[First Step]',
  '[Second Step]',
];
const foundMarker = SCAFFOLD_MARKERS.find(m => articleContent.includes(m));
if (foundMarker && !scaffoldOnly) {
  printError(`FATAL: Generated content contains unresolved template placeholder: "${foundMarker}"`);
  printError('This means AI generation failed silently and returned a raw scaffold.');
  printError('ABORTING — this file will NOT be written to disk or published.');
  process.exit(1);
}

// Word count gate — real articles must have substance
const wordCountCheck = articleContent.split(/\s+/).filter(w => w.length > 0).length;
if (!scaffoldOnly && wordCountCheck < 600) {
  printError(`FATAL: Generated content is only ${wordCountCheck} words — suspiciously short.`);
  printError('Minimum is 600 words. AI may have returned an error message or empty response.');
  printError('ABORTING — refusing to publish thin content.');
  process.exit(1);
}

// Internal link gate — AI must not invent /blog-posts/X links that don't exist.
// History: in April 2026, 77 ghost links across 29 articles had to be unwrapped after the fact.
if (!scaffoldOnly) {
  try {
    const result = await validateInternalLinks(articleContent, { allowSelf: slug });
    if (!result.valid) {
      printError(`FATAL: Generated content contains ${result.ghosts.length} internal link(s) to non-existent /blog-posts/ slugs.`);
      printError(`Published slug count: ${result.totalPublished}`);
      for (const g of result.ghosts.slice(0, 10)) {
        printError(`  ghost link -> /blog-posts/${g.slug}  (${g.type})`);
      }
      printError('ABORTING — refusing to publish article that links to articles that do not exist.');
      process.exit(1);
    }
    if (result.links.length > 0) {
      printSuccess(`Internal link check passed: ${result.links.length} link(s), all targets exist.`);
    }
  } catch (err) {
    printError(`FATAL: Internal link validation failed to run: ${err.message}`);
    printError('Cannot verify links are real — ABORTING to be safe.');
    process.exit(1);
  }
}

// Build frontmatter
const frontmatter = {
  title: topic,
  slug,
  description,
  keywords: {
    primary: keyword,
    secondary: secondaryKeywords,
  },
  category,
  author: 'TradersYard',
  template,
  status: 'draft',
  created_at: now,
  updated_at: now,
  scheduled_date: null,
  published_at: null,
  meta_title: `${topic} | TradersYard`,
  meta_description: description,
  seo_score: null,
  featured_image: {
    url: null,
    alt: `${topic} - TradersYard guide`,
  },
  webflow_item_id: null,
  webflow_published: false,
  related_posts: [],
  cta: {
    text: 'Start your challenge today',
    url: 'https://tradersyard.com/#pricing',
  },
};

// Write the file
import('fs').then(fs => {
  const fileContent = serialize(frontmatter, articleContent);
  fs.writeFileSync(outputPath, fileContent, 'utf-8');

  // Update tracker
  updateTrackerPost(TRACKER_PATH, slug, {
    title: topic,
    slug,
    status: 'draft',
    template,
    category,
    keyword,
    createdAt: now,
    filePath: outputPath,
  });

  printSuccess(`Draft created: ${outputPath}`);
  printInfo(`Slug: ${slug}`);
  printInfo(`Template: ${template}`);
  printInfo(`Keyword: ${keyword || '(none set)'}`);
  console.log('\nNext steps:');
  console.log(`  1. Review the draft: content/drafts/${slug}.md`);
  console.log(`  2. Run SEO check: node scripts/seo-check.mjs --file content/drafts/${slug}.md`);
  console.log(`  3. Full pipeline: node scripts/pipeline.mjs --file content/drafts/${slug}.md`);
});


function generateDefaultContent(topic, template, keyword) {
  const kw = keyword || topic.toLowerCase();

  switch (template) {
    case 'ultimate-guide':
      return `# ${topic}

**In this guide, you'll learn:**
- [Key takeaway 1]
- [Key takeaway 2]
- [Key takeaway 3]

## What is ${kw}?

## Why ${kw} Matters

## How ${kw} Works (Step-by-Step)

### Step 1: [First Step]

### Step 2: [Second Step]

### Step 3: [Third Step]

## Common Mistakes to Avoid

## Pro Tips for Success

## Frequently Asked Questions

### Q: [Common question about ${kw}]?

### Q: [Another common question]?

## Conclusion

Ready to put this knowledge into practice? [Start your TradersYard challenge today](https://tradersyard.com/#pricing).`;

    case 'listicle':
      return `# ${topic}

**Quick Summary:**
| Rank | Name | Best For | Key Feature |
|------|------|----------|-------------|
| 1 | [Option 1] | [Use case] | [Feature] |
| 2 | [Option 2] | [Use case] | [Feature] |
| 3 | [Option 3] | [Use case] | [Feature] |

## 1. [First Item]

## 2. [Second Item]

## 3. [Third Item]

## How We Ranked These

## Frequently Asked Questions

## Final Thoughts`;

    case 'comparison':
      return `# ${topic}

## Quick Comparison

| Feature | [Option A] | [Option B] |
|---------|-----------|-----------|
| Price | $ | $ |
| Best For | | |

## [Option A] Overview

## [Option B] Overview

## Head-to-Head Comparison

## Our Verdict

## Frequently Asked Questions`;

    case 'success-story':
      return `# ${topic}

## The Challenge

## The Approach

## The Results

## Key Takeaways

## Start Your Journey`;

    default: // how-to
      return `# ${topic}

## Prerequisites

## Step 1: [First Step]

## Step 2: [Second Step]

## Step 3: [Third Step]

## Common Mistakes to Avoid

## Tips for Best Results

## Frequently Asked Questions

## Conclusion

Ready to get started? [Begin your TradersYard challenge](https://tradersyard.com/#pricing).`;
  }
}
