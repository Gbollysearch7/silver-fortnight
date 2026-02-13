#!/usr/bin/env node

/**
 * SEO Content Calendar Agent
 * Builds strategic content calendars using cluster → pillar → supporting page architecture
 *
 * This agent knows:
 * - Topic clustering methodology
 * - Pillar vs supporting content strategy
 * - Content hierarchy and internal linking
 * - Publishing cadence optimization
 * - Keyword-to-content-type mapping
 *
 * Usage:
 *   node agents/seo-content-calendar-agent.mjs
 */

import { resolve } from 'path';
import { DATA_DIR, ROOT_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError, readJsonFile, writeJsonFile, slugify } from '../lib/utils.mjs';

const args = parseArgs();

printHeader('SEO Content Calendar Agent');
printInfo('Strategic content planning with cluster → pillar → supporting architecture');
console.log('');

class SEOContentCalendarAgent {
  constructor() {
    this.queuePath = resolve(DATA_DIR, 'keyword-queue.json');
    this.calendarPath = resolve(ROOT_DIR, 'calendar');
  }

  // Analyze keywords and identify clusters
  analyzeKeywordClusters(keywords) {
    const clusters = {};

    for (const kw of keywords) {
      const keyword = kw.keyword.toLowerCase();

      // Identify main topic (cluster)
      let cluster = 'general';

      if (keyword.includes('calculator') || keyword.includes('spreadsheet') || keyword.includes('template')) {
        cluster = 'tools-resources';
      } else if (keyword.includes('how to') || keyword.includes('guide') || keyword.includes('explained')) {
        cluster = 'how-to-guides';
      } else if (keyword.includes('best') || keyword.includes('top') || keyword.includes('review')) {
        cluster = 'comparisons-reviews';
      } else if (keyword.includes('vs') || keyword.includes('comparison') || keyword.includes('or')) {
        cluster = 'head-to-head';
      } else if (keyword.includes('rules') || keyword.includes('policy') || keyword.includes('requirements')) {
        cluster = 'regulations-rules';
      } else if (keyword.includes('drawdown') || keyword.includes('loss') || keyword.includes('risk')) {
        cluster = 'risk-management';
      } else if (keyword.includes('profit') || keyword.includes('payout') || keyword.includes('withdrawal')) {
        cluster = 'profit-payouts';
      } else if (keyword.includes('challenge') || keyword.includes('evaluation') || keyword.includes('phase')) {
        cluster = 'challenge-process';
      }

      if (!clusters[cluster]) {
        clusters[cluster] = [];
      }

      clusters[cluster].push(kw);
    }

    return clusters;
  }

  // Determine content hierarchy
  determineContentHierarchy(cluster, keywords) {
    // Sort by volume (highest first for pillars)
    const sorted = [...keywords].sort((a, b) => (b.estMonthlySearches || 0) - (a.estMonthlySearches || 0));

    // Top keyword with highest volume = potential pillar
    const pillarCandidate = sorted[0];

    // Medium volume = cluster pages
    const clusterPages = sorted.filter(kw =>
      (kw.estMonthlySearches || 0) >= 20 && (kw.estMonthlySearches || 0) < 50
    );

    // Low volume = supporting pages
    const supportingPages = sorted.filter(kw =>
      (kw.estMonthlySearches || 0) < 20
    );

    return {
      pillar: pillarCandidate,
      clusters: clusterPages.slice(0, 3), // Max 3 cluster pages
      supporting: supportingPages,
    };
  }

