#!/usr/bin/env node

/**
 * SEO Keyword Research Agent
 * Expert-level keyword research with advanced filtering and KGR validation
 *
 * This agent knows:
 * - Optimal SEMrush filter combinations
 * - Search intent analysis
 * - Trend evaluation
 * - Competitive density thresholds
 * - KGR calculation and validation
 * - Commercial vs informational intent
 *
 * Usage:
 *   node agents/seo-keyword-research-agent.mjs
 */

import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs();

printHeader('SEO Keyword Research Agent');
printInfo('Expert-level keyword research guidance');
console.log('');

class SEOKeywordResearchAgent {
  constructor() {
    this.tier = args.tier || 0;
    this.targetCount = parseInt(args.target || '500', 10);
    this.seedKeywords = args.seeds ? args.seeds.split(',') : this.getDefaultSeeds();
  }

  getDefaultSeeds() {
    return [
      'prop firm',
      'funded trading',
      'prop firm challenge',
      'trading drawdown',
      'profit target',
      'funded trader',
      'prop firm rules',
      'trading challenge',
    ];
  }

  // Get optimal filter settings based on tier
  getFilterSettings(tier = 0) {
    const settings = {
      0: {
        volume: { min: 0, max: 10 },
        kd: { min: 0, max: 15 },
        wordCount: { min: 3, max: 10 },
        competitiveDensity: { min: 0, max: 0.3 },
        trend: 'stable or growing',
        intent: ['informational', 'transactional'],
        serpFeatures: 'avoid featured snippets (too competitive)',
        expectedKGR: 0.25,
      },
      10: {
        volume: { min: 10, max: 20 },
        kd: { min: 0, max: 25 },
        wordCount: { min: 3, max: 8 },
        competitiveDensity: { min: 0, max: 0.4 },
        trend: 'stable or growing',
        intent: ['informational', 'transactional', 'commercial'],
        serpFeatures: 'target PAA (People Also Ask)',
        expectedKGR: 0.3,
      },
      20: {
        volume: { min: 20, max: 50 },
        kd: { min: 0, max: 35 },
        wordCount: { min: 2, max: 6 },
        competitiveDensity: { min: 0, max: 0.5 },
        trend: 'growing preferred',
        intent: ['commercial', 'transactional', 'informational'],
        serpFeatures: 'target PAA, featured snippets',
        expectedKGR: 0.5,
      },
      50: {
        volume: { min: 50, max: 100 },
        kd: { min: 0, max: 45 },
        wordCount: { min: 2, max: 5 },
        competitiveDensity: { min: 0, max: 0.6 },
        trend: 'growing required',
        intent: ['commercial', 'transactional'],
        serpFeatures: 'all types',
        expectedKGR: 1.0,
      },
    };

    return settings[tier] || settings[0];
  }

  // Get SEMrush filter instructions
  getSEMrushInstructions() {
    const settings = this.getFilterSettings(this.tier);

    printSection(`Tier ${this.tier} Filter Settings`);
    console.log('');

    printInfo('📊 VOLUME FILTER');
    console.log(`   Min: ${settings.volume.min}`);
    console.log(`   Max: ${settings.volume.max}`);
    console.log('   ✅ Action: Click "Volume" → Custom range → Enter values → Apply');
    console.log('');

    printInfo('🎯 KEYWORD DIFFICULTY (KD %)');
    console.log(`   Min: ${settings.kd.min}`);
    console.log(`   Max: ${settings.kd.max}%`);
    console.log('   ✅ Action: Click "KD %" → Custom range → Enter values → Apply');
    console.log('');

    printInfo('📝 WORD COUNT');
    console.log(`   Min: ${settings.wordCount.min} words`);
    console.log(`   Max: ${settings.wordCount.max} words`);
    console.log('   ✅ Action: Advanced filters → Word count → Enter values → Apply');
    console.log('   💡 Why: Longer phrases = more specific = easier to rank');
    console.log('');

    printInfo('🏆 COMPETITIVE DENSITY');
    console.log(`   Max: ${settings.competitiveDensity} (0-1 scale)`);
    console.log('   ✅ Action: Advanced filters → Competitive Density → Max value → Apply');
    console.log('   💡 Why: Low density = less paid competition = more organic opportunity');
    console.log('');

    printInfo('📈 TREND (Visual Check)');
    console.log(`   Target: ${settings.trend}`);
    console.log('   ✅ Action: Look at trend column sparklines');
    console.log('   ❌ Avoid: Declining trends (seasonal or dying keywords)');
    console.log('   ✅ Prefer: Flat or upward trends');
    console.log('');

    printInfo('🎨 SEARCH INTENT');
    console.log(`   Target: ${settings.intent.join(', ')}`);
    console.log('   ✅ Action: Click "Intent" filter → Select target intents');
    console.log('   💡 Intent types:');
    console.log('      I = Informational (how to, what is, guide)');
    console.log('      N = Navigational (brand searches - avoid)');
    console.log('      C = Commercial (best, top, review, vs)');
    console.log('      T = Transactional (buy, download, calculator, template)');
    console.log('');

    printInfo('🎁 SERP FEATURES');
    console.log(`   Strategy: ${settings.serpFeatures}`);
    console.log('   ✅ Action: Advanced filters → SERP Features');
    console.log('   💡 For Tier 0: Avoid featured snippets (too competitive)');
    console.log('   💡 For Tier 10+: Target "People Also Ask" (opportunity)');
    console.log('');

    printWarning('⚠️  CRITICAL: After All Filters Applied');
    console.log('   1. Sort by Volume (ascending) - lowest first');
    console.log('   2. Check first 100 keywords manually');
    console.log('   3. Look for question keywords (gold!)');
    console.log('   4. Export top 100-200 results');
    console.log('');
  }

