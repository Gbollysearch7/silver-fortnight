/**
 * AI Content Writer Module v2
 *
 * Unified AI writer supporting both Claude and OpenAI.
 * Automatically chooses best provider or allows manual selection.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { generateContent, buildArticlePrompt, estimateCost } from './ai-content-generator.mjs';
import { blogConfig, ROOT_DIR } from './config.mjs';

/**
 * Get published articles from keyword queue for interlinking.
 * Returns an array of { title, slug, keyword, url } for articles
 * most relevant to the given keyword (based on word overlap).
 */
function getRelatedPublishedArticles(currentKeyword, maxLinks = 3) {
  try {
    const queuePath = resolve(ROOT_DIR, 'data', 'keyword-queue.json');
    const queue = JSON.parse(readFileSync(queuePath, 'utf-8'));
    const published = queue.queue.filter(k => k.status === 'published' && k.slug);

    if (published.length === 0) return [];

    // Tokenize current keyword into words for matching
    const currentWords = new Set(
      currentKeyword.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2)
    );

    // Score each published article by keyword word overlap
    const scored = published.map(article => {
      const articleWords = [
        ...(article.keyword || '').toLowerCase().split(/\s+/),
        ...(article.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      ].filter(w => w.length > 2);

      let overlap = 0;
      for (const word of articleWords) {
        if (currentWords.has(word)) overlap++;
      }

      return {
        title: article.title || article.keyword,
        slug: article.slug,
        keyword: article.keyword,
        url: `https://tradersyard.com/blog-posts/${article.slug}`,
        score: overlap,
      };
    });

    // Sort by relevance (highest overlap first), then take top N
    // Always include at least some articles even with 0 overlap (random picks from published)
    scored.sort((a, b) => b.score - a.score);

    // Take top related + fill with random if needed
    const related = scored.slice(0, maxLinks);
    return related;
  } catch {
    return [];
  }
}

/**
 * Generate a full blog article using AI
 *
 * @param {object} params
 * @param {string} params.title - Blog post title
 * @param {string} params.keyword - Primary keyword
 * @param {string[]} params.secondaryKeywords - Secondary keywords
 * @param {string} params.template - Template type (ultimate-guide, listicle, etc.)
 * @param {string} params.category - Blog category
 * @param {object} params.research - Research insights from researcher.mjs
 * @param {string} params.templateContent - The template scaffold content (fallback)
 * @param {string} params.provider - AI provider ('claude', 'openai', 'auto')
 * @returns {Promise<object>} { content, description, secondaryKeywords, provider, cost }
 */
export async function generateArticle(params) {
  const {
    title,
    keyword,
    secondaryKeywords = [],
    template,
    category,
    research,
    templateContent,
    provider = 'gpt-4.1',  // Default to gpt-4.1 (OpenAI primary writer)
    tier = 0
  } = params;

  const templateConfig = blogConfig.templates[template] || { minWords: 1000, targetWords: 2000 };

  // Tier-aware word counts: Tier 0 = 800 words (brute force SEO Avalanche),
  // higher tiers get full template word counts
  const TIER_WORD_LIMITS = {
    0: 1000,   // Target 1000 so AI lands ~800 (GPT-4o-mini undershoots ~20-25%)
    10: 1200,  // Target 1200 so AI lands ~1000
    20: 1500,
    50: 2000,
    100: 2500,
  };
  const wordCount = TIER_WORD_LIMITS[tier] ?? templateConfig.targetWords;

  console.log(`\n🤖 AI Article Generator v2`);
  console.log(`   Title: "${title}"`);
  console.log(`   Template: ${template}`);
  console.log(`   Target: ${wordCount} words (Tier ${tier})`);
  console.log(`   Provider: ${provider}`);

  // Estimate cost before generating
  const costEstimate = estimateCost(wordCount, provider === 'auto' ? 'claude' : provider);
  console.log(`   Estimated cost: $${costEstimate.cost.toFixed(4)}`);

  // Get related published articles for interlinking (SEO Avalanche pyramid)
  const interlinks = getRelatedPublishedArticles(keyword, 3);
  if (interlinks.length > 0) {
    console.log(`   Interlinks: ${interlinks.length} related articles found`);
    interlinks.forEach(l => console.log(`     → ${l.title}`));
  }

  // Build prompt
  const promptData = {
    title,
    keyword,
    template,
    wordCount,
    category,
    tier,
    interlinks
  };

  // Add research data if available
  if (research) {
    // Prefer the rich Firecrawl research brief (full competitor content)
    if (research.researchBrief) {
      promptData.researchData = { firecrawlBrief: research.researchBrief };
    } else if (research.insights) {
      promptData.competitorAnalysis = formatCompetitorInsights(research.insights);
    }
  }

  const prompt = buildArticlePrompt(promptData);

  // Calculate max tokens — need generous limit to avoid truncation
  // 1 word ≈ 1.3 tokens, but we need 2x buffer since AI often writes more than target
  const maxTokens = Math.max(4096, Math.ceil(wordCount * 1.3 * 2.5));

  // Generate article
  console.log(`\n📝 Generating article...`);
  const result = await generateContent(prompt, {
    provider,
    maxTokens,
    fallback: true,  // Auto-fallback to other provider on error
    tier
  });

  console.log(`✅ Article generated successfully!`);
  console.log(`   Provider used: ${result.provider}`);
  console.log(`   Words: ~${Math.floor(result.usage.output_tokens / 1.3)}`);
  console.log(`   Actual cost: $${result.cost.total.toFixed(4)}`);

  // Extract metadata from content
  const content = result.content.trim();
  const actualWordCount = content.split(/\s+/).length;
  const description = extractDescription(content, keyword);
  const extractedKeywords = secondaryKeywords.length > 0
    ? secondaryKeywords
    : extractSecondaryKeywords(content, keyword);

  return {
    content,
    description,
    secondaryKeywords: extractedKeywords,
    wordCount: actualWordCount,
    provider: result.provider,
    cost: result.cost.total,
    usage: result.usage
  };
}

