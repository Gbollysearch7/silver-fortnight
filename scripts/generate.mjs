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

printHeader('Blog Post Generator');

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

if (scaffoldOnly || !hasAI) {
  // Scaffold mode — old behavior
  if (!hasAI && !scaffoldOnly) {
    printWarning('No AI API keys set (CLAUDE_API_KEY or OPENAI_API_KEY) — falling back to scaffold mode');
  }
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
        const verified = researchData.factCheckResult.verifiedData;
        if (verified.tradersyard) {
          printSuccess('TradersYard data verified from Supabase');
        }
        if (verified.propFirms.length > 0) {
          printSuccess(`${verified.propFirms.length} prop firms verified`);
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
      printWarning('Falling back to template scaffold');
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
        provider
      });

      articleContent = result.content;
      description = result.description;
      secondaryKeywords = result.secondaryKeywords;
      aiCost = result.cost;
      aiProvider = result.provider;
      printSuccess(`Article generated: ${result.wordCount} words, $${aiCost.toFixed(4)} (${aiProvider})`);
    } catch (err) {
      printError(`AI generation failed: ${err.message}`);
      printWarning('Falling back to template scaffold');
    }
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