  // KGR validation instructions
  getKGRValidationInstructions() {
    const settings = this.getFilterSettings(this.tier);

    printSection('KGR Validation Process');
    console.log('');

    printInfo('📐 KGR FORMULA');
    console.log('   KGR = Allintitle Results ÷ Monthly Search Volume');
    console.log(`   Target: ≤ ${settings.expectedKGR}`);
    console.log('');

    printInfo('🔍 HOW TO CHECK (For Top 20 Keywords)');
    console.log('   1. Open Google (incognito mode)');
    console.log('   2. Search: allintitle:"exact keyword phrase"');
    console.log('   3. Note the result count (e.g., "About 3 results")');
    console.log('   4. Calculate: Results ÷ Volume');
    console.log('   5. Keep if ≤ target KGR');
    console.log('');

    printInfo('✅ WHAT MAKES A GOOD KGR KEYWORD');
    console.log('   KGR 0.00-0.10 = EXCELLENT (publish immediately)');
    console.log('   KGR 0.10-0.25 = GOOD (easy to rank)');
    console.log('   KGR 0.25-0.50 = OKAY (moderate effort)');
    console.log('   KGR 0.50+ = SKIP (too competitive for tier)');
    console.log('');

    printInfo('🎯 PRIORITY KEYWORDS');
    console.log('   1. Calculator/template keywords (transactional)');
    console.log('   2. "How to" questions (high intent)');
    console.log('   3. Comparison keywords ("vs", "or", "comparison")');
    console.log('   4. Problem-solving ("fix", "solve", "avoid")');
    console.log('');
  }

  // Export instructions
  getExportInstructions() {
    printSection('Export Process');
    console.log('');

    printInfo('📥 SEMRUSH EXPORT STEPS');
    console.log('   1. After all filters applied, click "Export" button (top right)');
    console.log('   2. Choose "CSV" format');
    console.log('   3. Save as: semrush-[seed-keyword]-tier[X].csv');
    console.log('   4. Example: semrush-prop-firm-tier0.csv');
    console.log('');

    printInfo('📋 REQUIRED CSV COLUMNS');
    console.log('   ✅ Keyword');
    console.log('   ✅ Volume');
    console.log('   ✅ KD %');
    console.log('   ✅ Intent');
    console.log('   ✅ Trend');
    console.log('   ✅ CPC (optional, shows commercial value)');
    console.log('   ✅ Results (total Google results, NOT allintitle)');
    console.log('');

    printWarning('⚠️  IMPORTANT');
    console.log('   - SEMrush does NOT show allintitle count');
    console.log('   - You MUST manually check allintitle for KGR');
    console.log('   - Or use the import script I\'ll build to help');
    console.log('');
  }

