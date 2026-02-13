#!/usr/bin/env node

/**
 * AGGRESSIVE Brand Keyword Filter
 *
 * This script catches ALL brand mentions including:
 * - Multi-word brands ("alpha trader", "alpha futures")
 * - Partial matches ("hft prop firm" where HFT is a brand)
 * - Misspellings and variations
 * - Brand + generic terms
 *
 * Usage:
 *   node scripts/deep-brand-filter.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs();
const RESEARCH_DIR = resolve(DATA_DIR, 'keyword-research');
const PROCESSED_DIR = resolve(RESEARCH_DIR, 'processed');

printHeader('Aggressive Brand Keyword Filter');
console.log('');

// COMPREHENSIVE brand list (case-insensitive regex patterns)
const BRAND_PATTERNS = [
  // Major prop firms
  /\bftmo\b/i,
  /\bthe\s*5\s*ers\b/i,
  /\b5\s*percenters\b/i,
  /\btopstep\b/i,
  /\bearn2trade\b/i,
  /\bearn\s*2\s*trade\b/i,
  /\bfidelcrest\b/i,
  /\bmyfundedfx\b/i,
  /\bmy\s*funded\s*fx\b/i,
  /\bmyforexfunds\b/i,
  /\bmy\s*forex\s*funds\b/i,
  /\bfunded\s*next\b/i,
  /\bfundednext\b/i,
  /\bblue\s*guardian\b/i,
  /\bblueguardian\b/i,
  /\blux\s*trading\b/i,
  /\bapex\s*trader\b/i,
  /\bapex\s*funding\b/i,
  /\bapex\s*futures\b/i, // MISSED THIS!
  /\bapextrader\b/i,
  /\bsurge\s*trader\b/i,
  /\bsurgetrader\b/i,
  /\bfunded\s*trader\s*plus\b/i,
  /\balpha\s*capital\b/i,
  /\balpha\s*trader\b/i, // MISSED THIS!
  /\balpha\s*futures\b/i, // MISSED THIS!
  /\bbulenox\b/i,
  /\bcity\s*traders\b/i,
  /\be8\s*funding\b/i,
  /\be8\s*markets\b/i,
  /\bfast\s*track\b/i,
  /\binstant\s*funding\b/i,
  /\bmaven\b/i, // MISSED THIS! (Maven Trading, Maven Prop Firm)
  /\btake\s*profit\s*trader\b/i,
  /\bskilled\s*funded\b/i,
  /\btraders\s*with\s*edge\b/i,
  /\bfunded\s*peaks\b/i,
  /\belite\s*trader\b/i,
  /\bdarwinex\b/i,
  /\boneup\s*trader\b/i,
  /\bopo\s*finance\b/i,
  /\bopofinance\b/i,
  /\bpeak\s*trader\b/i,
  /\bprop\s*trading\s*tech\b/i,
  /\bsmart\s*prop\b/i,
  /\btallinex\b/i,
  /\btraders\s*flow\b/i,
  /\btradex\s*fund\b/i,
  /\b5\s*percenters\b/i,
  /\bfunded\s*futures\b/i,
  /\bhyper\s*funded\b/i,
  /\bphoenix\s*trader\b/i,
  /\bprop\s*firm\s*x\b/i,
  /\bquick\s*funded\b/i,
  /\bswift\s*trader\b/i,
  /\bbreakout\b/i,
  /\blark\s*funding\b/i,
  /\binfinity\s*trading\b/i,
  /\bupcomers\b/i, // MISSED THIS!
  /\bfunding\s*traders\b/i, // MISSED THIS!
  /\bedge\s*funder\b/i, // MISSED THIS!
  /\bthe\s*edge\s*funder\b/i,
  /\btradeify\b/i, // MISSED THIS!
  /\baqua\s*funded\b/i,
  /\baqua\s*futures\b/i, // MISSED THIS!
  /\baqua\s*capital\b/i, // MISSED THIS!
  /\bvebson\b/i, // MISSED THIS!
  /\bmffu\b/i, // MISSED THIS!
  /\baxi\s*select\b/i,
  /\bbig\s*mike\b/i,
  /\bcfunds\b/i,
  /\bcognitrader\b/i,
  /\bcti\b/i,
  /\bglow\s*node\b/i,
  /\bgreenbull\b/i,
  /\bhantec\b/i,
  /\bic\s*funding\b/i,
  /\bmarket\s*masters\b/i,
  /\bprofit\s*first\b/i,
  /\bqaunta\b/i,
  /\bquantum\s*trader\b/i,
  /\bround\s*rock\b/i,
  /\bsage\s*trader\b/i,
  /\bshcapital\b/i,
  /\bsmc\s*trade\b/i,
  /\bt4t\s*capital\b/i,
  /\btlc\s*funded\b/i,
  /\btraders\s*club\b/i,
  /\btradify\b/i,
  /\bunicorn\b/i,
  /\bgoated\s*trading\b/i,
  /\bjumpstart\s*trading\b/i,
  /\bleveled\s*up\b/i,
  /\bmint\s*funded\b/i,
  /\bnexus\s*funded\b/i,
  /\bnordic\s*funder\b/i,
  /\borca\s*funds\b/i,
  /\bpropify\b/i,
  /\brebel\s*funded\b/i,
  /\brocket\s*21\b/i,
  /\bscale\s*capital\b/i,
  /\bsonic\s*trading\b/i,
  /\bstellar\s*trading\b/i,
  /\buprofit\s*trader\b/i,
  /\bvault\s*markets\b/i,

  // Brokers
  /\boanda\b/i,
  /\bfxcm\b/i,
  /\bforex\.com\b/i,
  /\big\s*markets\b/i,
  /\betoro\b/i,
  /\bplus500\b/i,
  /\bavatrade\b/i,
  /\bpepperstone\b/i,
  /\bxm\s*trading\b/i,
  /\bhotforex\b/i,
  /\bfbs\b/i,
  /\boctafx\b/i,
  /\btickmill\b/i,
  /\broboforex\b/i,
  /\bic\s*markets\b/i,
  /\bfp\s*markets\b/i,
  /\beightcap\b/i,

  // Platforms
  /\bmetatrader\b/i,
  /\bmt4\b/i,
  /\bmt5\b/i,
  /\btradingview\b/i,
  /\bninjatrader\b/i,
  /\bctrader\b/i,
  /\bthinkorswim\b/i,
  /\btradestation\b/i,
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

// Check if keyword contains ANY brand
function containsBrand(keyword) {
  for (const pattern of BRAND_PATTERNS) {
    if (pattern.test(keyword)) {
      return {
        isBranded: true,
        brand: pattern.source.replace(/\\b|\\/g, '').replace(/i$/g, '')
      };
    }
  }
  return { isBranded: false };
}

// Main filter function
function deepBrandFilter(inputFile) {
  printSection('Step 1: Loading Keywords');

  const inputPath = resolve(PROCESSED_DIR, inputFile);
  const content = readFileSync(inputPath, 'utf-8');
  const { headers, rows } = parseCSV(content);

  printInfo(`Loaded ${rows.length} keywords from ${inputFile}`);
  console.log('');

  printSection('Step 2: Aggressive Brand Detection');

  const results = {
    clean: [],
    branded: [],
    brandCounts: {}
  };

  for (const row of rows) {
    const keyword = row.keyword;
    const check = containsBrand(keyword);

    if (check.isBranded) {
      results.branded.push({ keyword, brand: check.brand, row });
      results.brandCounts[check.brand] = (results.brandCounts[check.brand] || 0) + 1;
    } else {
      results.clean.push(row);
    }
  }

  printInfo(`✅ Clean keywords: ${results.clean.length}`);
  printWarning(`❌ Branded keywords: ${results.branded.length}`);
  console.log('');

  printSection('Step 3: Branded Keywords Found');

  // Group by brand and show
  const brands = Object.keys(results.brandCounts).sort((a, b) => results.brandCounts[b] - results.brandCounts[a]);

  brands.forEach(brand => {
    const count = results.brandCounts[brand];
    console.log(`\n❌ ${brand.toUpperCase()} (${count} keywords):`);

    const keywords = results.branded.filter(item => item.brand === brand).slice(0, 5);
    keywords.forEach(({ keyword }) => {
      console.log(`   • "${keyword}"`);
    });

    if (count > 5) {
      console.log(`   ... and ${count - 5} more`);
    }
  });

  console.log('');

  return {
    clean: results.clean,
    branded: results.branded,
    headers
  };
}

// Export filtered CSV
function exportFiltered(keywords, headers, outputFile) {
  const csvLines = [headers.join(',')];

  for (const kw of keywords) {
    const row = headers.map(h => {
      const value = kw[h] || '';
      return value.toString().includes(',') ? `"${value}"` : value;
    });
    csvLines.push(row.join(','));
  }

  const csvContent = csvLines.join('\n');
  const outputPath = resolve(PROCESSED_DIR, outputFile);

  writeFileSync(outputPath, csvContent, 'utf-8');
  printSuccess(`Exported to: ${outputPath}`);

  return outputPath;
}

// Main execution
try {
  const inputFile = args.input || 'tier0-keywords-2026-02-13.csv';

  const { clean, branded, headers } = deepBrandFilter(inputFile);

  printSection('Step 4: Exporting Clean Keywords');

  const timestamp = new Date().toISOString().split('T')[0];

  // Export clean keywords
  exportFiltered(clean, headers, `tier0-clean-${timestamp}.csv`);

  // Export branded keywords for review
  if (branded.length > 0) {
    const brandedRows = branded.map(b => b.row);
    exportFiltered(brandedRows, headers, `tier0-branded-removed-${timestamp}.csv`);
  }

  console.log('');
  printSection('Summary');
  printSuccess(`✅ Clean keywords: ${clean.length}`);
  printWarning(`❌ Branded keywords removed: ${branded.length}`);
  printInfo(`📉 Reduction: ${Math.round((branded.length / (clean.length + branded.length)) * 100)}%`);

  console.log('');
  printSuccess('🎯 Next step: Review clean keywords and import to queue');

} catch (err) {
  printError(`Error: ${err.message}`);
  console.error(err);
  process.exit(1);
}
