/**
 * AI Content Writer Module
 * Uses OpenAI GPT-4o to generate full blog articles from research data.
 *
 * Zero dependencies — uses native fetch() (Node 22).
 */

import { OPENAI_API_KEY } from './config.mjs';
import { blogConfig } from './config.mjs';
import { formatVerifiedDataForPrompt } from './fact-checker.mjs';

const OPENAI_API_BASE = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate a full blog article using GPT-4o.
 * @param {object} params
 * @param {string} params.title - Blog post title
 * @param {string} params.keyword - Primary keyword
 * @param {string[]} params.secondaryKeywords - Secondary keywords
 * @param {string} params.template - Template type (ultimate-guide, listicle, etc.)
 * @param {string} params.category - Blog category
 * @param {object} params.research - Research insights from researcher.mjs
 * @param {string} params.templateContent - The template scaffold content
 * @returns {object} { content, description, secondaryKeywords }
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
  } = params;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in .env');
  }

  const templateConfig = blogConfig.templates[template] || { minWords: 1000, targetWords: 2000 };
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    title,
    keyword,
    secondaryKeywords,
    template,
    category,
    templateConfig,
    research,
    templateContent,
  });

  console.log(`[ai-writer] Generating article: "${title}" (${template}, target: ${templateConfig.targetWords} words)`);

  const response = await callOpenAI(systemPrompt, userPrompt, templateConfig.targetWords);

  // Parse the response — expect markdown content
  const content = response.trim();
  const wordCount = content.split(/\s+/).length;
  console.log(`[ai-writer] Generated ${wordCount} words`);

  // Extract a meta description from the content
  const description = extractDescription(content, keyword);

  // Extract secondary keywords from the content if none provided
  const extractedKeywords = secondaryKeywords.length > 0
    ? secondaryKeywords
    : extractSecondaryKeywords(content, keyword);

  return {
    content,
    description,
    secondaryKeywords: extractedKeywords,
    wordCount,
  };
}

function buildSystemPrompt() {
  return `You are an expert SEO blog writer for TradersYard (https://tradersyard.com), a proprietary trading firm that funds traders.

BRAND CONTEXT:
- TradersYard is a prop trading firm that provides funded accounts to traders
- They offer trading challenges where traders prove their skills to get funded
- Target audience: forex traders, aspiring funded traders, people researching prop firms
- Tone: Professional but approachable. Authoritative yet encouraging. Data-driven.
- Always position TradersYard favorably but honestly — never bash competitors unfairly
- CTA: "Start your TradersYard challenge today" → https://tradersyard.com/#pricing

WRITING RULES:
1. Write in a natural, human tone — avoid robotic AI patterns
2. Use short paragraphs (2-4 sentences max)
3. Include specific numbers, data points, and examples wherever possible
4. Use the primary keyword naturally in the first 100 words
5. Include the primary keyword in at least one H2 heading
6. Add 3+ internal links to https://tradersyard.com (pricing, about, blog, etc.)
7. Include a comparison table where relevant
8. Write a FAQ section with 3-5 real questions people ask
9. End with a clear CTA to TradersYard
10. Do NOT use placeholder text like [insert X] or [your topic here]
11. Do NOT use cliche AI phrases like "In today's fast-paced world", "dive into", "navigate the landscape", "game-changer", "unlock your potential"
12. Write as if you are an experienced trader sharing real knowledge
13. Use markdown formatting: ## for H2, ### for H3, **bold**, bullet lists, tables
14. Do NOT include the H1 title — it will be added from frontmatter
15. Do NOT include frontmatter/YAML — only return the article body content`;
}