  // Content calendar strategy
  getContentCalendarStrategy() {
    printSection('Content Calendar Strategy: Cluster → Pillar → Supporting');
    console.log('');

    printInfo('📚 CONTENT HIERARCHY');
    console.log('   1. Supporting Pages (Tier 0-10) → Build foundation');
    console.log('   2. Cluster Pages (Tier 10-20) → Group related content');
    console.log('   3. Pillar Pages (Tier 50+) → Comprehensive guides');
    console.log('');

    printInfo('🏗️  ARCHITECTURE EXAMPLE: "Prop Firm Challenge" Topic');
    console.log('');
    console.log('   PILLAR (Publish LAST, after 20+ supporting pages)');
    console.log('   └─ "Ultimate Guide to Prop Firm Challenges" (2000-5000 words)');
    console.log('      • Target: 50-100 monthly searches');
    console.log('      • Links to ALL supporting pages below');
    console.log('      • Comprehensive, authoritative resource');
    console.log('');
    console.log('   CLUSTER PAGES (Publish SECOND, after 10+ supporting)');
    console.log('   ├─ "Prop Firm Challenge Rules Explained" (1500-2000 words)');
    console.log('   │  • Target: 10-20 monthly searches');
    console.log('   │  • Links to 5-10 supporting pages');
    console.log('   ├─ "How to Pass Prop Firm Challenges" (1500-2000 words)');
    console.log('   │  • Target: 10-20 monthly searches');
    console.log('   │  • Links to 5-10 supporting pages');
    console.log('   └─ "Prop Firm Challenge Calculators & Tools" (1500-2000 words)');
    console.log('      • Target: 10-20 monthly searches');
    console.log('      • Links to 5-10 supporting pages');
    console.log('');
    console.log('   SUPPORTING PAGES (Publish FIRST)');
    console.log('   ├─ "Prop Firm Challenge Calculator Excel" (800-1200 words) [Tier 0]');
    console.log('   ├─ "Prop Firm Daily Loss Limit Calculation" (800-1200 words) [Tier 0]');
    console.log('   ├─ "Trading Challenge Profit Target Formula" (800-1200 words) [Tier 0]');
    console.log('   ├─ "Prop Firm Trailing Drawdown Explained" (800-1200 words) [Tier 0]');
    console.log('   ├─ "FTMO Challenge Profit Calculator" (800-1200 words) [Tier 0]');
    console.log('   ├─ "Prop Firm Challenge Spreadsheet Template" (800-1200 words) [Tier 0]');
    console.log('   └─ ... (15-20 more Tier 0 pages)');
    console.log('');

    printInfo('🔗 INTERNAL LINKING STRATEGY');
    console.log('   Supporting → Cluster: Each supporting page links UP to relevant cluster page');
    console.log('   Cluster → Pillar: Each cluster page links UP to pillar page');
    console.log('   Pillar → Supporting: Pillar links DOWN to all supporting pages');
    console.log('   Pillar → Cluster: Pillar links DOWN to all cluster pages');
    console.log('');
    console.log('   💡 This creates an "authority pyramid" that passes link equity UP');
    console.log('');

    printInfo('📅 PUBLISHING CADENCE');
    console.log('   Month 1-2: Publish 20-30 Tier 0 supporting pages (2/day)');
    console.log('   Month 2-3: Publish 3-5 cluster pages (1/week)');
    console.log('   Month 3-4: Publish 1 pillar page (once foundation is strong)');
    console.log('   Month 4+: Repeat for next topic cluster');
    console.log('');

    printWarning('⚠️  CRITICAL RULES');
    console.log('   1. NEVER publish pillar before supporting pages');
    console.log('   2. Build foundation first (Tier 0 → Tier 10 → Tier 20 → Tier 50)');
    console.log('   3. Each pillar needs 20-30 supporting pages minimum');
    console.log('   4. Internal links must flow UP (supporting → cluster → pillar)');
    console.log('   5. Update pillar page as you add more supporting content');
    console.log('');
  }

