#!/usr/bin/env node

/**
 * Final Clean & Merge Script
 *
 * This script:
 * 1. Loads all clean tier CSVs
 * 2. Removes Reddit/forum keywords
 * 3. Removes duplicate keywords
 * 4. Merges all tiers into final clean list
 * 5. Exports ready-to-import CSV
 *
 * Usage:
 *   node scripts/final-clean-merge.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs();
const RESEARCH_DIR = resolve(DATA_DIR, 'keyword-research');
const PROCESSED_DIR = resolve(RESEARCH_DIR, 'processed');

printHeader('Final Clean & Merge');
console.log('');

// Patterns to EXCLUDE (Reddit, forums, bad quality)
const EXCLUDE_PATTERNS = [
  /\breddit\b/i,
  /\bredit\b/i,  // misspelling
  /\bquora\b/i,
  /\btrustp(?:i|ilo)t\b/i,
  /\byoutube\b/i,
  /\bfacebook\b/i,
  /\btwitter\b/i,
  /\bdiscord\b/i,
  /\btelegram\b/i,
  /\bslack\b/i,
  /\ba document that outlines\b/i,  // nonsense keyword
  /\bis a document that\b/i,
];

// Parse CSV
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
  }

  return { headers, rows };
}

// Check if keyword should be excluded
function shouldExclude(keyword) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(keyword)) {
      return {
        exclude: true,
        reason: pattern.source.replace(/\\b|\\/g, '').replace(/i$/g, '')
      };
    }
  }
  return { exclude: false };
}

// Main function
function finalCleanMerge() {
  printSection('Step 1: Loading Clean Tier Files');

  const files = [
    { path: 'tier0-clean-2026-02-13.csv', tier: 0 },
    { path: 'tier20-clean-2026-02-13.csv', tier: 20 },
    { path: 'tier50-clean-2026-02-13.csv', tier: 50 },
  ];

  let allKeywords = [];
  let totalLoaded = 0;

  for (const { path, tier } of files) {
    try {
      const filePath = resolve(PROCESSED_DIR, path);
      const content = readFileSync(filePath, 'utf-8');
      const { headers, rows } = parseCSV(content);

      rows.forEach(row => {
        row.tier = tier; // Ensure tier is set
        allKeywords.push(row);
      });

      totalLoaded += rows.length;
      printInfo(`Loaded ${rows.length} keywords from Tier ${tier}`);
    } catch (err) {
      printWarning(`Could not load ${path}: ${err.message}`);
    }
  }

  console.log('');
  printInfo(`Total keywords loaded: ${totalLoaded}`);
  console.log('');

  printSection('Step 2: Removing Reddit/Forum Keywords');

  const filtered = {
    keep: [],
    remove: [],
    reasons: {}
  };

  for (const row of allKeywords) {
    const keyword = row.keyword;
    const check = shouldExclude(keyword);

    if (check.exclude) {
      filtered.remove.push(row);
      filtered.reasons[keyword] = check.reason;
    } else {
      filtered.keep.push(row);
    }
  }

  printInfo(`✅ Keywords to keep: ${filtered.keep.length}`);
  printWarning(`❌ Reddit/forum keywords removed: ${filtered.remove.length}`);

  if (filtered.remove.length > 0) {
    console.log('');
    console.log('❌ Removed keywords:');
    filtered.remove.slice(0, 20).forEach(row => {
      console.log(`   • "${row.keyword}" - Reason: ${filtered.reasons[row.keyword]}`);
    });
    if (filtered.remove.length > 20) {
      console.log(`   ... and ${filtered.remove.length - 20} more`);
    }
  }

  console.log('');

  printSection('Step 3: Removing Duplicates');

  const unique = new Map();

  for (const row of filtered.keep) {
    const key = row.keyword.toLowerCase().trim();

    if (!unique.has(key)) {
      unique.set(key, row);
    } else {
      // Keep the one with higher volume or lower tier
      const existing = unique.get(key);
      const existingVol = parseInt(existing.volume) || 0;
      const newVol = parseInt(row.volume) || 0;

      if (newVol > existingVol || (newVol === existingVol && row.tier < existing.tier)) {
        unique.set(key, row);
      }
    }
  }

  const final = Array.from(unique.values());

  printInfo(`Duplicates removed: ${filtered.keep.length - final.length}`);
  printSuccess(`Final unique keywords: ${final.length}`);
  console.log('');

  printSection('Step 4: Tier Distribution');

  const tierCounts = { 0: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0 };
  final.forEach(kw => tierCounts[kw.tier]++);

  Object.keys(tierCounts).forEach(tier => {
    const count = tierCounts[tier];
    if (count > 0) {
      const volumeRange = tier == 0 ? '0-10' :
                         tier == 10 ? '11-20' :
                         tier == 20 ? '21-50' :
                         tier == 50 ? '51-100' :
                         tier == 100 ? '101-200' : '200+';
      console.log(`  Tier ${tier} (${volumeRange} searches): ${count} keywords`);
    }
  });

  console.log('');

  return final;
}

// Export to CSV
function exportCSV(keywords, filename) {
  const headers = ['keyword', 'volume', 'kd', 'tier', 'intent', 'cpc', 'density', 'source'];
  const csvLines = [headers.join(',')];

  // Sort by tier (ascending), then by volume (descending within tier)
  keywords.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return (parseInt(b.volume) || 0) - (parseInt(a.volume) || 0);
  });

  for (const kw of keywords) {
    const row = [
      `"${kw.keyword}"`,
      kw.volume || 0,
      kw.kd || 0,
      kw.tier || 0,
      kw.intent || '',
      kw.cpc || 0,
      kw.density || 0,
      kw.source || ''
    ];
    csvLines.push(row.join(','));
  }

  const csvContent = csvLines.join('\n');
  const outputPath = resolve(PROCESSED_DIR, filename);

  writeFileSync(outputPath, csvContent, 'utf-8');
  printSuccess(`Exported to: ${outputPath}`);

  return outputPath;
}

// Main execution
try {
  const finalKeywords = finalCleanMerge();

  printSection('Step 5: Exporting Final Clean Keywords');

  const timestamp = new Date().toISOString().split('T')[0];

  // Export final clean list
  exportCSV(finalKeywords, `FINAL-CLEAN-KEYWORDS-${timestamp}.csv`);

  // Export by tier
  const tier0 = finalKeywords.filter(kw => kw.tier === 0);
  const tier20 = finalKeywords.filter(kw => kw.tier === 20);
  const tier50 = finalKeywords.filter(kw => kw.tier === 50);

  if (tier0.length > 0) exportCSV(tier0, `FINAL-tier0-${timestamp}.csv`);
  if (tier20.length > 0) exportCSV(tier20, `FINAL-tier20-${timestamp}.csv`);
  if (tier50.length > 0) exportCSV(tier50, `FINAL-tier50-${timestamp}.csv`);

  console.log('');
  printSection('🎉 FINAL SUMMARY');
  printSuccess(`✅ Total clean keywords: ${finalKeywords.length}`);
  printInfo(`   ├─ Tier 0 (0-10): ${tier0.length} keywords`);
  printInfo(`   ├─ Tier 20 (21-50): ${tier20.length} keywords`);
  printInfo(`   └─ Tier 50 (51-100): ${tier50.length} keywords`);
  console.log('');
  printSuccess(`📁 Main file: FINAL-CLEAN-KEYWORDS-${timestamp}.csv`);
  console.log('');
  printSuccess('🚀 Ready to import! Run: npm run keywords:import');

} catch (err) {
  printError(`Error: ${err.message}`);
  console.error(err);
  process.exit(1);
}
