/**
 * Fact-Checking Module
 * Verifies claims by scraping authoritative sources directly.
 * Detects stale data and ensures content uses fresh, accurate information.
 *
 * Zero dependencies — uses native fetch() (Node 22).
 */

import { FIRECRAWL_API_KEY } from './config.mjs';
import { AUTHORITATIVE_SOURCES, detectFactCheckTopics, getPropFirm } from './sources.mjs';
import { getTradersYardStats, getTradersYardChallengeData, formatStatsForPrompt } from './supabase-client.mjs';

const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';

/**
 * Run fact-checking for a blog topic.
 * Scrapes authoritative sources to verify claims and gather fresh data.
 *
 * @param {string} keyword - Primary keyword
 * @param {string} title - Blog post title
 * @param {string} template - Template type
 * @returns {object} { verifiedData, sources, warnings }
 */
export async function factCheck(keyword, title, template) {
  console.log('[fact-checker] Starting fact-check...');

  const topics = detectFactCheckTopics(keyword, title);
  console.log(`[fact-checker] Detected topics: ${topics.join(', ') || 'none'}`);

  const verifiedData = {
    tradersyard: null,
    propFirms: [],
    statistics: null,
    freshness: new Date().toISOString(),
  };

  const sources = [];
  const warnings = [];

  // Always pull TradersYard data
  try {
    const [tyStats, tyChallenge] = await Promise.all([
      getTradersYardStats(),
      getTradersYardChallengeData(),
    ]);

    verifiedData.tradersyard = {
      stats: tyStats,
      challenge: tyChallenge,
    };

    if (tyStats) {
      sources.push({
        name: 'TradersYard Supabase',
        url: 'https://tradersyard.com',
        dataFetched: true,
      });
    }
  } catch (err) {
    warnings.push(`Failed to fetch TradersYard data: ${err.message}`);
  }

  // If pricing/rules topics detected, scrape competitor prop firms
  if (topics.includes('pricing') || topics.includes('rules')) {
    if (template === 'comparison' || template === 'listicle') {
      // For comparisons/listicles, scrape top 3-5 prop firms
      const firmsToCheck = AUTHORITATIVE_SOURCES.propFirms.slice(0, 5);
      console.log(`[fact-checker] Verifying ${firmsToCheck.length} prop firms...`);

      for (const firm of firmsToCheck) {
        try {
          const firmData = await scrapePropFirm(firm);
          if (firmData) {
            verifiedData.propFirms.push(firmData);
            sources.push({
              name: firm.name,
              url: firm.url,
              dataFetched: true,
            });
          }
        } catch (err) {
          warnings.push(`Failed to verify ${firm.name}: ${err.message}`);
        }
      }
    }
  }

  return {
    verifiedData,
    sources,
    warnings,
  };
}

/**
 * Scrape a prop firm's website for pricing and rules.
 */
async function scrapePropFirm(firm) {
  if (!FIRECRAWL_API_KEY) {
    console.warn(`[fact-checker] No FIRECRAWL_API_KEY — skipping ${firm.name}`);
    return null;
  }

  try {
    // Scrape the pricing page
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: firm.pricingPage || firm.url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) {
      console.warn(`[fact-checker] Scrape failed for ${firm.name}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const markdown = data.data?.markdown || '';

    // Extract pricing and rules from the markdown
    const extracted = extractPropFirmData(firm.name, markdown);

    return {
      name: firm.name,
      url: firm.url,
      ...extracted,
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[fact-checker] Error scraping ${firm.name}: ${err.message}`);
    return null;
  }
}

/**
 * Extract pricing and rules from prop firm markdown content.
 * Uses pattern matching to find common data points.
 */