  // Topic clusters for prop trading
  getTopicClusters() {
    printSection('Prop Trading Topic Clusters');
    console.log('');

    const clusters = [
      {
        name: 'Prop Firm Challenge Process',
        pillarKeyword: 'prop firm challenge guide',
        pillarVolume: '50-100',
        clusterPages: [
          'how to pass prop firm challenge',
          'prop firm challenge rules explained',
          'prop firm challenge tips and tricks',
        ],
        supportingCount: '25-30',
        supportingExamples: [
          'prop firm challenge calculator excel',
          'prop firm daily loss limit calculation',
          'trading challenge profit target formula',
          'prop firm trailing drawdown explained',
          'prop firm challenge journal template',
        ],
      },
      {
        name: 'Funded Trading Profits & Payouts',
        pillarKeyword: 'funded trading profit guide',
        pillarVolume: '50-100',
        clusterPages: [
          'funded trader profit split explained',
          'prop firm payout schedule timeline',
          'funded trader withdrawal process',
        ],
        supportingCount: '20-25',
        supportingExamples: [
          'funded trader profit split calculator',
          'prop firm payout schedule timeline',
          'funded trader withdrawal process time',
          'prop firm profit target realistic',
        ],
      },
      {
        name: 'Risk Management & Drawdown',
        pillarKeyword: 'prop firm risk management guide',
        pillarVolume: '50-100',
        clusterPages: [
          'trading drawdown explained',
          'prop firm loss limits guide',
          'risk management for prop traders',
        ],
        supportingCount: '20-25',
        supportingExamples: [
          'drawdown calculation formula prop firm',
          'how to calculate max drawdown prop firm',
          'prop firm daily loss limit calculation',
          'trading challenge risk management checklist',
        ],
      },
      {
        name: 'Prop Firm Rules & Requirements',
        pillarKeyword: 'prop firm rules requirements guide',
        pillarVolume: '50-100',
        clusterPages: [
          'prop firm trading rules explained',
          'funded trading account requirements',
          'prop firm challenge rules checklist',
        ],
        supportingCount: '20-25',
        supportingExamples: [
          'funded trading account rules checklist',
          'prop firm weekend holding allowed',
          'trading challenge news trading rules',
          'prop firm ea allowed policy',
          'prop firm kyc requirements documents',
        ],
      },
      {
        name: 'Tools & Calculators',
        pillarKeyword: 'prop firm trading tools calculators',
        pillarVolume: '20-50',
        clusterPages: [
          'prop firm calculators collection',
          'trading challenge planning tools',
          'funded trader spreadsheet templates',
        ],
        supportingCount: '15-20',
        supportingExamples: [
          'prop firm challenge calculator excel',
          'funded trader profit split calculator',
          'ftmo challenge profit calculator',
          'funded trader max lot size calculator',
          'prop firm challenge spreadsheet template',
        ],
      },
    ];

    clusters.forEach((cluster, idx) => {
      printInfo(`${idx + 1}. ${cluster.name}`);
      console.log('');
      console.log(`   PILLAR: "${cluster.pillarKeyword}" (${cluster.pillarVolume} searches/month)`);
      console.log('   ├─ Publish LAST (after all supporting pages)');
      console.log('   ├─ Word count: 3000-5000 words');
      console.log('   └─ Links to: ALL supporting + cluster pages');
      console.log('');
      console.log('   CLUSTER PAGES (3):');
      cluster.clusterPages.forEach(page => {
        console.log(`   ├─ ${page}`);
      });
      console.log('');
      console.log(`   SUPPORTING PAGES (${cluster.supportingCount}):`);
      cluster.supportingExamples.forEach(page => {
        console.log(`   ├─ ${page}`);
      });
      console.log(`   └─ ... (${cluster.supportingCount} total supporting pages)`);
      console.log('');
      console.log(`   📅 TIMELINE:`);
      console.log(`   • Month 1-2: Publish ${cluster.supportingCount} supporting pages`);
      console.log(`   • Month 2: Publish 3 cluster pages`);
      console.log(`   • Month 3: Publish 1 pillar page`);
      console.log('');
      printSuccess(`Total content pieces: ${parseInt(cluster.supportingCount.split('-')[0]) + 3 + 1} articles`);
      console.log('');
      console.log('─'.repeat(80));
      console.log('');
    });

    printInfo('📊 TOTAL ACROSS ALL CLUSTERS');
    console.log('   Pillar pages: 5');
    console.log('   Cluster pages: 15');
    console.log('   Supporting pages: 105-125');
    console.log('   ');
    printSuccess('Grand total: 125-145 articles for complete topic coverage');
    console.log('');
  }

