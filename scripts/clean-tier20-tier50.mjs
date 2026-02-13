#!/usr/bin/env node

/**
 * Clean Tier 20 and Tier 50
 * Removes branded keywords and wrong-audience keywords
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const PROCESSED_DIR = '/Users/gbolahan/Documents/Active-2026/2026-projects/TY Blog Automation/data/keyword-research/processed';

// Brand patterns (150+ brands)
const BRAND_PATTERNS = [
  /\bftmo\b/i, /\bthe\s*5\s*ers\b/i, /\b5\s*percenters\b/i, /\btopstep\b/i,
  /\bearn2trade\b/i, /\bfidelcrest\b/i, /\bmyfundedfx\b/i, /\bmyforexfunds\b/i,
  /\bfunded\s*next\b/i, /\bblue\s*guardian\b/i, /\blux\s*trading\b/i,
  /\bapex\s*trader\b/i, /\bapex\s*funding\b/i, /\bapex\s*futures\b/i,
  /\balpha\s*trader\b/i, /\balpha\s*futures\b/i, /\bmaven\b/i, /\bupcomers\b/i,
  /\bvebson\b/i, /\btradeify\b/i, /\bfunding\s*traders\b/i, /\bedge\s*funder\b/i,
  /\baqua\s*futures\b/i, /\baqua\s*capital\b/i, /\bmffu\b/i, /\be8\s*markets\b/i,
  /\binfinity\s*trading\b/i, /\bbrightfunded\b/i, /\bprimetime\b/i,
  /\bthe\s*futures\s*desk\b/i, /\bprojectx\b/i, /\balpha\s*trading\b/i,
];

// Wrong audience patterns
const WRONG_AUDIENCE_PATTERNS = [
  /\bstart(?:ing)?\s+a\s+prop\s+(?:trading\s+)?firm\b/i,
  /\bcreate\s+a\s+prop\s+(?:trading\s+)?firm\b/i,
  /\bprop\s*firm\s+white\s*label\b/i,
  /\bwhite\s*label\s+prop\s*firm\b/i,
  /\bprop\s*firm\s+marketing\b/i,
  /\bmarketing\s+(?:solutions|for|companies)\s+.*prop\s*firm/i,
  /\bprop\s*firm\s+owners?\b/i,
  /\bprop\s*firm\s+crm\b/i,
  /\bprop\s*firm\s+seo\b/i,
];

function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function shouldExclude(keyword) {
  // Check branded
  for (const pattern of BRAND_PATTERNS) {
    if (pattern.test(keyword)) {
      return { exclude: true, reason: 'branded' };
    }
  }

  // Check wrong audience
  for (const pattern of WRONG_AUDIENCE_PATTERNS) {
    if (pattern.test(keyword)) {
      return { exclude: true, reason: 'wrong-audience' };
    }
  }

  return { exclude: false };
}

function cleanTier(filename) {
  console.log(`\nProcessing ${filename}...`);

  const filePath = resolve(PROCESSED_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  const { headers, rows } = parseCSV(content);

  const clean = [];
  const removed = { branded: [], wrongAudience: [] };

  for (const row of rows) {
    const keyword = row.keyword;
    const check = shouldExclude(keyword);

    if (check.exclude) {
      if (check.reason === 'branded') {
        removed.branded.push(keyword);
      } else {
        removed.wrongAudience.push(keyword);
      }
    } else {
      clean.push(row);
    }
  }

  console.log(`  ✅ Clean: ${clean.length}`);
  console.log(`  ❌ Branded: ${removed.branded.length}`);
  console.log(`  ❌ Wrong audience: ${removed.wrongAudience.length}`);

  if (removed.branded.length > 0) {
    console.log(`\n  Branded keywords removed:`);
    removed.branded.forEach(kw => console.log(`    • "${kw}"`));
  }

  if (removed.wrongAudience.length > 0) {
    console.log(`\n  Wrong audience removed:`);
    removed.wrongAudience.forEach(kw => console.log(`    • "${kw}"`));
  }

  // Export
  const tierMatch = filename.match(/tier(\d+)/);
  const tierNum = tierMatch ? tierMatch[1] : '0';
  const outputFilename = `tier${tierNum}-clean-2026-02-13.csv`;

  const csvLines = [headers.join(',')];
  for (const row of clean) {
    const values = headers.map(h => {
      const val = row[h] || '';
      return h === 'keyword' ? `"${val}"` : val;
    });
    csvLines.push(values.join(','));
  }

  const outputPath = resolve(PROCESSED_DIR, outputFilename);
  writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
  console.log(`\n  📁 Saved: ${outputFilename}`);

  return { clean: clean.length, removed: removed.branded.length + removed.wrongAudience.length };
}

// Clean Tier 20 and Tier 50
console.log('🧹 Cleaning Tier 20 and Tier 50...\n');

const tier20 = cleanTier('tier20-keywords-2026-02-13.csv');
const tier50 = cleanTier('tier50-keywords-2026-02-13.csv');

console.log('\n\n✅ SUMMARY:');
console.log(`  Tier 20: ${tier20.clean} clean keywords (removed ${tier20.removed})`);
console.log(`  Tier 50: ${tier50.clean} clean keywords (removed ${tier50.removed})`);
console.log('\n🚀 Ready to run final merge!');
