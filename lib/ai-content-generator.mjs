/**
 * AI Content Generator
 *
 * Unified interface for generating blog content using multiple AI providers:
 * - Anthropic Claude (Sonnet 4.5)
 * - OpenAI (GPT-4)
 *
 * Automatically falls back between providers if one fails.
 * Tracks costs and performance for each provider.
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from './config.mjs';

// Initialize clients
const anthropic = config.env.CLAUDE_API_KEY ? new Anthropic({
  apiKey: config.env.CLAUDE_API_KEY
}) : null;

const openai = config.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: config.env.OPENAI_API_KEY
}) : null;

// Cost tracking (per 1K tokens)
const PRICING = {
  claude: {
    model: 'claude-sonnet-4-5-20250929',
    input: 0.003,   // $3 per million tokens
    output: 0.015   // $15 per million tokens
  },
  openai: {
    model: 'gpt-4-turbo-preview',
    input: 0.01,    // $10 per million tokens
    output: 0.03    // $30 per million tokens
  }
};

/**
 * Generate content using Claude
 */
async function generateWithClaude(prompt, maxTokens = 4000) {
  if (!anthropic) {
    throw new Error('Claude API key not configured');
  }

  const startTime = Date.now();

  const message = await anthropic.messages.create({
    model: PRICING.claude.model,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Calculate cost
  const inputCost = (message.usage.input_tokens / 1000) * PRICING.claude.input;
  const outputCost = (message.usage.output_tokens / 1000) * PRICING.claude.output;
  const totalCost = inputCost + outputCost;

  return {
    provider: 'claude',
    model: PRICING.claude.model,
    content: message.content[0].text,
    usage: {
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
      total_tokens: message.usage.input_tokens + message.usage.output_tokens
    },
    cost: {
      input: inputCost,
      output: outputCost,
      total: totalCost
    },
    duration,
    raw: message
  };
}

/**
 * Generate content using OpenAI
 */
async function generateWithOpenAI(prompt, maxTokens = 4000) {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: PRICING.openai.model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: maxTokens
  });

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;

  // Calculate cost
  const inputCost = (completion.usage.prompt_tokens / 1000) * PRICING.openai.input;
  const outputCost = (completion.usage.completion_tokens / 1000) * PRICING.openai.output;
  const totalCost = inputCost + outputCost;

  return {
    provider: 'openai',
    model: PRICING.openai.model,
    content: completion.choices[0].message.content,
    usage: {
      input_tokens: completion.usage.prompt_tokens,
      output_tokens: completion.usage.completion_tokens,
      total_tokens: completion.usage.total_tokens
    },
    cost: {
      input: inputCost,
      output: outputCost,
      total: totalCost
    },
    duration,
    raw: completion
  };
}

/**
 * Generate content with automatic provider selection and fallback
 *
 * @param {string} prompt - The content generation prompt
 * @param {object} options - Generation options
 * @param {string} options.provider - Preferred provider ('claude', 'openai', 'auto')
 * @param {number} options.maxTokens - Max tokens to generate
 * @param {boolean} options.fallback - Whether to fallback to other provider on error
 * @returns {Promise<object>} Generated content with metadata
 */
