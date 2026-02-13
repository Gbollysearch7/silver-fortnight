#!/usr/bin/env node

/**
 * KGR Keyword Research Helper
 * Helps find Keyword Golden Ratio opportunities for TradersYard blog.
 *
 * This script provides:
 * 1. Example Tier 0 keywords (0-10 monthly searches)
 * 2. Keyword generators for prop trading topics
 * 3. Instructions for manual/Fiverr/tool-based research
 *
 * Usage:
 *   node scripts/kgr-research.mjs                    # Show all suggestions
 *   node scripts/kgr-research.mjs --tier 0           # Tier 0 only (0-10 searches)
 *   node scripts/kgr-research.mjs --tier 10          # Tier 10 (10-20 searches)
 *   node scripts/kgr-research.mjs --generate         # Generate keyword ideas
 *   node scripts/kgr-research.mjs --add-to-queue     # Add examples to queue
 */

import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, readJsonFile, writeJsonFile, slugify } from '../lib/utils.mjs';

const args = parseArgs();
const QUEUE_PATH = resolve(DATA_DIR, 'keyword-queue.json');

printHeader('KGR Keyword Research Helper');

// Tier 0 Example Keywords (0-10 monthly searches)
const TIER_0_KEYWORDS = [
  {
    keyword: 'prop firm challenge calculator excel',
    title: 'Prop Firm Challenge Calculator Excel Template (Free Download)',
i h  },
  {
    keyword: 'prop firm ea allowed policy',
    title: 'Prop Firm EA Allowed Policy: Can You Use Expert Advisors?',
    template: 'comparison',
    category: 'prop-firm-guides',
    estVolume: 4,
    intent: 'informational',
    notes: 'Policy comparison',
  },
  {
    keyword: 'funded trader scaling plan strategy',
    title: 'Funded Trader Scaling Plan Strategy: How to Grow Your Account',
    template: 'how-to',
    category: 'trading-education',
    estVolume: 8,
    intent: 'informational',
    notes: 'Strategic guide',
  },
  {
    keyword: 'prop firm payout schedule timeline',
    title: 'Prop Firm Payout Schedule Timeline: When Do You Get Paid?',
    template: 'comparison',
    category: 'prop-firm-guides',
    estVolume: 7,
    intent: 'informational',
    notes: 'Timeline comparison',
  },
  // Additional 25 keywords
  {
    keyword: 'prop firm challenge journal template',
    title: 'Prop Firm Challenge Journal Template (Free Trading Log)',
    template: 'how-to',
    category: 'trading-education',
    estVolume: 6,
    intent: 'transactional',
    notes: 'Free template download',
  },
  {
    keyword: 'how long does ftmo challenge take',
    title: 'How Long Does FTMO Challenge Take? Complete Timeline',
    template: 'ultimate-guide',
    category: 'prop-firm-guides',
    estVolume: 8,
    intent: 'informational',
    notes: 'Timeline breakdown',
  },
  {
    keyword: 'prop firm leverage comparison table',
    title: 'Prop Firm Leverage Comparison Table 2026',
    template: 'comparison',
    category: 'prop-firm-guides',
    estVolume: 5,
    intent: 'informational',
    notes: 'Data-driven comparison',
  },
  {
    keyword: 'funded trader max lot size calculator',
    title: 'Funded Trader Max Lot Size Calculator for Prop Firms',
    template: 'how-to',
    category: 'trading-education',
    estVolume: 7,
    intent: 'transactional',
    notes: 'Risk calculator',
  },
  {
    keyword: 'prop firm challenge failed what next',
    title: 'Prop Firm Challenge Failed? Here\'s What to Do Next',
    template: 'ultimate-guide',
    category: 'prop-firm-guides',
    estVolume: 9,
    intent: 'informational',
    notes: 'Recovery guide',
  },
  {
    keyword: 'trading challenge risk management checklist',
    title: 'Trading Challenge Risk Management Checklist (PDF)',
    template: 'listicle',
    category: 'trading-education',
    estVolume: 6,
    intent: 'informational',
    notes: 'Downloadable checklist',
  },
  {
    keyword: 'prop firm refund policy comparison',
    title: 'Prop Firm Refund Policy Comparison: Who Offers Refunds?',
    template: 'comparison',
    category: 'prop-firm-guides',
    estVolume: 4,
    intent: 'informational',
    notes: 'Policy analysis',
  },
  {
    keyword: 'funded account verification process explained',
    title: 'Funded Account Verification Process: Step-by-Step Guide',
    template: 'how-to',
    category: 'prop-firm-guides',
    estVolume: 8,
    intent: 'informational',
    notes: 'Process walkthrough',
  },
  {
    keyword: 'prop firm challenge discount codes 2026',
    title: 'Prop Firm Challenge Discount Codes 2026 (Active Deals)',
    template: 'listicle',
    category: 'prop-firm-guides',
    estVolume: 7,
    intent: 'transactional',
    notes: 'Discount roundup',
  },
  {
    keyword: 'how to prepare for prop firm challenge',
    title: 'How to Prepare for a Prop Firm Challenge: 30-Day Plan',
    template: 'ultimate-guide',
    category: 'trading-education',
    estVolume: 9,
    intent: 'informational',
    notes: 'Preparation roadmap',
  },
  {
    keyword: 'funded trader withdrawal process time',
    title: 'Funded Trader Withdrawal Process: How Long Does It Take?',
    template: 'ultimate-guide',
    category: 'prop-firm-guides',
    estVolume: 6,
    intent: 'informational',
    notes: 'Timeline guide',
  },
  {
    keyword: 'prop firm demo account practice',
    title: 'Prop Firm Demo Account Practice: Best Platforms',
    template: 'listicle',
    category: 'prop-firm-guides',
    estVolume: 5,
    intent: 'informational',
    notes: 'Platform recommendations',
  },
  {
    keyword: 'trading challenge common mistakes avoid',
    title: '15 Trading Challenge Common Mistakes to Avoid',
    template: 'listicle',
    category: 'trading-education',
    estVolume: 8,
    intent: 'informational',
    notes: 'Mistake prevention',
  },
  {
    keyword: 'prop firm kyc requirements documents',
    title: 'Prop Firm KYC Requirements: What Documents Do You Need?',
    template: 'ultimate-guide',
    category: 'prop-firm-guides',
    estVolume: 7,
    intent: 'informational',
    notes: 'Documentation guide',
  },
  {
    keyword: 'funded account profit target realistic',
    title: 'Are Funded Account Profit Targets Realistic? Truth Revealed',
    template: 'ultimate-guide',
    category: 'prop-firm-guides',
    estVolume: 9,
    intent: 'informational',
    notes: 'Reality check article',
  },
];

