/**
 * Competitor Research Module
 * Uses Firecrawl to search the web for top-ranking content on a keyword,
 * then extracts structure, topics, and insights for the AI writer.
 * Now includes fact-checking and source verification.
 *
 * Zero dependencies — uses native fetch() (Node 22).
 */

import { FIRECRAWL_API_KEY } from './config.mjs';
import { factCheck, checkFreshness } from './fact-checker.mjs';

const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

/**
 * Research a keyword: search the web, scrape top results, extract insights, verify facts.
 * @param {string} keyword - The primary keyword to research
 * @param {object} opts
 * @param {number} opts.searchLimit - Number of search results (default: 5)
 * @param {number} opts.scrapeLimit - Number of pages to scrape in full (default: 3)
 * @param {string} opts.title - Blog post title (for fact-check topic detection)
 * @param {string} opts.template - Template type (for fact-check scope)
 * @returns {object} { searchResults, competitorContent, insights, factCheckResult }
 */
export async function research(keyword, opts = {}) {
  const { searchLimit = 5, scrapeLimit = 3, title = '', template = 'how-to' } = opts;

  if (!FIRECRAWL_API_KEY) {
    console.warn('[researcher] No FIRECRAWL_API_KEY set — skipping research');
    return { searchResults: [], competitorContent: [], insights: null };
  }

  // Step 1: Search the web for top-ranking articles
  const searchResults = await searchWeb(keyword, searchLimit);

  if (searchResults.length === 0) {
    console.warn('[researcher] No search results found');
    return { searchResults: [], competitorContent: [], insights: null };
  }

  // Step 2: Scrape the top N results for full content
  const urlsToScrape = searchResults
    .slice(0, scrapeLimit)
    .map(r => r.url)
    .filter(Boolean);

  const competitorContent = await scrapeUrls(urlsToScrape);

  // Step 3: Extract insights from scraped content
  const insights = extractInsights(keyword, searchResults, competitorContent);

  // Step 4: Fact-check and verify authoritative sources
  console.log('[researcher] Running fact-check on authoritative sources...');
  const factCheckResult = await factCheck(keyword, title, template);

  // Step 5: Check freshness of competitor content
  const freshnessWarnings = checkFreshness(competitorContent);
  if (freshnessWarnings.length > 0) {
    console.warn(`[researcher] Found ${freshnessWarnings.length} stale competitor sources`);
    factCheckResult.warnings.push(...freshnessWarnings.map(w => `Stale content: ${w.url} (${w.age})`));
  }

  return { searchResults, competitorContent, insights, factCheckResult };
}

/**
 * Search the web via Firecrawl search endpoint.
 */
async function searchWeb(keyword, limit) {
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
      const errText = await res.text();
      console.warn(`[researcher] Search API error ${res.status}: ${errText.slice(0, 200)}`);
      return [];
    }

    const data = await res.json();
    const results = data.data || [];

    return results.map(r => ({
      url: r.url,
      title: r.title || r.metadata?.title || '',
      description: r.description || r.metadata?.description || '',
      markdown: r.markdown || '',
    }));
  } catch (err) {
    console.warn(`[researcher] Search failed: ${err.message}`);
    return [];
  }
}

/**
 * Scrape individual URLs for full content.
 */
async function scrapeUrls(urls) {
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
        console.warn(`[researcher] Scrape failed for ${url}: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const page = data.data || {};

      results.push({
        url,
        title: page.metadata?.title || '',
        markdown: page.markdown || '',
        wordCount: (page.markdown || '').split(/\s+/).length,
      });
    } catch (err) {
      console.warn(`[researcher] Scrape error for ${url}: ${err.message}`);
    }
  }

  return results;
}

/**
 * Extract actionable insights from search results and scraped content.
 */
function extractInsights(keyword, searchResults, competitorContent) {
  // Extract all headings from competitor content
  const allHeadings = [];
  const allTopics = new Set();
  let totalWordCount = 0;
  let articleCount = 0;

  for (const page of competitorContent) {
    if (!page.markdown) continue;
    articleCount++;
    totalWordCount += page.wordCount;

    // Extract headings (H2 and H3)
    const headingRegex = /^(#{2,3}) (.+)$/gm;
    let match;
    while ((match = headingRegex.exec(page.markdown))) {
      const heading = match[2].trim();
      allHeadings.push({
        level: match[1].length,
        text: heading,
        source: page.url,
      });
      // Extract topic keywords from headings
      const words = heading.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
      words.forEach(w => { if (w.length > 3) allTopics.add(w); });
    }
  }

  // Find common headings/themes across competitors
  const headingTexts = allHeadings.map(h => h.text.toLowerCase());
  const headingFrequency = {};
  for (const h of headingTexts) {
    // Normalize similar headings
    const normalized = h.replace(/[^a-z0-9\s]/g, '').trim();
    headingFrequency[normalized] = (headingFrequency[normalized] || 0) + 1;
  }

  // Sort by frequency to find common themes
  const commonThemes = Object.entries(headingFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([theme, count]) => ({ theme, count }));

  // Average word count of competitors
  const avgWordCount = articleCount > 0 ? Math.round(totalWordCount / articleCount) : 2000;

  // Extract questions from competitor content (FAQ patterns)
  const questions = [];
  for (const page of competitorContent) {
    if (!page.markdown) continue;
    const qRegex = /(?:^|\n)(?:#{1,4}\s*)?(?:Q:\s*)?([^\n]*\?)\s*$/gm;
    let qMatch;
    while ((qMatch = qRegex.exec(page.markdown))) {
      const q = qMatch[1].trim();
      if (q.length > 15 && q.length < 200) {
        questions.push(q);
      }
    }
  }

  // Deduplicate questions
  const uniqueQuestions = [...new Set(questions)].slice(0, 10);

  // Build competitor summaries (truncated for the AI prompt)
  const competitorSummaries = competitorContent.map(page => {
    const truncated = page.markdown.slice(0, 3000);
    return {
      url: page.url,
      title: page.title,
      wordCount: page.wordCount,
      content: truncated,
    };
  });

  return {
    keyword,
    competitorCount: articleCount,
    avgWordCount,
    commonThemes,
    uniqueQuestions,
    topHeadings: allHeadings.slice(0, 30),
    competitorSummaries,
    searchSnippets: searchResults.map(r => ({
      title: r.title,
      description: r.description,
      url: r.url,
    })),
  };
}