  // Generate publishing calendar
  generatePublishingCalendar(keywords, startDate = new Date()) {
    printSection('Publishing Calendar Generator');
    console.log('');

    const clusters = this.analyzeKeywordClusters(keywords);
    const calendar = {};
    let currentDate = new Date(startDate);

    // Phase 1: Supporting pages (Tier 0-10)
    printInfo('PHASE 1: Supporting Pages (60 days)');
    console.log('   Publishing: 2 articles/day');
    console.log('   Focus: Tier 0 keywords (0-10 monthly searches)');
    console.log('');

    const supportingPages = keywords.filter(kw => (kw.tier || 0) === 0);

    for (let i = 0; i < Math.min(60, supportingPages.length); i++) {
      const dateKey = currentDate.toISOString().split('T')[0];

      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }

      if (supportingPages[i]) {
        calendar[dateKey].push({
          ...supportingPages[i],
          contentType: 'supporting',
          phase: 1,
        });
      }

      // Publish 2 per day
      if ((i + 1) % 2 === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    printSuccess(`${Math.min(60, supportingPages.length)} supporting pages scheduled`);
    console.log('');

    // Phase 2: Cluster pages
    printInfo('PHASE 2: Cluster Pages (15 days)');
    console.log('   Publishing: 1 article every 3-5 days');
    console.log('   Focus: Tier 10-20 keywords (10-50 monthly searches)');
    console.log('');

    currentDate.setDate(currentDate.getDate() + 3); // Wait 3 days after supporting pages

    const clusterPages = keywords.filter(kw => (kw.tier || 0) >= 10 && (kw.tier || 0) < 50);

    for (let i = 0; i < Math.min(5, clusterPages.length); i++) {
      const dateKey = currentDate.toISOString().split('T')[0];

      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }

      if (clusterPages[i]) {
        calendar[dateKey].push({
          ...clusterPages[i],
          contentType: 'cluster',
          phase: 2,
        });
      }

      currentDate.setDate(currentDate.getDate() + 3); // Every 3 days
    }

    printSuccess(`${Math.min(5, clusterPages.length)} cluster pages scheduled`);
    console.log('');

    // Phase 3: Pillar page
    printInfo('PHASE 3: Pillar Page (1 article)');
    console.log('   Publishing: 1 comprehensive article');
    console.log('   Focus: Tier 50+ keyword (50-100+ monthly searches)');
    console.log('');

    currentDate.setDate(currentDate.getDate() + 7); // Wait 7 days after cluster pages

    const pillarPages = keywords.filter(kw => (kw.tier || 0) >= 50);

    if (pillarPages.length > 0) {
      const dateKey = currentDate.toISOString().split('T')[0];

      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }

      calendar[dateKey].push({
        ...pillarPages[0],
        contentType: 'pillar',
        phase: 3,
      });

      printSuccess('1 pillar page scheduled');
    }

    console.log('');

    return calendar;
  }

  // Show calendar preview
  showCalendarPreview(calendar) {
    printSection('Calendar Preview (First 30 Days)');
    console.log('');

    const dates = Object.keys(calendar).sort().slice(0, 30);

    for (const date of dates) {
      const articles = calendar[date];

      if (articles.length > 0) {
        printInfo(date);
        articles.forEach(article => {
          const badge = article.contentType === 'supporting' ? '📄' :
                       article.contentType === 'cluster' ? '📁' : '📚';
          console.log(`   ${badge} ${article.title || article.keyword}`);
          console.log(`      Tier: ${article.tier || 0} | Volume: ${article.estMonthlySearches || 0} | Template: ${article.template || 'how-to'}`);
        });
        console.log('');
      }
    }
  }

  // Run the agent
  run() {
    printSuccess('🤖 I\'m your SEO Content Calendar Agent');
    console.log('');

    if (args.strategy) {
      this.getContentCalendarStrategy();
    } else if (args.clusters) {
      this.getTopicClusters();
    } else if (args.generate) {
      // Load keywords from queue
      const queueData = readJsonFile(this.queuePath);
      if (!queueData || !queueData.queue) {
        printError('No keywords found in queue. Run keyword research first.');
        return;
      }

      const calendar = this.generatePublishingCalendar(queueData.queue);
      this.showCalendarPreview(calendar);

      // Save calendar
      const calendarFile = resolve(this.calendarPath, `${new Date().toISOString().split('T')[0]}-publishing-calendar.json`);
      writeJsonFile(calendarFile, calendar);
      printSuccess(`Calendar saved to: ${calendarFile}`);
    } else {
      // Full guide
      this.getContentCalendarStrategy();
      console.log('');
      this.getTopicClusters();
    }

    console.log('');
    printSection('Quick Commands');
    console.log('   node agents/seo-content-calendar-agent.mjs --strategy   # Content hierarchy strategy');
    console.log('   node agents/seo-content-calendar-agent.mjs --clusters   # Topic cluster examples');
    console.log('   node agents/seo-content-calendar-agent.mjs --generate   # Generate calendar from queue');
    console.log('');
  }
}

const agent = new SEOContentCalendarAgent();
agent.run();
