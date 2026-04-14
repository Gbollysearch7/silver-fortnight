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
    model: 'gpt-4o-mini',
    input: 0.00015,   // $0.15 per million tokens
    output: 0.0006    // $0.60 per million tokens
  },
  'openai-4o': {
    model: 'gpt-4o',
    input: 0.0025,    // $2.50 per million tokens
    output: 0.01      // $10 per million tokens
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
 * @param {string} prompt
 * @param {number} maxTokens
 * @param {string} modelTier - 'openai' for gpt-4o-mini, 'openai-4o' for gpt-4o
 */
async function generateWithOpenAI(prompt, maxTokens = 4000, modelTier = 'openai') {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const pricing = PRICING[modelTier] || PRICING.openai;
  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: pricing.model,
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
  const inputCost = (completion.usage.prompt_tokens / 1000) * pricing.input;
  const outputCost = (completion.usage.completion_tokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    provider: 'openai',
    model: pricing.model,
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
    provider = 'claude',
    maxTokens = 4000,
    fallback = true,
    tier = 0
  } = options;

  // Determine OpenAI model tier: gpt-4o-mini for Tier 0-10, gpt-4o for Tier 20+
  const openaiModelTier = tier >= 20 ? 'openai-4o' : 'openai';

  const providers = provider === 'auto'
    ? ['claude', 'openai']  // Try both, pick best
    : [provider];

  let lastError = null;

  for (const prov of providers) {
    try {
      const modelLabel = prov === 'openai' ? PRICING[openaiModelTier].model : prov;
      console.log(`🤖 Generating content with ${modelLabel}...`);

      const result = prov === 'claude'
        ? await generateWithClaude(prompt, maxTokens)
        : await generateWithOpenAI(prompt, maxTokens, openaiModelTier);

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
 * Build research-aware instructions for the AI writer.
 * Extracts competitor gaps, stale facts, and content opportunities.
 */
function buildResearchInstructions(researchData) {
  let instructions = '\n\n# Competitor Research & Content Gaps\n';
  instructions += 'We researched the top-ranking articles for this keyword. Use this intelligence to write a BETTER article.\n\n';

  // Competitor summaries — what they cover
  if (researchData.insights) {
    const { competitorCount, avgWordCount, commonThemes, uniqueQuestions, competitorSummaries } = researchData.insights;

    instructions += `## Competitor Landscape\n`;
    instructions += `- ${competitorCount} competitor articles analyzed\n`;
    instructions += `- Average word count: ${avgWordCount} words — match or exceed this\n\n`;

    // Common themes they ALL cover (must include these)
    if (commonThemes && commonThemes.length > 0) {
      instructions += `## Topics All Competitors Cover (you MUST cover these too):\n`;
      commonThemes.slice(0, 8).forEach(t => {
        instructions += `- ${t.theme} (mentioned in ${t.count} articles)\n`;
      });
      instructions += '\n';
    }

    // Questions competitors answer (include in FAQ)
    if (uniqueQuestions && uniqueQuestions.length > 0) {
      instructions += `## Questions Competitors Answer (consider for your FAQ section):\n`;
      uniqueQuestions.slice(0, 6).forEach(q => {
        instructions += `- ${q}\n`;
      });
      instructions += '\n';
    }

    // Content gaps — what competitors miss
    if (competitorSummaries && competitorSummaries.length > 0) {
      instructions += `## CONTENT GAP ANALYSIS (CRITICAL — this is how we beat them):\n`;
      instructions += `Look at what competitors cover below. Your job is to:\n`;
      instructions += `1. Cover everything they cover (table stakes)\n`;
      instructions += `2. Add UNIQUE angles they all miss — practical tips, real numbers, specific examples, edge cases\n`;
      instructions += `3. Be more specific where they are vague\n`;
      instructions += `4. Add actionable takeaways where they just describe concepts\n`;
      instructions += `5. If they have outdated info (old pricing, discontinued features), use CURRENT 2026 data\n\n`;

      competitorSummaries.slice(0, 3).forEach((comp, i) => {
        instructions += `### Competitor ${i + 1}: "${comp.title}" (${comp.wordCount} words)\n`;
        instructions += `Source: ${comp.url}\n`;
        // Truncate to avoid massive prompts
        const preview = comp.content.slice(0, 1500);
        instructions += `Content preview:\n${preview}\n...\n\n`;
      });
    }
  }

  // Fact-check results — verified data to use
  if (researchData.factCheckResult) {
    const { verifiedData, warnings } = researchData.factCheckResult;

    if (verifiedData?.propFirms?.length > 0) {
      instructions += `## Verified Facts (use these — they are CURRENT and confirmed):\n`;
      verifiedData.propFirms.forEach(firm => {
        instructions += `- ${firm.name}: ${JSON.stringify(firm)}\n`;
      });
      instructions += '\n';
    }

    if (warnings && warnings.length > 0) {
      instructions += `## STALE DATA WARNINGS (competitor info that may be outdated):\n`;
      warnings.forEach(w => {
        instructions += `- ⚠️ ${w}\n`;
      });
      instructions += `\nDo NOT repeat stale/outdated claims. Use only verified, current data.\n\n`;
    }
  }

  return instructions;
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
    tier = 0,
    interlinks = [],
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

  // Build interlink instructions from published articles
  let interlinkInstructions = '';
  if (interlinks.length > 0) {
    const linkList = interlinks.map(l => `- [${l.title}](${l.url})`).join('\n');
    interlinkInstructions = `
Internal links to OTHER blog posts (REQUIRED — link to these naturally within the article body):
${linkList}
Weave these links into relevant paragraphs using descriptive anchor text. Do NOT list them — embed them in sentences where they add value.`;
  }

  // Factual accuracy rules — injected into EVERY article prompt
  const factualAccuracyRules = `
FACTUAL ACCURACY RULES (MANDATORY — NEVER VIOLATE):
You are writing for a regulated fintech company. False claims are a legal and regulatory problem, not just an SEO issue.

NEVER INVENT:
- Financial figures (payouts, funded traders, volume, revenue) — no round numbers like "$12M paid out" or "10,000+ traders"
- Superlatives without proof ("fastest," "best," "industry-leading") — name the comparison or don't say it
- Statistics without a named source — "studies show 90% fail" with no citation is fabrication
- Features not on the verified list below

VERIFIED TRADERSYARD FACTS (use ONLY these):
- Entry from £31, max account $500,000
- Payout speed: 24-48 hours (NOT "under 4 hours" or "instant")
- Profit split: 80-95%
- One-step evaluation, static drawdown (no trailing drawdown)
- News trading: allowed, EA trading: allowed, Hedging: single account only
- Platforms: MT4, MT5, cTrader
- Austrian-based, EU-compliant
- Payment: crypto, bank transfer

WHEN YOU DON'T KNOW A NUMBER:
- ❌ "Join thousands of funded traders" → ✅ "TradersYard has funded traders across Europe, Africa, and Asia"
- ❌ "Over $12M paid out" → ✅ "Withdrawals processed within 24-48 hours"
- ❌ "Most traders pass first try" → ✅ "The one-step evaluation is designed to be achievable with disciplined risk management"

Use specificity over hype. A comparison table beating competitors on 3 of 5 criteria is more credible than 5 unverified superlatives.
If unsure about any claim, write around it using verified facts. NEVER guess.`;

  // --- BRAND VOICE DEFINITION (used in ALL tiers) ---
  // TradersYard writes like a senior trader who's seen it all — direct, specific,
  // opinionated. NOT a Wikipedia article. NOT a generic how-to listicle.
  // Think: Bloomberg opinion piece meets experienced prop trader's blog.
  const brandVoice = `
TRADERSYARD BRAND VOICE (NON-NEGOTIABLE — THIS IS HOW WE WRITE):

You are writing as TradersYard — an Austrian prop firm that has seen thousands of traders pass and fail evaluations. Your voice is:

TONE:
- Direct and confident. State your view. Don't hedge everything with "it depends" or "some traders think."
- Opinionated but grounded. Back opinions with specifics: numbers, scenarios, comparisons.
- Knowledgeable, not academic. You explain things like a senior trader at a desk, not a textbook.
- Conversational but professional. Short sentences. Occasional bluntness. Real talk.

WHAT THIS SOUNDS LIKE:
✅ "Most traders fail prop firm challenges not because of bad strategy — they fail because they can't survive a losing streak psychologically. The rules don't break them. They break themselves."
✅ "A 5% daily drawdown sounds generous until you've watched three bad trades erase it in 40 minutes. Know your number before you open a position."
✅ "Weekend holding is allowed at TradersYard. But the real question is whether YOU should hold over the weekend — and for most retail traders, the answer is no."

WHAT THIS DOES NOT SOUND LIKE:
❌ "Step 1: Choose a prop firm. Step 2: Read the rules. Step 3: Create a plan." — NEVER write like a Wikipedia how-to
❌ "There are many different perspectives on this topic." — Take a position.
❌ "It is important to consider various factors." — Be specific. Which factors? What numbers?
❌ "Join thousands of funded traders worldwide." — No invented claims. See factual accuracy rules.

STRUCTURE THAT WORKS:
- Open with a 2-3 sentence hook that names the real problem traders face — specific, not vague
- Use H2s to divide the article into clear topics — no "Step 1, Step 2" headings
- Each section: 2-4 short paragraphs of prose. Get to the point fast.
- Use bullet points ONLY for actual lists (4+ items, parallel structure). Never bullet-ize prose.
- Use bold to highlight key terms and critical numbers, not random phrases
- Close with a real conclusion that gives the trader a clear action to take
- FAQ at the end: real questions traders actually Google, answered directly in 2-3 sentences

SENTENCE RHYTHM:
- Vary length. Short sentences land harder. Then explain with a longer one that gives the "why."
- Never write 3 long sentences in a row. Break it up.
- Paragraphs are 2-4 sentences max. White space is your friend.`;

  // --- Tier 0 & 10: Lean, direct articles (SEO Avalanche foundation) ---
  if (tier <= 10) {
    let prompt = `You are writing a blog post for TradersYard — an Austrian-based, EU-compliant prop trading firm (funded accounts up to $500K, 80-95% profit split, 1-Step evaluation).

Title: "${title}"
Primary Keyword: "${keyword}"
Target: EXACTLY ${wordCount} words — write every word, do not stop short

${brandVoice}

ARTICLE REQUIREMENTS:
- H1 is the title. First paragraph (2-3 sentences) contains the keyword and states the core insight of the article immediately — no throat-clearing.
- IMPORTANT: If the title contains a number (e.g. "7 rules"), your article must deliver exactly that many. Never promise more than you deliver.
- 4-6 H2 sections. Each section is a specific angle on the topic — not generic steps.
- Keyword appears naturally 3-5 times across the article. Not forced, not crammed.
- 1 internal link to https://tradersyard.com/#pricing — linked naturally in context
- 1 external link to a real, relevant Investopedia article (e.g. https://www.investopedia.com/terms/p/proprietarytrading.asp) — use a URL that actually matches the context
${interlinkInstructions}
- End with "## Frequently Asked Questions" — 2-3 questions traders actually ask about this topic, answered directly in 2-3 sentences each. Bold the question with "**Q:**" format.
- Final line: [Start your TradersYard challenge today](https://tradersyard.com/#pricing)

${factualAccuracyRules}

Write the complete article now. No frontmatter. Start with the H1 title.`;

    if (researchData) {
      prompt += buildResearchInstructions(researchData);
    }
    if (competitorAnalysis) {
      prompt += `\n\nCompetitor context (write better than this):\n${competitorAnalysis}`;
    }

    return prompt;
  }

  // --- Tier 20+: Full-length authoritative articles ---
  let prompt = `You are writing a blog post for TradersYard — an Austrian-based, EU-compliant prop trading firm.

# Article Details
- Title: "${title}"
- Primary Keyword: "${keyword}"
- Template Type: ${template}
- Target Word Count: ${wordCount} words
- Category: ${category}

${brandVoice}

# TradersYard Verified Facts (use ONLY these — do not embellish)
- One-step evaluation model
- Accounts from £31 up to $500,000
- 80-95% profit split
- Static drawdown (no trailing drawdown)
- Payouts within 24-48 hours
- News trading, EA trading, hedging (single account) allowed
- Platforms: MT4, MT5, cTrader
- Payment: crypto, bank transfer
- Austrian-based, EU-compliant

# SEO Requirements (CRITICAL)
1. **Keyword "${keyword}":** In H1, in first 100 words, in at least 2 H2s, in closing. Density 0.8-1.5%.
2. **External authority links (at least 2 REQUIRED):**
   - Investopedia (ALWAYS) — link to a real relevant URL like https://www.investopedia.com/terms/p/proprietarytrading.asp
   - Second: TradingView, BabyPips, DailyFX, CFTC, Bloomberg, or Reuters
3. **Internal links:**
   - https://tradersyard.com/#pricing — when mentioning challenges, getting started, or pricing
   - https://tradersyard.com — when mentioning the company name
${interlinks.length > 0 ? `   - Link to these related posts naturally within the body (embed in sentences, do NOT list them):
${interlinks.map(l => `     - [${l.title}](${l.url})`).join('\n')}` : ''}
4. **Headings:** H1 → H2 → H3 only. Each H2 covers a distinct angle.

# Structure
- Open with a hook paragraph that names the real problem or opportunity — specific, not vague
- H2 sections that cover the topic from multiple angles (not numbered steps)
- Include a comparison table where it genuinely helps the reader
- FAQ section near the end (4-6 questions, real ones traders actually search for)
- Strong closing with CTA: [Start your TradersYard challenge today](https://tradersyard.com/#pricing)

# FAQ Format (REQUIRED — use this EXACTLY)
**Q: [Specific question traders actually ask]?**

[Answer in 2-3 direct sentences as a paragraph.]

**Q: [Another real question]?**

[Answer paragraph.]

# Content Quality
- Every paragraph earns its place. No filler, no vague generalities.
- Specific numbers, real scenarios, honest assessments.
- Where competitors are vague, be concrete. Where they use generic advice, use real examples.

${factualAccuracyRules}`;

  if (researchData) {
    prompt += buildResearchInstructions(researchData);
  }

  if (competitorAnalysis) {
    prompt += `\n\n# Competitor Analysis\nStudy what competitors cover. Beat them by being more specific, more direct, and more honest:\n${competitorAnalysis}`;
  }

  prompt += `\n\n# Write the Article Now
Start with the H1 title. No frontmatter. No meta commentary.

The article must:
- Sound like TradersYard — direct, knowledgeable, opinionated
- Use paragraphs as the primary format, not bullet lists
- Include the FAQ section in bold Q: format
- End with the linked CTA
- Include 2+ external authority links and 3+ internal TradersYard links

Write all ${wordCount} words. Do not stop short.`;

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
