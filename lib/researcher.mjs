/**
 * Competitor Research Module
 *
 * Uses Firecrawl as PRIMARY research engine:
 *   1. Search: find top-ranking articles for the keyword
 *   2. Scrape: read full content of top 3 competitor pages
 *   3. Extract: headings, topics, questions, content gaps
 *
 * Fallback: gpt-4o-search-preview (if Firecrawl has no credits)
 *
 * Zero dependencies — uses native fetch() (Node 22).
 */

import { config } from './config.mjs';

const FIRECRAWL_API_KEY = config.env.FIRECRAWL_API_KEY;
const OPENAI_API_KEY = config.env.OPENAI_API_KEY;
const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

/**
 * Research a keyword using Firecrawl (primary) or OpenAI search (fallback).
 *
 * @param {string} keyword - The primary keyword to research
 * @param {object} opts
 * @param {number} opts.searchLimit  - Search results to fetch (default: 5)
 * @param {number} opts.scrapeLimit  - Pages to read in full (default: 3)
 * @param {string} opts.title        - Blog post title (for context)
 * @returns {object} { searchResults, competitorContent, insights, researchBrief }
 */
export async function research(keyword, opts = {}) {
  const { searchLimit = 5, scrapeLimit = 3, title = '' } = opts;

  // Try Firecrawl first
  if (FIRECRAWL_API_KEY) {
    const hasCredits = await checkFirecrawlCredits();
    if (hasCredits) {
      console.log(`  🔍 Researching "${keyword}" via Firecrawl...`);
      return await researchWithFirecrawl(keyword, { searchLimit, scrapeLimit, title });
    } else {
      console.warn('  ⚠️  Firecrawl credits exhausted — falling back to OpenAI search');
    }
  }

  // Fallback: OpenAI gpt-4o-search-preview
  if (OPENAI_API_KEY) {
    console.log(`  🔍 Researching "${keyword}" via OpenAI search (fallback)...`);
    return await researchWithOpenAI(keyword, title);
  }

  console.warn('  ⚠️  No research provider available — skipping research');
  return { searchResults: [], competitorContent: [], insights: null, researchBrief: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY: Firecrawl
// ─────────────────────────────────────────────────────────────────────────────

async function checkFirecrawlCredits() {
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/team/credit-usage`, {
      headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const remaining = data?.data?.remaining_credits ?? 0;
    return remaining > 10; // need at least a few credits
  } catch {
    return false;
  }
}

async function researchWithFirecrawl(keyword, { searchLimit, scrapeLimit, title }) {
  // Step 1: Search for top-ranking articles
  const searchResults = await firecrawlSearch(keyword, searchLimit);

  if (searchResults.length === 0) {
    console.warn('  ⚠️  No search results from Firecrawl');
    return { searchResults: [], competitorContent: [], insights: null, researchBrief: null };
  }

  // Step 2: Scrape top N competitor pages in full
  const urlsToScrape = searchResults
    .slice(0, scrapeLimit)
    .map(r => r.url)
    .filter(Boolean);

  console.log(`  📖 Reading ${urlsToScrape.length} competitor articles...`);
  const competitorContent = await firecrawlScrapeAll(urlsToScrape);

  // Step 3: Extract structured insights
  const insights = extractInsights(keyword, searchResults, competitorContent);

  // Step 4: Build a rich research brief for the AI writer
  const researchBrief = buildResearchBrief(keyword, title, insights, competitorContent);

  const wordCounts = competitorContent.map(p => p.wordCount).filter(Boolean);
  const avgWords = wordCounts.length
    ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
    : 0;

  console.log(`  ✅ Firecrawl research done — ${competitorContent.length} pages read, avg ${avgWords} words`);

  return { searchResults, competitorContent, insights, researchBrief };
}

async function firecrawlSearch(keyword, limit) {
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: keyword,
        limit,
        lang: 'en',
        country: 'us',
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`  ⚠️  Firecrawl search error ${res.status}: ${err.slice(0, 150)}`);
      return [];
    }

    const data = await res.json();
    return (data.data || []).map(r => ({
      url: r.url,
      title: r.title || r.metadata?.title || '',
      description: r.description || r.metadata?.description || '',
      markdown: r.markdown || '',
    }));
  } catch (err) {
    console.warn(`  ⚠️  Firecrawl search failed: ${err.message}`);
    return [];
  }
}

async function firecrawlScrapeAll(urls) {
  const results = [];
  for (const url of urls) {
    try {
      const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      if (!res.ok) {
        console.warn(`  ⚠️  Scrape failed for ${url}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const page = data.data || {};
      const markdown = page.markdown || '';

      results.push({
        url,
        title: page.metadata?.title || '',
        markdown,
        wordCount: markdown.split(/\s+/).filter(Boolean).length,
        publishDate: page.metadata?.publishedDate || page.metadata?.ogPublishedTime || null,
      });
    } catch (err) {
      console.warn(`  ⚠️  Scrape error for ${url}: ${err.message}`);
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK: OpenAI gpt-4o-search-preview
// ─────────────────────────────────────────────────────────────────────────────

async function researchWithOpenAI(keyword, title) {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        web_search_options: {},
        messages: [{
          role: 'user',
          content: `Research the topic: "${keyword}"
${title ? `Blog post title: "${title}"` : ''}

Search the web and find the top 5 articles ranking for this keyword. Then provide:

1. COMPETITOR HEADINGS: List all H2/H3 headings from the top 3 articles
2. KEY TOPICS: What themes appear across multiple competitor articles?
3. CONTENT GAPS: What angles, facts, or depth are competitors missing?
4. PAA QUESTIONS: List 5-6 "People Also Ask" questions from Google for this keyword
5. STATS & FACTS: Any specific statistics, numbers, or data points mentioned (with sources)
6. COMPETITOR URLS: List the top 5 ranking URLs

Format your response as a structured research brief.`,
        }],
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI search error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const brief = data.choices?.[0]?.message?.content || '';
    const cost = calculateOpenAISearchCost(data.usage);

    console.log(`  ✅ OpenAI research done ($${cost.toFixed(4)})`);

    return {
      searchResults: [],
      competitorContent: [],
      insights: null,
      researchBrief: brief,
      cost,
    };
  } catch (err) {
    console.warn(`  ⚠️  OpenAI search failed: ${err.message}`);
    return { searchResults: [], competitorContent: [], insights: null, researchBrief: null };
  }
}

function calculateOpenAISearchCost(usage) {
  if (!usage) return 0;
  // gpt-4o-search-preview: $2.50/1M input, $10/1M output + $10/1K search calls
  const inputCost = (usage.prompt_tokens / 1_000_000) * 2.50;
  const outputCost = (usage.completion_tokens / 1_000_000) * 10;
  const searchCost = 0.01; // ~1 search call
  return inputCost + outputCost + searchCost;
}

// ─────────────────────────────────────────────────────────────────────────────
// INSIGHT EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractInsights(keyword, searchResults, competitorContent) {
  const allHeadings = [];
  const allTopics = new Set();
  let totalWordCount = 0;
  let articleCount = 0;

  for (const page of competitorContent) {
    if (!page.markdown) continue;
    articleCount++;
    totalWordCount += page.wordCount;

    // Extract H2 and H3 headings
    const headingRegex = /^(#{2,3}) (.+)$/gm;
    let match;
    while ((match = headingRegex.exec(page.markdown))) {
      const heading = match[2].trim();
      allHeadings.push({ level: match[1].length, text: heading, source: page.url });
      heading.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
        .forEach(w => { if (w.length > 3) allTopics.add(w); });
    }
  }

  // Count heading frequency across competitors
  const headingFrequency = {};
  for (const h of allHeadings) {
    const key = h.text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    headingFrequency[key] = (headingFrequency[key] || 0) + 1;
  }

  const commonThemes = Object.entries(headingFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([theme, count]) => ({ theme, count }));

  const avgWordCount = articleCount > 0 ? Math.round(totalWordCount / articleCount) : 2000;

  // Extract questions from competitor content
  const questions = [];
  for (const page of competitorContent) {
    if (!page.markdown) continue;
    const qRegex = /(?:^|\n)(?:#{1,4}\s*)?([^\n]*\?)\s*$/gm;
    let qMatch;
    while ((qMatch = qRegex.exec(page.markdown))) {
      const q = qMatch[1].trim();
      if (q.length > 15 && q.length < 200) questions.push(q);
    }
  }

  const uniqueQuestions = [...new Set(questions)].slice(0, 10);

  // Build competitor summaries for the AI writer (first 4000 chars of each)
  const competitorSummaries = competitorContent.map(page => ({
    url: page.url,
    title: page.title,
    wordCount: page.wordCount,
    publishDate: page.publishDate,
    content: page.markdown.slice(0, 4000),
  }));

  return {
    keyword,
    competitorCount: articleCount,
    avgWordCount,
    commonThemes,
    uniqueQuestions,
    topHeadings: allHeadings.slice(0, 40),
    competitorSummaries,
    searchSnippets: searchResults.map(r => ({
      title: r.title,
      description: r.description,
      url: r.url,
    })),
  };
}

/**
 * Build a rich research brief string to inject into the AI writing prompt.
 * This is the key piece that makes articles actually informed by competitor content.
 */
function buildResearchBrief(keyword, title, insights, competitorContent) {
  if (!insights) return null;

  const { competitorCount, avgWordCount, commonThemes, uniqueQuestions, competitorSummaries, searchSnippets } = insights;

  let brief = `# Live Research Brief — "${keyword}"\n\n`;
  brief += `Researched ${competitorCount} top-ranking competitor articles. Average length: ${avgWordCount} words.\n\n`;

  // Top ranking URLs
  if (searchSnippets.length > 0) {
    brief += `## Top Ranking Competitors\n`;
    searchSnippets.slice(0, 5).forEach((s, i) => {
      brief += `${i + 1}. **${s.title}** — ${s.url}\n`;
      if (s.description) brief += `   ${s.description}\n`;
    });
    brief += '\n';
  }

  // Topics all competitors cover (must-cover list)
  if (commonThemes.length > 0) {
    brief += `## Topics All Competitors Cover (MANDATORY — cover all of these)\n`;
    commonThemes.slice(0, 10).forEach(t => {
      brief += `- ${t.theme} (in ${t.count}/${competitorCount} articles)\n`;
    });
    brief += '\n';
  }

  // Questions competitors answer
  if (uniqueQuestions.length > 0) {
    brief += `## Questions Competitors Answer (use for FAQ section)\n`;
    uniqueQuestions.slice(0, 6).forEach(q => {
      brief += `- ${q}\n`;
    });
    brief += '\n';
  }

  // Full competitor content for gap analysis
  if (competitorSummaries.length > 0) {
    brief += `## Competitor Content (READ THIS — find gaps, go deeper, be more specific)\n\n`;
    brief += `Your job:\n`;
    brief += `1. Cover everything they cover (table stakes)\n`;
    brief += `2. Find what they're vague about — be specific where they generalise\n`;
    brief += `3. Add real numbers, edge cases, and expert-only insights they miss\n`;
    brief += `4. If their data looks outdated (old pricing, 2024 info), use current 2026 facts\n`;
    brief += `5. Beat their word count — if avg is ${avgWordCount} words, write at least ${Math.round(avgWordCount * 1.2)} words\n\n`;

    competitorSummaries.slice(0, 3).forEach((comp, i) => {
      const dateNote = comp.publishDate ? ` — published ${comp.publishDate}` : '';
      brief += `### Competitor ${i + 1}: "${comp.title}" (${comp.wordCount} words${dateNote})\n`;
      brief += `URL: ${comp.url}\n\n`;
      brief += `${comp.content}\n`;
      if (comp.content.length >= 4000) brief += `...[content continues]\n`;
      brief += '\n---\n\n';
    });
  }

  return brief;
}