function extractPropFirmData(firmName, markdown) {
  const data = {
    pricing: [],
    rules: {},
    rawContent: markdown.slice(0, 2000), // Truncated for AI prompt
  };

  // Extract pricing (look for dollar amounts + account sizes)
  const priceMatches = markdown.matchAll(/\$(\d+(?:,\d+)?(?:\.\d+)?)/g);
  const prices = [...priceMatches].map(m => m[1].replace(/,/g, ''));
  if (prices.length > 0) {
    data.pricing = prices.slice(0, 5).map(p => `$${p}`);
  }

  // Extract account sizes (look for patterns like "$100,000", "100k")
  const sizeMatches = markdown.matchAll(/\$?(\d+(?:,\d+)?)\s*(?:k|K|,000)?/g);
  const sizes = [...sizeMatches].map(m => m[1]);

  // Extract profit targets (look for percentages near "profit" or "target")
  const profitMatches = markdown.match(/profit\s+target[:\s]+(\d+%|\$\d+(?:,\d+)?)/gi);
  if (profitMatches && profitMatches.length > 0) {
    data.rules.profitTarget = profitMatches[0];
  }

  // Extract drawdown limits
  const drawdownMatches = markdown.match(/(?:max|maximum)\s+drawdown[:\s]+(\d+%|\$\d+(?:,\d+)?)/gi);
  if (drawdownMatches && drawdownMatches.length > 0) {
    data.rules.maxDrawdown = drawdownMatches[0];
  }

  return data;
}

/**
 * Check if competitor content is stale.
 * Looks for publish dates and flags old content.
 */
export function checkFreshness(competitorContent) {
  const warnings = [];
  const now = new Date();

  for (const page of competitorContent) {
    if (!page.markdown) continue;

    // Try to extract publish date from content
    const datePatterns = [
      /published[:\s]+(\w+\s+\d+,?\s+\d{4})/i,
      /updated[:\s]+(\w+\s+\d+,?\s+\d{4})/i,
      /(\w+\s+\d+,?\s+202\d)/,
    ];

    let publishDate = null;
    for (const pattern of datePatterns) {
      const match = page.markdown.match(pattern);
      if (match) {
        try {
          publishDate = new Date(match[1]);
          break;
        } catch {}
      }
    }

    if (publishDate) {
      const ageMonths = (now - publishDate) / (1000 * 60 * 60 * 24 * 30);
      if (ageMonths > 12) {
        warnings.push({
          url: page.url,
          age: `${Math.round(ageMonths)} months old`,
          warning: 'Content may contain outdated information',
        });
      }
    }
  }

  return warnings;
}

/**
 * Format verified data for inclusion in AI writer prompt.
 */
export function formatVerifiedDataForPrompt(factCheckResult) {
  if (!factCheckResult || !factCheckResult.verifiedData) return '';

  let prompt = '\n\n=== VERIFIED DATA (Use these facts exactly) ===\n\n';

  // TradersYard data
  if (factCheckResult.verifiedData.tradersyard) {
    const ty = factCheckResult.verifiedData.tradersyard;

    if (ty.stats) {
      prompt += formatStatsForPrompt(ty.stats);
      prompt += '\n';
    }

    if (ty.challenge) {
      prompt += 'TRADERSYARD CHALLENGE DETAILS:\n';
      for (const challenge of ty.challenge.challenges || []) {
        prompt += `- ${challenge.name}: $${challenge.accountSize.toLocaleString()} account, $${challenge.price} price, ${challenge.profitTarget.toLocaleString()} profit target\n`;
      }
      prompt += '\n';
    }
  }

  // Competitor prop firm data
  if (factCheckResult.verifiedData.propFirms && factCheckResult.verifiedData.propFirms.length > 0) {
    prompt += 'VERIFIED COMPETITOR DATA:\n';
    for (const firm of factCheckResult.verifiedData.propFirms) {
      prompt += `\n${firm.name} (${firm.url}):\n`;
      if (firm.pricing.length > 0) {
        prompt += `  Pricing: ${firm.pricing.join(', ')}\n`;
      }
      if (firm.rules.profitTarget) {
        prompt += `  Profit target: ${firm.rules.profitTarget}\n`;
      }
      if (firm.rules.maxDrawdown) {
        prompt += `  Max drawdown: ${firm.rules.maxDrawdown}\n`;
      }
      prompt += `  (Verified: ${new Date(firm.scrapedAt).toLocaleDateString()})\n`;
    }
    prompt += '\n';
  }

  // Warnings
  if (factCheckResult.warnings && factCheckResult.warnings.length > 0) {
    prompt += 'FACT-CHECK WARNINGS:\n';
    for (const warning of factCheckResult.warnings) {
      prompt += `- ${warning}\n`;
    }
    prompt += '\n';
  }

  prompt += '=== END VERIFIED DATA ===\n\n';
  prompt += 'IMPORTANT: Use the verified data above instead of relying on potentially outdated competitor content.\n\n';

  return prompt;
}