  // Research workflow
  getResearchWorkflow() {
    printSection('Complete Research Workflow');
    console.log('');

    const steps = [
      {
        step: 1,
        title: 'Seed Keyword 1: "prop firm"',
        actions: [
          'Enter seed keyword',
          'Apply all filters (volume, KD, word count, competitive density, intent)',
          'Check result count (should be 50-200 keywords)',
          'Sort by volume (ascending)',
          'Export top 100 as CSV',
          'Time: 5 minutes',
        ],
      },
      {
        step: 2,
        title: 'Seed Keywords 2-8',
        actions: [
          'Repeat for: funded trading, prop firm challenge, trading drawdown, profit target, funded trader, prop firm rules, trading challenge',
          'Export each as separate CSV',
          'Total exports: 8 CSV files',
          'Time: 30-40 minutes',
        ],
      },
      {
        step: 3,
        title: 'Combine & Deduplicate',
        actions: [
          'Merge all 8 CSVs into one master file',
          'Remove duplicate keywords',
          'Expected: 400-800 unique keywords',
          'I\'ll build a script to automate this',
          'Time: 5 minutes (with script)',
        ],
      },
      {
        step: 4,
        title: 'KGR Validation (Top 100)',
        actions: [
          'Pick top 100 keywords by volume (lowest first)',
          'Manually check allintitle for each',
          'Calculate KGR',
          'Keep only KGR ≤ 0.25',
          'Expected: 50-70 verified keywords',
          'Time: 60 minutes',
        ],
      },
      {
        step: 5,
        title: 'Import to Queue',
        actions: [
          'Run: npm run semrush:import',
          'Script will add verified keywords to keyword-queue.json',
          'Assign templates based on intent',
          'Set priorities',
          'Time: 2 minutes',
        ],
      },
    ];

    for (const { step, title, actions } of steps) {
      printInfo(`STEP ${step}: ${title}`);
      actions.forEach(action => console.log(`   ${action.startsWith('Time:') ? '⏱️  ' : '•'} ${action}`));
      console.log('');
    }

    printSuccess(`Total Time: ~2 hours to get ${this.targetCount} keywords in pipeline`);
    console.log('');
  }

  // Pro tips
  getProTips() {
    printSection('Pro SEO Tips');
    console.log('');

    const tips = [
      {
        category: '🎯 Intent Signals',
        tips: [
          'Transactional: calculator, template, download, tool, free, spreadsheet',
          'Commercial: best, top, review, vs, comparison, alternative',
          'Informational: how to, what is, guide, explained, tips, example',
          'Avoid navigational: [brand name] + generic term',
        ],
      },
      {
        category: '📈 Trend Analysis',
        tips: [
          'Flat trend + low volume = stable opportunity (good)',
          'Growing trend = increasing demand (excellent)',
          'Declining trend = dying keyword (avoid)',
          'Seasonal spikes = plan content calendar around them',
        ],
      },
      {
        category: '🏆 Competitive Signals',
        tips: [
          'High CPC + low KD = hidden gem (commercial value, low competition)',
          'Low CPC + high KD = informational but competitive (okay if KGR good)',
          'Featured snippet present = hard to rank (need in-depth content)',
          'PAA (People Also Ask) = opportunity for FAQ schema',
        ],
      },
      {
        category: '🎨 Content Type Mapping',
        tips: [
          'Calculator/template → how-to article + downloadable resource',
          'How to/guide → ultimate-guide (2500+ words)',
          'Best/top → listicle (1500-2000 words)',
          'vs/comparison → comparison (2000-3000 words)',
          'Question → ultimate-guide with FAQ schema',
        ],
      },
      {
        category: '⚡ Quick Wins',
        tips: [
          'Volume 0-3 = fastest to rank (publish first)',
          'Question keywords = featured snippet opportunities',
          'Reddit/forum modifiers = community intent (high engagement)',
          'Year modifiers (2026) = freshness signal (update annually)',
        ],
      },
    ];

    tips.forEach(({ category, tips: tipList }) => {
      printInfo(category);
      tipList.forEach(tip => console.log(`   • ${tip}`));
      console.log('');
    });
  }

  // Run the agent
  run() {
    printSuccess('🤖 I\'m your SEO Keyword Research Agent');
    console.log('');

    printInfo(`Current Tier: ${this.tier}`);
    printInfo(`Target Keywords: ${this.targetCount}`);
    printInfo(`Seed Keywords: ${this.seedKeywords.length}`);
    console.log('');

    if (args.filters) {
      this.getSEMrushInstructions();
    } else if (args.kgr) {
      this.getKGRValidationInstructions();
    } else if (args.export) {
      this.getExportInstructions();
    } else if (args.workflow) {
      this.getResearchWorkflow();
    } else if (args.tips) {
      this.getProTips();
    } else {
      // Full guide
      this.getSEMrushInstructions();
      this.getKGRValidationInstructions();
      this.getExportInstructions();
      this.getProTips();
      this.getResearchWorkflow();
    }

    console.log('');
    printSection('Quick Commands');
    console.log('   node agents/seo-keyword-research-agent.mjs --filters   # Show filter settings');
    console.log('   node agents/seo-keyword-research-agent.mjs --kgr       # KGR validation guide');
    console.log('   node agents/seo-keyword-research-agent.mjs --export    # Export instructions');
    console.log('   node agents/seo-keyword-research-agent.mjs --workflow  # Full workflow');
    console.log('   node agents/seo-keyword-research-agent.mjs --tips      # Pro tips');
    console.log('   node agents/seo-keyword-research-agent.mjs --tier 10   # Tier 10 settings');
    console.log('');
  }
}

const agent = new SEOKeywordResearchAgent();
agent.run();
