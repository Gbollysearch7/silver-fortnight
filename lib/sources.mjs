/**
 * Authoritative Source Registry
 * Defines verified sources the AI can query for fact-checking and fresh data.
 *
 * This ensures the content agent pulls data from reliable, up-to-date sources
 * rather than relying solely on potentially stale competitor content.
 */

export const AUTHORITATIVE_SOURCES = {
  // --- TradersYard (Primary Source) ---
  tradersyard: {
    name: 'TradersYard',
    domain: 'tradersyard.com',
    urls: {
      home: 'https://tradersyard.com',
      pricing: 'https://tradersyard.com/#pricing',
      about: 'https://tradersyard.com/about',
      blog: 'https://tradersyard.com/blog',
      faq: 'https://tradersyard.com/faq',
      rules: 'https://tradersyard.com/challenge-rules',
    },
    dataAccess: {
      supabase: true, // Can query real trader data
      grafana: true,  // Can pull trader stats
    },
    priority: 1, // Always verify TradersYard data first
  },

  // --- Major Prop Firms (For Comparisons) ---
  propFirms: [
    {
      name: 'FTMO',
      domain: 'ftmo.com',
      url: 'https://ftmo.com/en/',
      pricingPage: 'https://ftmo.com/en/pricing/',
      verifyPricing: true,
      verifyRules: true,
      lastVerified: null, // Will be updated by fact-checker
    },
    {
      name: 'The5ers',
      domain: 'the5ers.com',
      url: 'https://the5ers.com/',
      pricingPage: 'https://the5ers.com/funding-programs/',
      verifyPricing: true,
      verifyRules: true,
      lastVerified: null,
    },
    {
      name: 'TopstepTrader',
      domain: 'topsteptrader.com',
      url: 'https://www.topsteptrader.com/',
      pricingPage: 'https://www.topsteptrader.com/trading-combines/',
      verifyPricing: true,
      verifyRules: true,
      lastVerified: null,
    },
    {
      name: 'MyForexFunds',
      domain: 'myforexfunds.com',
      url: 'https://myforexfunds.com/',
      pricingPage: 'https://myforexfunds.com/challenge/',
      verifyPricing: true,
      verifyRules: true,
      lastVerified: null,
    },
    {
      name: 'FundedNext',
      domain: 'fundednext.com',
      url: 'https://fundednext.com/',
      pricingPage: 'https://fundednext.com/evaluation/',
      verifyPricing: true,
      verifyRules: true,
      lastVerified: null,
    },
  ],

  // --- Regulatory Bodies (For Legal/Compliance Info) ---
  regulatoryBodies: [
    {
      name: 'CFTC',
      fullName: 'Commodity Futures Trading Commission',
      url: 'https://www.cftc.gov/',
      useFor: ['regulation', 'compliance', 'legal'],
    },
    {
      name: 'NFA',
      fullName: 'National Futures Association',
      url: 'https://www.nfa.futures.org/',
      useFor: ['regulation', 'broker verification'],
    },
    {
      name: 'FCA',
      fullName: 'Financial Conduct Authority (UK)',
      url: 'https://www.fca.org.uk/',
      useFor: ['uk regulation', 'broker verification'],
    },
  ],

  // --- Trading Education & Research (For Stats/Data) ---
  educationalSources: [
    {
      name: 'Investopedia',
      domain: 'investopedia.com',
      url: 'https://www.investopedia.com/',
      useFor: ['definitions', 'trading concepts', 'statistics'],
      trustLevel: 'high',
    },
    {
      name: 'BabyPips',
      domain: 'babypips.com',
      url: 'https://www.babypips.com/',
      useFor: ['forex education', 'beginner trading'],
      trustLevel: 'high',
    },
    {
      name: 'TradingView',
      domain: 'tradingview.com',
      url: 'https://www.tradingview.com/',
      useFor: ['market data', 'charts', 'technical analysis'],
      trustLevel: 'high',
    },
  ],

  // --- News Sources (For Market Context) ---
  newsSources: [
    {
      name: 'Bloomberg',
      domain: 'bloomberg.com',
      url: 'https://www.bloomberg.com/',
      useFor: ['market news', 'economic data'],
      trustLevel: 'highest',
    },
    {
      name: 'Reuters',
      domain: 'reuters.com',
      url: 'https://www.reuters.com/',
      useFor: ['market news', 'economic data'],
      trustLevel: 'highest',
    },
    {
      name: 'ForexLive',
      domain: 'forexlive.com',
      url: 'https://www.forexlive.com/',
      useFor: ['forex news', 'trading analysis'],
      trustLevel: 'high',
    },
  ],
};

/**
 * Get sources by category
 */
export function getSourcesByCategory(category) {
  switch (category) {
    case 'prop-firms':
      return AUTHORITATIVE_SOURCES.propFirms;
    case 'regulation':
      return AUTHORITATIVE_SOURCES.regulatoryBodies;
    case 'education':
      return AUTHORITATIVE_SOURCES.educationalSources;
    case 'news':
      return AUTHORITATIVE_SOURCES.newsSources;
    case 'tradersyard':
      return [AUTHORITATIVE_SOURCES.tradersyard];
    default:
      return [];
  }
}

/**
 * Get prop firm by name (case-insensitive)
 */
export function getPropFirm(name) {
  const normalized = name.toLowerCase().replace(/\s+/g, '');
  return AUTHORITATIVE_SOURCES.propFirms.find(
    firm => firm.name.toLowerCase().replace(/\s+/g, '') === normalized
  );
}

/**
 * Topics that require fact-checking from authoritative sources
 */
export const FACT_CHECK_TOPICS = {
  pricing: {
    sources: ['propFirms'],
    verifyFields: ['price', 'account size', 'profit target', 'max drawdown'],
    maxAgeHours: 168, // 7 days
  },
  rules: {
    sources: ['propFirms', 'tradersyard'],
    verifyFields: ['profit target', 'max drawdown', 'daily loss limit', 'time limit'],
    maxAgeHours: 168,
  },
  statistics: {
    sources: ['tradersyard'],
    verifyFields: ['pass rate', 'average payout', 'funded traders'],
    maxAgeHours: 24, // Stats should be fresh
  },
  regulation: {
    sources: ['regulatoryBodies'],
    verifyFields: ['license status', 'regulatory warnings'],
    maxAgeHours: 720, // 30 days
  },
};

/**
 * Determine which topics require fact-checking based on keyword/title
 */
export function detectFactCheckTopics(keyword, title) {
  const text = `${keyword} ${title}`.toLowerCase();
  const topics = [];

  if (text.match(/pric(e|ing)|cost|fee|cheap|expensive/)) {
    topics.push('pricing');
  }
  if (text.match(/rule|limit|drawdown|target|pass|challenge/)) {
    topics.push('rules');
  }
  if (text.match(/stat|data|pass rate|success rate|payout|fund/)) {
    topics.push('statistics');
  }
  if (text.match(/regulat|legal|licens|complian|scam/)) {
    topics.push('regulation');
  }

  return topics;
}