// Tier 10 Example Keywords (10-20 monthly searches)
const TIER_10_KEYWORDS = [
  {
    keyword: 'best prop firm for scalping',
    title: 'Best Prop Firm for Scalping: Top 5 Platforms Compared',
    template: 'comparison',
    category: 'prop-firm-guides',
    estVolume: 15,
    intent: 'informational',
  },
  {
    keyword: 'prop firm without time limit',
    title: 'Prop Firms Without Time Limits: Complete Guide 2026',
    template: 'listicle',
    category: 'prop-firm-guides',
    estVolume: 18,
    intent: 'informational',
  },
  {
    keyword: 'funded trader success rate',
    title: 'Funded Trader Success Rate: Real Statistics and Analysis',
    template: 'ultimate-guide',
    category: 'prop-firm-guides',
    estVolume: 12,
    intent: 'informational',
  },
];

function displayKeywords(tier = 0) {
  const keywords = tier === 0 ? TIER_0_KEYWORDS : TIER_10_KEYWORDS;
  const tierLabel = tier === 0 ? 'Tier 0 (0-10 monthly searches)' : 'Tier 10 (10-20 monthly searches)';

  printSection(`${tierLabel} - ${keywords.length} Keywords`);
  console.log('');

  console.log('Keyword | Est. Volume | Intent | Template');
  console.log('--------|-------------|--------|----------');

  for (const kw of keywords) {
    console.log(`${kw.keyword} | ${kw.estVolume} | ${kw.intent} | ${kw.template}`);
  }

  console.log('');
  printInfo('To add these to your queue: node scripts/kgr-research.mjs --add-to-queue');
  printInfo('To generate more ideas: node scripts/kgr-research.mjs --generate');
}

