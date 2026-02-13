/**
 * AI Content Writer Module v2
 *
 * Unified AI writer supporting both Claude and OpenAI.
 * Automatically chooses best provider or allows manual selection.
 */

import { generateContent, buildArticlePrompt, estimateCost } from './ai-content-generator.mjs';
import { blogConfig } from './config.mjs';
import { formatVerifiedDataForPrompt } from './fact-checker.mjs';

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
    provider = 'claude'  // Default to Claude (better quality, lower cost)
  } = params;

  const templateConfig = blogConfig.templates[template] || { minWords: 1000, targetWords: 2000 };
  const wordCount = templateConfig.targetWords;

  console.log(`\n🤖 AI Article Generator v2`);
  console.log(`   Title: "${title}"`);
  console.log(`   Template: ${template}`);
  console.log(`   Target: ${wordCount} words`);
  console.log(`   Provider: ${provider}`);

  // Estimate cost before generating
  const costEstimate = estimateCost(wordCount, provider === 'auto' ? 'claude' : provider);
  console.log(`   Estimated cost: $${costEstimate.cost.toFixed(4)}`);

  // Build prompt
  const promptData = {
    title,
    keyword,
    template,
    wordCount,
    category
  };

  // Add research data if available
  if (research) {
    if (research.insights) {
      promptData.competitorAnalysis = formatCompetitorInsights(research.insights);
    }
    if (research.factCheckResult) {
      promptData.researchData = formatVerifiedDataForPrompt(research.factCheckResult.verifiedData);
    }
  }

  const prompt = buildArticlePrompt(promptData);

  // Calculate max tokens (roughly 1.3 tokens per word + 20% buffer)
  const maxTokens = Math.ceil(wordCount * 1.3 * 1.2);

  // Generate article
  console.log(`\n📝 Generating article...`);
  const result = await generateContent(prompt, {
    provider,
    maxTokens,
    fallback: true  // Auto-fallback to other provider on error
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

**${insights.competitorCount} competitors analyzed:**

## Content Patterns
- Average word count: ${insights.avgWordCount} words
- Common content types: ${insights.contentTypes.join(', ')}

## Common Topics (ranked by frequency):
${insights.commonThemes.slice(0, 10).map((t, i) => `${i + 1}. ${t.theme} (${t.count} mentions)`).join('\n')}

## Coverage Gaps (opportunities):
${insights.contentGaps.slice(0, 5).map((gap, i) => `${i + 1}. ${gap}`).join('\n')}

## Unique Angles to Explore:
${insights.uniqueAngles.slice(0, 5).map((angle, i) => `${i + 1}. ${angle}`).join('\n')}

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
    console.log(`   Keywords: ${result.secondaryKeywords.join(', ')}\n`);
  }

  console.log('═'.repeat(70) + '\n');

  return comparison;
}