export async function generateContent(prompt, options = {}) {
  const {
    provider = 'claude', // Default to Claude (better quality, lower cost)
    maxTokens = 4000,
    fallback = true
  } = options;

  const providers = provider === 'auto'
    ? ['claude', 'openai']  // Try both, pick best
    : [provider];

  let lastError = null;

  for (const prov of providers) {
    try {
      console.log(`🤖 Generating content with ${prov}...`);

      const result = prov === 'claude'
        ? await generateWithClaude(prompt, maxTokens)
        : await generateWithOpenAI(prompt, maxTokens);

      console.log(`✅ Generated ${result.usage.output_tokens} tokens in ${result.duration.toFixed(2)}s`);
      console.log(`💰 Cost: $${result.cost.total.toFixed(4)}`);

      return result;

    } catch (error) {
      console.error(`❌ ${prov} failed: ${error.message}`);
      lastError = error;

      if (!fallback) {
        throw error;
      }

      // Try next provider
      continue;
    }
  }

  // All providers failed
  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

/**
 * Build prompt for blog article generation
 */
export function buildArticlePrompt(options) {
  const {
    title,
    keyword,
    template,
    wordCount,
    category,
    researchData = null,
    competitorAnalysis = null
  } = options;

  // Template-specific instructions
  const templateInstructions = {
    'ultimate-guide': `Write a comprehensive ultimate guide.
- In-depth coverage of all aspects
- Multiple sections with detailed explanations
- Actionable tips and best practices
- Real-world examples
- Common mistakes to avoid`,

    'listicle': `Write an engaging listicle article.
- Clear numbered list structure
- Concise but informative sections
- Compelling reasons/benefits for each item
- Mix of well-known and lesser-known points
- Strong introduction and conclusion`,

    'how-to': `Write a practical how-to tutorial.
- Clear step-by-step instructions
- Prerequisites and requirements
- Numbered steps with details
- Screenshots/visual guidance callouts
- Expected outcomes
- Troubleshooting tips`,

    'comparison': `Write a detailed comparison article.
- Side-by-side comparison table
- Pros and cons for each option
- Use cases and recommendations
- Pricing comparison
- Feature breakdown
- Final verdict based on user type`,

    'success-story': `Write an inspiring success story.
- Engaging narrative structure
- Real trader challenges and solutions
- Specific numbers and results
- Key lessons learned
- Takeaways for readers
- Motivational conclusion`
  };

  const templateGuide = templateInstructions[template] || templateInstructions['ultimate-guide'];

  let prompt = `You are writing a blog post for TradersYard, a proprietary trading firm.

# Article Details
- Title: "${title}"
- Primary Keyword: "${keyword}"
- Template Type: ${template}
- Target Word Count: ${wordCount} words
- Category: ${category}

# Template Instructions
${templateGuide}

# TradersYard Context
TradersYard is a proprietary trading firm that provides funded accounts to skilled traders. We offer:
- Multiple challenge types (1-Step, 2-Step)
- Up to $200,000 in funding
- 80% profit split
- No time limits on challenges
- Industry-leading support

# Content Requirements

## Tone & Style
- Professional but conversational
- Educational and helpful
- Confident but not salesy
- Use "we" when referring to TradersYard
- Use "you" when addressing readers

## SEO Requirements
- Include primary keyword "${keyword}" naturally in:
  - First 100 words
  - At least 2 H2 headings
  - Meta-naturally throughout body (don't force it)
- Use variations and related terms
- **CRITICAL:** Include at least 1-2 external links to authority sources:
  - Investopedia (for definitions and educational content)
  - TradingView (for charts and market data)
  - CFTC/SEC/FINRA (for regulations)
  - BabyPips, DailyFX, or MyFXBook (for trading education)
  - Forbes, Bloomberg, WSJ, Reuters (for market news/context)
  - Link naturally in context where they add value
  - Use descriptive anchor text (not "click here")
- Include internal linking opportunities (mention other TradersYard topics)

## Structure Requirements
- Start with a compelling hook
- Use short paragraphs (2-4 sentences max)
- Include bullet points and numbered lists
- Use H2 and H3 headings for scanability
- End with clear call-to-action

## Content Quality
- Fact-check all claims (especially pricing, rules, statistics)
- Provide specific numbers and data where possible
- Include real-world examples
- Avoid generic advice - be specific
- No fluff or filler content

## Formatting
- Use markdown formatting
- Bold important terms on first mention
- Use tables for comparisons
- Include FAQ section if relevant
- Add callout boxes for important tips (use > blockquotes)`;

  // Add research data if available
  if (researchData) {
    prompt += `\n\n# Research Data\n${JSON.stringify(researchData, null, 2)}`;
  }

  // Add competitor analysis if available
  if (competitorAnalysis) {
    prompt += `\n\n# Competitor Analysis\nUse this to understand what competitors cover, but write BETTER content:\n${competitorAnalysis}`;
  }

  prompt += `\n\n# Final Instructions
Write the complete article now. Do not include frontmatter (YAML) - just write the markdown content starting with the H1 title.

Make it informative, engaging, and valuable to traders. This should be publish-ready content.`;

  return prompt;
}

/**
 * Compare outputs from both providers (for A/B testing)
 */
export async function compareProviders(prompt, maxTokens = 4000) {
  console.log('🔬 Running A/B test: Claude vs OpenAI\n');

  const results = await Promise.allSettled([
    generateContent(prompt, { provider: 'claude', maxTokens, fallback: false }),
    generateContent(prompt, { provider: 'openai', maxTokens, fallback: false })
  ]);

  const comparison = {
    claude: results[0].status === 'fulfilled' ? results[0].value : { error: results[0].reason.message },
    openai: results[1].status === 'fulfilled' ? results[1].value : { error: results[1].reason.message }
  };

  // Print comparison
  console.log('\n📊 Comparison Results:');
  console.log('━'.repeat(60));

  for (const [provider, result] of Object.entries(comparison)) {
    if (result.error) {
      console.log(`\n❌ ${provider.toUpperCase()}: Failed`);
      console.log(`   Error: ${result.error}`);
      continue;
    }

    console.log(`\n✅ ${provider.toUpperCase()}:`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Tokens: ${result.usage.output_tokens} (${result.usage.total_tokens} total)`);
    console.log(`   Duration: ${result.duration.toFixed(2)}s`);
    console.log(`   Cost: $${result.cost.total.toFixed(4)}`);
    console.log(`   Speed: ${(result.usage.output_tokens / result.duration).toFixed(0)} tokens/sec`);
  }

  console.log('\n━'.repeat(60));

  return comparison;
}

/**
 * Estimate cost for a generation job
 */
export function estimateCost(wordCount, provider = 'claude') {
  // Rough estimate: 1 word ≈ 1.3 tokens
  const estimatedInputTokens = 1000;  // Average prompt size
  const estimatedOutputTokens = wordCount * 1.3;

  const pricing = PRICING[provider];
  const inputCost = (estimatedInputTokens / 1000) * pricing.input;
  const outputCost = (estimatedOutputTokens / 1000) * pricing.output;

  return {
    provider,
    estimatedTokens: estimatedInputTokens + estimatedOutputTokens,
    cost: inputCost + outputCost
  };
}

// Export pricing for reference
export { PRICING };