function addToQueue(tier = 0) {
  const keywords = tier === 0 ? TIER_0_KEYWORDS : TIER_10_KEYWORDS;
  const queueData = readJsonFile(QUEUE_PATH) || { queue: [] };

  // Get next available ID
  const maxId = queueData.queue.reduce((max, item) => {
    const id = parseInt(item.id, 10);
    return isNaN(id) ? max : Math.max(max, id);
  }, 0);

  let nextId = maxId + 1;

  printInfo(`Adding ${keywords.length} keywords to queue...`);

  for (const kw of keywords) {
    const id = String(nextId).padStart(3, '0');
    const slug = slugify(kw.title);

    // Check if already in queue
    const exists = queueData.queue.find(
      item => item.keyword === kw.keyword || item.slug === slug
    );

    if (exists) {
      printWarning(`Skipped (exists): ${kw.keyword}`);
      continue;
    }

    queueData.queue.push({
      id,
      keyword: kw.keyword,
      title: kw.title,
      template: kw.template,
      category: kw.category,
      priority: nextId,
      status: 'queued',
      notes: kw.notes || '',
      // KGR fields
      tier: tier === 0 ? 0 : 10,
      estMonthlySearches: kw.estVolume,
      searchIntent: kw.intent,
      contentType: 'supporting',
      targetWordCount: kw.template === 'ultimate-guide' ? 2500 : kw.template === 'comparison' ? 2000 : 1200,
    });

    printSuccess(`Added: ${kw.keyword}`);
    nextId++;
  }

  writeJsonFile(QUEUE_PATH, queueData);
  printSuccess(`\n✓ Added ${keywords.length} keywords to queue`);
  printInfo('Queue file: data/keyword-queue.json');
}

function generateIdeas() {
  printSection('Keyword Idea Generator');
  console.log('');

  const baseTopics = [
    'prop firm challenge',
    'funded trading',
    'prop firm rules',
    'trading drawdown',
    'profit targets',
    'funded account',
    'prop firm evaluation',
    'trading challenge',
  ];

  const modifiers = [
    'calculator',
    'formula',
    'excel template',
    'spreadsheet',
    'checklist',
    'worksheet',
    'pdf',
    'guide',
    'strategy',
    'tips',
    'example',
    'template',
    'step by step',
    'for beginners',
    'reddit',
    '2026',
    'explained',
    'comparison',
    'vs',
    'how to',
  ];

  printInfo('Example keyword combinations:');
  console.log('');

  for (let i = 0; i < 10; i++) {
    const base = baseTopics[Math.floor(Math.random() * baseTopics.length)];
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    console.log(`  • ${base} ${mod}`);
  }

  console.log('');
  printInfo('How to verify KGR:');
  console.log('  1. Check volume in Google Keyword Planner (0-10 for Tier 0)');
  console.log('  2. Google: allintitle:"your exact keyword"');
  console.log('  3. Calculate: KGR = Allintitle Results ÷ Monthly Volume');
  console.log('  4. Keep if: KGR ≤ 0.25');
  console.log('');
  printInfo('Use Fiverr for bulk research: Search "KGR keyword research"');
  printInfo('Request: 30-45 keywords, Tier 0 (0-10 searches), KGR ≤ 0.25');
}

// Main
const tier = args.tier === '10' ? 10 : 0;

if (args['add-to-queue']) {
  addToQueue(tier);
} else if (args.generate) {
  generateIdeas();
} else {
  displayKeywords(tier);
  console.log('');
  printSection('Next Steps');
  printInfo('1. Review keywords above');
  printInfo('2. Add to queue: node scripts/kgr-research.mjs --add-to-queue');
  printInfo('3. Start staging: node scripts/cron.mjs --staging --once');
  printInfo('4. After migration: node scripts/bulk-publish.mjs');
}
