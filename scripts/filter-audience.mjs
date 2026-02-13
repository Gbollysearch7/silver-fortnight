#!/usr/bin/env node

/**
 * Audience-Focused Keyword Filter
 *
 * Removes keywords that target the WRONG audience:
 * ❌ People wanting to START a prop firm (entrepreneurs)
 * ❌ Prop firm owners/operators
 * ❌ Regulatory/legal keywords
 * ❌ Investor-focused keywords
 *
 * Keeps keywords that target the RIGHT audience:
 * ✅ Traders wanting to GET FUNDED
 * ✅ Traders in prop firm challenges
 * ✅ Funded traders managing accounts
 * ✅ Traders evaluating prop firms
 *
 * Usage:
 *   node scripts/filter-audience.mjs
 *   node scripts/filter-audience.mjs --input processed/all-keywords-2026-02-13.csv
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs();
const RESEARCH_DIR = resolve(DATA_DIR, 'keyword-research');
const PROCESSED_DIR = resolve(RESEARCH_DIR, 'processed');

printHeader('Audience-Focused Keyword Filter');
console.log('');

// Wrong audience patterns (EXCLUDE these)
const WRONG_AUDIENCE_PATTERNS = [
  // Starting/creating a prop firm (entrepreneurs, not traders)
  /\bstart(?:ing)?\s+a\s+prop\s+firm\b/i,
  /\bcreate\s+a\s+prop\s+firm\b/i,
  /\bopen(?:ing)?\s+a\s+prop\s+firm\b/i,
  /\bestablish\s+a\s+prop\s+firm\b/i,
  /\blaunch(?:ing)?\s+a\s+prop\s+firm\b/i,
  /\bbuild\s+a\s+prop\s+firm\b/i,
  /\bset\s+up\s+a\s+prop\s+firm\b/i,
  /\bfound(?:ing)?\s+a\s+prop\s+firm\b/i,

  // Business/operator keywords
  /\bprop\s+firm\s+business\s+model\b/i,
  /\bprop\s+firm\s+business\s+plan\b/i,
  /\bhow\s+prop\s+firms\s+make\s+money\b/i,
  /\bprop\s+firm\s+revenue\b/i,
  /\bprop\s+firm\s+profit\s+margin\b/i,
  /\bprop\s+firm\s+software\b/i,
  /\bprop\s+firm\s+platform\b/i,
  /\bwhite\s+label\s+prop\s+firm\b/i,

  // Regulatory/legal (not for traders)
  /\bprop\s+firm\s+licen[cs]e\b/i,
  /\bprop\s+firm\s+regulation\b/i,
  /\bprop\s+firm\s+compliance\b/i,
  /\bprop\s+firm\s+legal\b/i,
  /\bprop\s+firm\s+registration\b/i,

  // Investment keywords (not trader-focused)
  /\binvest(?:ing)?\s+in\s+prop\s+firm/i,
  /\bprop\s+firm\s+stock\b/i,
  /\bprop\s+firm\s+ipo\b/i,

  // HR/recruitment for prop firms (not trader job seekers)
  /\bprop\s+firm\s+hiring\b/i,
  /\bwork(?:ing)?\s+at\s+a\s+prop\s+firm\b/i,
  /\bprop\s+firm\s+career\b/i,
  /\bprop\s+firm\s+interview\b/i,

  // Affiliate/partner keywords (business focus, not trader)
  /\bprop\s+firm\s+affiliate\s+program\b/i,
  /\bprop\s+firm\s+partnership\b/i,
  /\bprop\s+firm\s+white\s+label\b/i,

  // Cost to start (entrepreneur mindset)
  /\bcost\s+to\s+start\s+a\s+prop\s+firm\b/i,
  /\bcost\s+to\s+open\s+a\s+prop\s+firm\b/i,
];

// Right audience indicators (KEEP these)
const RIGHT_AUDIENCE_INDICATORS = [
  // Getting funded (trader perspective)
  /\bget(?:ting)?\s+funded\b/i,
  /\bhow\s+to\s+pass\b/i,
  /\bprop\s+firm\s+challenge\b/i,
  /\bfunded\s+trader\b/i,
  /\bfunded\s+account\b/i,

  // Evaluation/comparison (trader choosing a firm)
  /\bbest\s+prop\s+firm/i,
  /\bprop\s+firm\s+comparison\b/i,
  /\bprop\s+firm\s+review/i,
  /\bis\s+\w+\s+prop\s+firm\s+legit\b/i,
  /\bprop\s+firm\s+vs\b/i,

  // Trading strategy (trader focus)
  /\btrading\s+strateg/i,
  /\bhow\s+to\s+trade\b/i,
  /\btrading\s+rules\b/i,
  /\bdrawdown\b/i,
  /\bprofit\s+target\b/i,
  /\brisk\s+management\b/i,

  // Payout/profit (trader earnings)
  /\bpayout\b/i,
  /\bprofit\s+split\b/i,
  /\bwithdraw/i,
  /\bearnings\b/i,

  // Challenge/evaluation (trader process)
  /\bchallenge\s+rules\b/i,
  /\bevaluation\s+process\b/i,
  /\bconsistency\s+rule\b/i,
  /\bminimum\s+days\b/i,
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

// Check if keyword targets wrong audience
function isWrongAudience(keyword) {
  return WRONG_AUDIENCE_PATTERNS.some(pattern => pattern.test(keyword));
}

// Check if keyword has right audience indicators
function hasRightAudienceIndicators(keyword) {
  return RIGHT_AUDIENCE_INDICATORS.some(pattern => pattern.test(keyword));
}

// Classify keyword
function classifyKeyword(keyword) {
  const wrongAudience = isWrongAudience(keyword);
  const rightIndicators = hasRightAudienceIndicators(keyword);

  if (wrongAudience) {
    return {
      keep: false,
      reason: 'Wrong audience (entrepreneur/business owner focus)'
    };
  }

  if (rightIndicators) {
    return {
      keep: true,
      reason: 'Right audience (trader focus)'
    };
  }

  // If no clear indicators, be conservative and keep it
  // (manual review can filter later)
  return {
    keep: true,
    reason: 'Neutral (no clear wrong-audience signals)'
  };
}

// Main filter function
function filterByAudience(inputFile) {
  printSection('Step 1: Loading Keywords');

  const inputPath = resolve(PROCESSED_DIR, inputFile);
  const content = readFileSync(inputPath, 'utf-8');
  const { headers, rows } = parseCSV(content);

  printInfo(`Loaded ${rows.length} keywords from ${inputFile}`);
  console.log('');

  printSection('Step 2: Analyzing Audience Fit');

  const results = {
    keep: [],
    remove: [],
    reasons: {}
  };

  for (const row of rows) {
    const keyword = row.keyword;
    const classification = classifyKeyword(keyword);

    if (classification.keep) {
      results.keep.push(row);
    } else {
      results.remove.push(row);
      results.reasons[keyword] = classification.reason;
    }
  }

  printInfo(`Keywords to keep: ${results.keep.length}`);
  printWarning(`Keywords to remove: ${results.remove.length}`);
  console.log('');

  printSection('Step 3: Wrong Audience Keywords Removed');

  if (results.remove.length > 0) {
    console.log('❌ Removed (wrong audience):');
    results.remove.forEach(row => {
      console.log(`   • "${row.keyword}" - Volume: ${row.volume}`);
      console.log(`     Reason: ${results.reasons[row.keyword]}`);
    });
    console.log('');
  } else {
    printSuccess('No wrong-audience keywords found!');
    console.log('');
  }

  return {
    filtered: results.keep,
    removed: results.remove,
    headers
  };
}

// Export filtered CSV
function exportFiltered(keywords, headers, outputFile) {
  const csvLines = [headers.join(',')];

  for (const kw of keywords) {
    const row = headers.map(h => {
      const value = kw[h] || '';
      // Quote if contains comma
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
  const inputFile = args.input || 'all-keywords-2026-02-13.csv';

  const { filtered, removed, headers } = filterByAudience(inputFile);

  printSection('Step 4: Exporting Filtered Keywords');

  const timestamp = new Date().toISOString().split('T')[0];

  // Export filtered (trader-focused) keywords
  exportFiltered(filtered, headers, `trader-focused-keywords-${timestamp}.csv`);

  // Export removed keywords for review
  if (removed.length > 0) {
    exportFiltered(removed, headers, `removed-wrong-audience-${timestamp}.csv`);
  }

  console.log('');
  printSection('Summary');
  printSuccess(`✅ Trader-focused keywords: ${filtered.length}`);
  printWarning(`❌ Wrong-audience keywords removed: ${removed.length}`);

  // Breakdown by tier
  const tierCounts = {
    keep: { 0: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0 },
    remove: { 0: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0 }
  };

  filtered.forEach(kw => tierCounts.keep[kw.tier]++);
  removed.forEach(kw => tierCounts.remove[kw.tier]++);

  console.log('');
  printInfo('Breakdown by Tier (Kept):');
  Object.keys(tierCounts.keep).forEach(tier => {
    const count = tierCounts.keep[tier];
    if (count > 0) {
      console.log(`  Tier ${tier}: ${count} keywords`);
    }
  });

  if (removed.length > 0) {
    console.log('');
    printInfo('Breakdown by Tier (Removed):');
    Object.keys(tierCounts.remove).forEach(tier => {
      const count = tierCounts.remove[tier];
      if (count > 0) {
        console.log(`  Tier ${tier}: ${count} keywords`);
      }
    });
  }

  console.log('');
  printSuccess('🎯 Next step: Review trader-focused keywords and import to queue');

} catch (err) {
  printError(`Error: ${err.message}`);
  console.error(err);
  process.exit(1);
}
