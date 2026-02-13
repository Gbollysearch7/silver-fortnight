#!/usr/bin/env node

/**
 * Keyword CSV Merge & Cleanup Script
 *
 * This script:
 * 1. Reads all CSV files from data/keyword-research/
 * 2. Removes branded keywords (150+ brands)
 * 3. Removes duplicates
 * 4. Validates data quality
 * 5. Assigns tiers based on volume
 * 6. Exports clean CSV to processed/ folder
 *
 * Usage:
 *   node scripts/merge-keywords.mjs
 *   node scripts/merge-keywords.mjs --dry-run
 *   node scripts/merge-keywords.mjs --include-claude-keywords
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs();
const dryRun = args['dry-run'] || false;
const includeClaudeKeywords = args['include-claude-keywords'] || false;

const RESEARCH_DIR = resolve(DATA_DIR, 'keyword-research');
const PROCESSED_DIR = resolve(RESEARCH_DIR, 'processed');
const BRAND_LIST_PATH = resolve(DATA_DIR, 'brand-exclusion-list.txt');

printHeader('Keyword CSV Merge & Cleanup');
printInfo(`Research folder: ${RESEARCH_DIR}`);
printInfo(`Output folder: ${PROCESSED_DIR}`);
if (dryRun) printWarning('DRY RUN MODE - No files will be written');
console.log('');

// Load brand exclusion list
function loadBrandList() {
  try {
    const content = readFileSync(BRAND_LIST_PATH, 'utf-8');
    const brands = content
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(brand => brand.toLowerCase().trim());

    printSuccess(`Loaded ${brands.length} brands to exclude`);
    return brands;
  } catch (err) {
    printWarning('Brand exclusion list not found, using built-in list');
    return getBuiltInBrandList();
  }
}

function getBuiltInBrandList() {
  return [
    'ftmo', 'the5ers', 'topstep', 'earn2trade', 'fidelcrest', 'myfundedfx',
    'myforexfunds', 'funded next', 'fundednext', 'blue guardian', 'blueguardian',
    'lux trading', 'apex trader', 'apextrader', 'surge trader', 'surgetrader',
    'funded trader plus', 'alpha capital', 'bulenox', 'city traders', 'e8 funding',
    'e8 markets', 'fast track', 'instant funding', 'maven trading', 'take profit trader',
    'skilled funded', 'traders with edge', 'funded peaks', 'elite trader', 'darwinex',
    'oneup trader', 'opofinance', 'peak trader', 'prop trading tech', 'smart prop trader',
    'tallinex', 'traders flow', 'tradex fund', '5percenters', '5 percenters', 'funded futures',
    'hyper funded', 'phoenix trader', 'prop firm x', 'quick funded', 'swift trader',
    'breakout', 'lark funding', 'infinity trading', 'alpha trader', 'oanda', 'fxcm',
    'forex.com', 'forexcom', 'ig markets', 'etoro', 'plus500', 'avatrade', 'pepperstone',
    'xm', 'metatrader', 'mt4', 'mt5', 'tradingview', 'ninjatrader', 'ctrader'
  ];
}

// Check if keyword contains branded term
function isBranded(keyword, brandList) {
  const lower = keyword.toLowerCase();
  return brandList.some(brand => {
    // Check for whole word match to avoid false positives
    const regex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(lower);
  });
}

// Find all CSV files
function findCSVFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory() && item !== 'processed' && item !== 'claude-research') {
        walk(fullPath);
      } else if (stat.isFile() && item.endsWith('.csv')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

// Parse CSV (simple parser, handles quoted fields)
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Simple CSV parse (doesn't handle commas within quotes perfectly, but good enough)
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};

    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    rows.push(row);
  }

  return { headers, rows };
}

// Normalize headers across different CSV formats
function normalizeRow(row) {
  const normalized = {};

  // Map various header names to standard fields
  const keywordFields = ['Keyword', 'keyword', 'Query', 'query'];
  const volumeFields = ['Volume', 'volume', 'Search Volume', 'search_volume', 'Monthly Searches'];
  const kdFields = ['Keyword Difficulty', 'KD', 'kd', 'Difficulty', 'difficulty'];
  const intentFields = ['Intent', 'intent', 'Search Intent'];
  const cpcFields = ['CPC', 'cpc', 'CPC (USD)', 'Cost Per Click'];
  const densityFields = ['Competitive Density', 'competitive_density', 'Comp. Density'];

  // Find and assign keyword
  for (const field of keywordFields) {
    if (row[field]) {
      normalized.keyword = row[field];
      break;
    }
  }

  // Find and assign volume
  for (const field of volumeFields) {
    if (row[field]) {
      normalized.volume = parseInt(row[field]) || 0;
      break;
    }
  }

  // Find and assign KD
  for (const field of kdFields) {
    if (row[field]) {
      normalized.kd = parseFloat(row[field]) || 0;
      break;
    }
  }

  // Find and assign intent
  for (const field of intentFields) {
    if (row[field]) {
      normalized.intent = row[field];
      break;
    }
  }

  // Find and assign CPC
  for (const field of cpcFields) {
    if (row[field]) {
      normalized.cpc = parseFloat(row[field]) || 0;
      break;
    }
  }

  // Find and assign density
  for (const field of densityFields) {
    if (row[field]) {
      normalized.density = parseFloat(row[field]) || 0;
      break;
    }
  }

  return normalized;
}

// Assign tier based on volume
function assignTier(volume) {
  if (volume >= 0 && volume <= 10) return 0;
  if (volume >= 11 && volume <= 20) return 10;
  if (volume >= 21 && volume <= 50) return 20;
  if (volume >= 51 && volume <= 100) return 50;
  if (volume >= 101 && volume <= 200) return 100;
  return 200;
}

// Main merge function
function mergeKeywords() {
  printSection('Step 1: Loading CSV Files');

  const csvFiles = findCSVFiles(RESEARCH_DIR);
  printInfo(`Found ${csvFiles.length} CSV files`);

  csvFiles.forEach(file => {
    console.log(`  • ${file.replace(RESEARCH_DIR + '/', '')}`);
  });
  console.log('');

  printSection('Step 2: Loading Brand Exclusion List');
  const brandList = loadBrandList();
  console.log('');

  printSection('Step 3: Parsing & Merging Keywords');

  const allKeywords = [];
  let totalRows = 0;
  let skippedBranded = 0;
  let skippedInvalid = 0;

  for (const file of csvFiles) {
    const content = readFileSync(file, 'utf-8');
    const { headers, rows } = parseCSV(content);

    totalRows += rows.length;

    for (const row of rows) {
      const normalized = normalizeRow(row);

      // Skip if no keyword
      if (!normalized.keyword || normalized.keyword.trim().length === 0) {
        skippedInvalid++;
        continue;
      }

      // Skip if branded
      if (isBranded(normalized.keyword, brandList)) {
        skippedBranded++;
        continue;
      }

      // Skip if volume is NaN or too high
      if (isNaN(normalized.volume) || normalized.volume > 100) {
        skippedInvalid++;
        continue;
      }

      // Assign tier
      normalized.tier = assignTier(normalized.volume);
      normalized.source = file.includes('semrush') ? 'semrush' :
                         file.includes('ahrefs') ? 'ahrefs' : 'unknown';

      allKeywords.push(normalized);
    }
  }

  printInfo(`Total rows processed: ${totalRows}`);
  printWarning(`Skipped branded keywords: ${skippedBranded}`);
  printWarning(`Skipped invalid rows: ${skippedInvalid}`);
  printSuccess(`Valid keywords extracted: ${allKeywords.length}`);
  console.log('');

  printSection('Step 4: Removing Duplicates');

  const uniqueKeywords = new Map();

  for (const kw of allKeywords) {
    const key = kw.keyword.toLowerCase().trim();

    if (!uniqueKeywords.has(key)) {
      uniqueKeywords.set(key, kw);
    } else {
      // Keep the one with more data (higher volume, higher CPC, etc.)
      const existing = uniqueKeywords.get(key);
      if (kw.volume > existing.volume || (kw.volume === existing.volume && kw.cpc > existing.cpc)) {
        uniqueKeywords.set(key, kw);
      }
    }
  }

  const deduplicated = Array.from(uniqueKeywords.values());
  printInfo(`Duplicates removed: ${allKeywords.length - deduplicated.length}`);
  printSuccess(`Unique keywords: ${deduplicated.length}`);
  console.log('');

  printSection('Step 5: Tier Distribution');

  const tierCounts = {
    0: 0,
    10: 0,
    20: 0,
    50: 0,
    100: 0,
    200: 0
  };

  deduplicated.forEach(kw => {
    tierCounts[kw.tier]++;
  });

  Object.keys(tierCounts).forEach(tier => {
    const count = tierCounts[tier];
    const volumeRange = tier == 0 ? '0-10' :
                       tier == 10 ? '11-20' :
                       tier == 20 ? '21-50' :
                       tier == 50 ? '51-100' :
                       tier == 100 ? '101-200' : '200+';

    console.log(`  Tier ${tier} (${volumeRange} searches): ${count} keywords`);
  });
  console.log('');

  return deduplicated;
}

// Export to CSV
function exportCSV(keywords, filename) {
  const headers = ['keyword', 'volume', 'kd', 'tier', 'intent', 'cpc', 'density', 'source'];
  const csvLines = [headers.join(',')];

  // Sort by tier (ascending), then by volume (descending within tier)
  keywords.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.volume - a.volume;
  });

  for (const kw of keywords) {
    const row = [
      `"${kw.keyword}"`,
      kw.volume || 0,
      kw.kd || 0,
      kw.tier,
      kw.intent || '',
      kw.cpc || 0,
      kw.density || 0,
      kw.source || ''
    ];
    csvLines.push(row.join(','));
  }

  const csvContent = csvLines.join('\n');
  const outputPath = resolve(PROCESSED_DIR, filename);

  if (!dryRun) {
    writeFileSync(outputPath, csvContent, 'utf-8');
    printSuccess(`Exported to: ${outputPath}`);
  } else {
    printInfo(`Would export to: ${outputPath}`);
  }

  return outputPath;
}

// Main execution
try {
  const mergedKeywords = mergeKeywords();

  printSection('Step 6: Exporting Results');

  const timestamp = new Date().toISOString().split('T')[0];

  // Export all keywords
  exportCSV(mergedKeywords, `all-keywords-${timestamp}.csv`);

  // Export by tier
  const tier0 = mergedKeywords.filter(kw => kw.tier === 0);
  const tier10 = mergedKeywords.filter(kw => kw.tier === 10);
  const tier20 = mergedKeywords.filter(kw => kw.tier === 20);
  const tier50 = mergedKeywords.filter(kw => kw.tier === 50);

  if (tier0.length > 0) exportCSV(tier0, `tier0-keywords-${timestamp}.csv`);
  if (tier10.length > 0) exportCSV(tier10, `tier10-keywords-${timestamp}.csv`);
  if (tier20.length > 0) exportCSV(tier20, `tier20-keywords-${timestamp}.csv`);
  if (tier50.length > 0) exportCSV(tier50, `tier50-keywords-${timestamp}.csv`);

  console.log('');
  printSection('Summary');
  printSuccess(`✅ Processed ${mergedKeywords.length} unique keywords`);
  printInfo(`📊 Tier 0 (0-10): ${tier0.length} keywords`);
  printInfo(`📊 Tier 10 (11-20): ${tier10.length} keywords`);
  printInfo(`📊 Tier 20 (21-50): ${tier20.length} keywords`);
  printInfo(`📊 Tier 50 (51-100): ${tier50.length} keywords`);
  console.log('');

  if (!dryRun) {
    printSuccess('🎯 Next step: Run "npm run keywords:import" to add to queue');
  } else {
    printWarning('DRY RUN COMPLETE - No files were written');
  }

} catch (err) {
  printError(`Error: ${err.message}`);
  console.error(err);
  process.exit(1);
}