/**
 * Format competitor insights for the prompt
 */
function formatCompetitorInsights(insights) {
  if (!insights) return '';

  let formatted = `# Competitor Analysis

**${insights.competitorCount || 0} competitors analyzed:**

## Content Patterns
- Average word count: ${insights.avgWordCount || 1500} words
- Common content types: ${(insights.contentTypes || []).join(', ') || 'how-to guides, tutorials'}

## Common Topics (ranked by frequency):
${(insights.commonThemes || []).slice(0, 10).map((t, i) => `${i + 1}. ${t.theme} (${t.count} mentions)`).join('\n') || '1. Educational content\n2. Practical tips\n3. Step-by-step guides'}

## Coverage Gaps (opportunities):
${(insights.contentGaps || []).slice(0, 5).map((gap, i) => `${i + 1}. ${gap}`).join('\n') || '1. Real-world examples\n2. Common mistakes\n3. Advanced strategies'}

## Unique Angles to Explore:
${(insights.uniqueAngles || []).slice(0, 5).map((angle, i) => `${i + 1}. ${angle}`).join('\n') || '1. TradersYard perspective\n2. Trader success stories\n3. Industry insights'}

**Your goal:** Write content that covers everything competitors do + fills the gaps + adds unique value.
`;

  return formatted;
}

/**
 * Extract meta description from article content
 */
function extractDescription(content, keyword) {
  // Try to extract first paragraph after H1
  const lines = content.split('\n').filter(l => l.trim());
  let firstPara = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip H1
    if (line.startsWith('# ')) continue;
    // Skip other headings
    if (line.startsWith('#')) break;
    // Skip empty lines
    if (!line) continue;
    // Found first paragraph
    firstPara = line;
    break;
  }

  // Clean markdown formatting
  let desc = firstPara
    .replace(/\*\*/g, '')  // Remove bold
    .replace(/\*/g, '')    // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links to text only
    .trim();

  // Truncate to 150-160 chars
  if (desc.length > 160) {
    desc = desc.substring(0, 157) + '...';
  }

  // Ensure keyword is present
  if (keyword && !desc.toLowerCase().includes(keyword.toLowerCase())) {
    desc = `${keyword}: ${desc}`.substring(0, 160);
  }

  return desc || `Learn everything about ${keyword}. Expert insights and actionable tips.`;
}

/**
 * Extract secondary keywords from content
 */
function extractSecondaryKeywords(content, primaryKeyword) {
  // Common trading-related terms that might appear
  const tradingTerms = [
    'prop firm', 'proprietary trading', 'funded account', 'trading challenge',
    'profit split', 'drawdown', 'max drawdown', 'scaling plan', 'payout',
    'forex trading', 'day trading', 'swing trading', 'risk management',
    'trading strategy', 'trading rules', 'account size', 'profit target'
  ];

  const keywords = new Set();
  const contentLower = content.toLowerCase();

  for (const term of tradingTerms) {
    if (term === primaryKeyword.toLowerCase()) continue;
    if (contentLower.includes(term)) {
      keywords.add(term);
    }
  }

  // Return top 5
  return Array.from(keywords).slice(0, 5);
}

/**
 * Compare both AI providers for a specific article
 * (useful for testing which writes better)
 */
export async function compareProvidersForArticle(params) {
  console.log('\n🔬 Running A/B Test: Claude vs OpenAI\n');

  const [claudeResult, openaiResult] = await Promise.allSettled([
    generateArticle({ ...params, provider: 'claude' }),
    generateArticle({ ...params, provider: 'openai' })
  ]);

  const comparison = {
    claude: claudeResult.status === 'fulfilled'
      ? claudeResult.value
      : { error: claudeResult.reason.message },
    openai: openaiResult.status === 'fulfilled'
      ? openaiResult.value
      : { error: openaiResult.reason.message }
  };

  // Print comparison
  console.log('\n' + '═'.repeat(70));
  console.log('                  📊 COMPARISON RESULTS');
  console.log('═'.repeat(70) + '\n');

  for (const [provider, result] of Object.entries(comparison)) {
    if (result.error) {
      console.log(`❌ ${provider.toUpperCase()}: FAILED`);
      console.log(`   Error: ${result.error}\n`);
      continue;
    }

    console.log(`✅ ${provider.toUpperCase()}: SUCCESS`);
    console.log(`   Word count: ${result.wordCount} words`);
    console.log(`   Cost: $${result.cost.toFixed(4)}`);
    console.log(`   Description: ${result.description.substring(0, 80)}...`);
    console.log(`   Keywords: ${(result.secondaryKeywords || []).join(', ')}\n`);
  }

  console.log('═'.repeat(70) + '\n');

  return comparison;
}