function buildUserPrompt(params) {
  const {
    title,
    keyword,
    secondaryKeywords,
    template,
    category,
    templateConfig,
    research,
    templateContent,
  } = params;

  let prompt = `Write a comprehensive blog article for TradersYard.

ARTICLE DETAILS:
- Title: "${title}"
- Primary Keyword: "${keyword}"
- Secondary Keywords: ${secondaryKeywords.length > 0 ? secondaryKeywords.join(', ') : 'extract from research'}
- Template Type: ${template}
- Category: ${category}
- Target Word Count: ${templateConfig.targetWords} words (minimum ${templateConfig.minWords})

TEMPLATE STRUCTURE TO FOLLOW:
${templateContent}
`;

  // Add VERIFIED DATA first (highest priority)
  if (research && research.factCheckResult) {
    prompt += formatVerifiedDataForPrompt(research.factCheckResult);
  }

  // Add research context if available
  if (research && research.insights) {
    const insights = research.insights;

    prompt += `\nCOMPETITOR RESEARCH (for structure/topics only, NOT for facts):
- ${insights.competitorCount} competitor articles analyzed
- Average competitor word count: ${insights.avgWordCount} words (aim to beat this)
`;

    if (insights.commonThemes.length > 0) {
      prompt += `\nCOMMON TOPICS COMPETITORS COVER (make sure to include these + more):
${insights.commonThemes.slice(0, 10).map(t => `- ${t.theme} (${t.count} competitors)`).join('\n')}
`;
    }

    if (insights.uniqueQuestions.length > 0) {
      prompt += `\nQUESTIONS PEOPLE ASK (use for FAQ section):
${insights.uniqueQuestions.slice(0, 8).map(q => `- ${q}`).join('\n')}
`;
    }

    if (insights.competitorSummaries && insights.competitorSummaries.length > 0) {
      prompt += `\nTOP COMPETITOR CONTENT (write something BETTER and more comprehensive):
`;
      for (const comp of insights.competitorSummaries.slice(0, 2)) {
        prompt += `\n--- ${comp.title} (${comp.wordCount} words) ---
${comp.content.slice(0, 2000)}
...
`;
      }
    }
  }

  prompt += `
IMPORTANT REMINDERS:
- Write ${templateConfig.targetWords}+ words of REAL, valuable content
- NO placeholder text — every section must have real, substantive content
- Include specific numbers, examples, and actionable advice
- Naturally weave in the keyword "${keyword}" throughout (aim for 0.5-1.5% density)
- Include at least 3 internal links to tradersyard.com pages
- Write the FAQ with real questions and detailed answers
- End with a compelling CTA to TradersYard
- Do NOT include an H1 or frontmatter — start directly with the content body
- Output ONLY the markdown article body — no preamble or explanation`;

  return prompt;
}

/**
 * Call OpenAI API.
 */
async function callOpenAI(systemPrompt, userPrompt, targetWords) {
  // Estimate tokens needed: ~1.3 tokens per word for output
  const maxTokens = Math.min(Math.max(Math.round(targetWords * 1.5), 3000), 12000);

  const res = await fetch(OPENAI_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message?.content;

  if (!message) {
    throw new Error('OpenAI returned empty response');
  }

  // Log token usage
  if (data.usage) {
    console.log(`[ai-writer] Tokens — prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens}, total: ${data.usage.total_tokens}`);
  }

  return message;
}

/**
 * Extract a meta description from the generated content.
 */
function extractDescription(content, keyword) {
  // Take the first meaningful paragraph (not a heading, not a list)
  const lines = content.split('\n').filter(l => {
    const t = l.trim();
    return t.length > 50 && !t.startsWith('#') && !t.startsWith('-') && !t.startsWith('|') && !t.startsWith('*');
  });

  if (lines.length === 0) {
    return `Learn everything about ${keyword}. Comprehensive guide with actionable tips and expert insights from TradersYard.`;
  }

  // Clean markdown formatting
  let desc = lines[0]
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

  // Trim to ~155 characters at a word boundary
  if (desc.length > 160) {
    desc = desc.slice(0, 157);
    desc = desc.slice(0, desc.lastIndexOf(' ')) + '...';
  }

  return desc;
}

/**
 * Extract secondary keywords from the generated content.
 */
function extractSecondaryKeywords(content, primaryKeyword) {
  const primaryWords = new Set(primaryKeyword.toLowerCase().split(/\s+/));
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and', 'or', 'if', 'while', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'your', 'you', 'they', 'them', 'their', 'its', 'our', 'we', 'also', 'about']);

  // Extract 2-3 word phrases from H2/H3 headings
  const headings = [];
  const headingRegex = /^#{2,3} (.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content))) {
    headings.push(match[1].toLowerCase().replace(/[^a-z0-9\s]/g, '').trim());
  }

  // Filter headings to find keyword-like phrases
  const candidates = headings
    .filter(h => h.length > 5 && h.length < 50)
    .filter(h => !primaryWords.has(h))
    .filter(h => {
      const words = h.split(/\s+/);
      return words.length >= 2 && words.length <= 5;
    })
    .slice(0, 5);

  return candidates.length > 0 ? candidates : ['trading', 'funded account', 'prop firm'];
}
