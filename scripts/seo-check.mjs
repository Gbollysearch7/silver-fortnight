#!/usr/bin/env node

/**
 * SEO Check Script
 * Runs SEO audit on blog post markdown files and reports issues.
 *
 * Usage:
 *   node scripts/seo-check.mjs --file content/drafts/slug.md
 *   node scripts/seo-check.mjs --all-drafts
 *   node scripts/seo-check.mjs --all-published
 *   node scripts/seo-check.mjs --file content/drafts/slug.md --update
 */

import { readdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import {
  DRAFTS_DIR, PUBLISHED_DIR, REVIEW_DIR, APPROVED_DIR, REPORTS_DIR, TRACKER_PATH, blogConfig,
} from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printWarning, printInfo, printTable, ensureDir, updateTrackerPost } from '../lib/utils.mjs';
import { parseFile, updateFrontmatter } from '../lib/markdown.mjs';
import { check, formatReport } from '../lib/seo-checker.mjs';

const args = parseArgs();

if (!args.file && !args['all-drafts'] && !args['all-published'] && !args['all']) {
  console.log('Usage: node scripts/seo-check.mjs --file <path> [options]');
  console.log('\nTargets:');
  console.log('  --file <path>     Check a specific markdown file');
  console.log('  --all-drafts      Check all files in content/drafts/');
  console.log('  --all-published   Check all files in content/published/');
  console.log('  --all             Check all content directories');
  console.log('\nOptions:');
  console.log('  --update          Update frontmatter with seo_score');
  console.log('  --output <path>   Save report to file');
  console.log('  --min-score <n>   Only show posts below this score');
  process.exit(0);
}

printHeader('SEO Checker');

// Gather files to check
const files = [];

if (args.file) {
  const filePath = resolve(args.file);
  if (!existsSync(filePath)) {
    printError(`File not found: ${filePath}`);
    process.exit(1);
  }
  files.push(filePath);
} else {
  const dirs = [];
  if (args['all-drafts'] || args['all']) dirs.push(DRAFTS_DIR);
  if (args['all-published'] || args['all']) dirs.push(PUBLISHED_DIR);
  if (args['all']) {
    dirs.push(REVIEW_DIR);
    dirs.push(APPROVED_DIR);
  }

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const mdFiles = readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const f of mdFiles) files.push(resolve(dir, f));
  }
}

if (files.length === 0) {
  printWarning('No markdown files found to check');
  process.exit(0);
}

printInfo(`Checking ${files.length} file(s)...\n`);

const results = [];
const minScore = args['min-score'] ? parseInt(args['min-score'], 10) : 0;

for (const filePath of files) {
  const slug = basename(filePath, '.md');

  try {
    const { frontmatter, content } = parseFile(filePath);
    const result = check(frontmatter, content);

    if (minScore && result.score >= minScore) continue;

    results.push({ slug, filePath, result });

    // Update frontmatter if requested
    if (args.update) {
      updateFrontmatter(filePath, {
        seo_score: result.score,
        updated_at: new Date().toISOString(),
      });
      updateTrackerPost(TRACKER_PATH, slug, { seoScore: result.score });
    }
  } catch (err) {
    printError(`Failed to check ${slug}: ${err.message}`);
  }
}

// Display results
if (results.length === 0) {
  printSuccess('All files meet the minimum score threshold');
  process.exit(0);
}

// Single file: detailed report
if (results.length === 1) {
  const { slug, result } = results[0];
  const scoreColor = result.score >= 80 ? '\x1b[32m' : result.score >= 60 ? '\x1b[33m' : '\x1b[31m';

  printSection(`${slug}`);
  console.log(`  Score: ${scoreColor}\x1b[1m${result.score}/100\x1b[0m\n`);

  console.log('  Stats:');
  console.log(`    Words: ${result.stats.wordCount}`);
  console.log(`    Headings: ${result.stats.headingCount} (${result.stats.h2Count} H2s)`);
  console.log(`    Internal links: ${result.stats.internalLinkCount}`);
  console.log(`    Images: ${result.stats.imageCount}`);

  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  const infos = result.issues.filter(i => i.severity === 'info');

  if (errors.length > 0) {
    console.log('\n  \x1b[31mErrors (must fix):\x1b[0m');
    for (const i of errors) console.log(`    - ${i.message}`);
  }
  if (warnings.length > 0) {
    console.log('\n  \x1b[33mWarnings (should fix):\x1b[0m');
    for (const i of warnings) console.log(`    - ${i.message}`);
  }
  if (infos.length > 0) {
    console.log('\n  \x1b[2mSuggestions:\x1b[0m');
    for (const i of infos) console.log(`    - ${i.message}`);
  }

  if (result.passed.length > 0) {
    console.log('\n  \x1b[32mPassed:\x1b[0m');
    for (const p of result.passed) console.log(`    - ${p}`);
  }

  const canPublish = result.score >= blogConfig.seo.minSeoScoreToPublish;
  const minScore2 = blogConfig.seo.minSeoScoreToPublish;
  if (canPublish) {
    console.log('\n  Publish ready: \x1b[32mYES\x1b[0m');
  } else {
    console.log('\n  Publish ready: \x1b[31mNO\x1b[0m (min ' + minScore2 + ')');
  }
} else {
  // Multiple files: summary table
  printSection('Results');

  const rows = results
    .sort((a, b) => a.result.score - b.result.score)
    .map(({ slug, result }) => [
      slug,
      `${result.score}/100`,
      result.stats.wordCount,
      result.issues.filter(i => i.severity === 'error').length,
      result.issues.filter(i => i.severity === 'warning').length,
      result.score >= blogConfig.seo.minSeoScoreToPublish ? 'YES' : 'NO',
    ]);

  printTable(
    ['Slug', 'Score', 'Words', 'Errors', 'Warnings', 'Publish?'],
    rows,
  );

  const avg = Math.round(results.reduce((s, r) => s + r.result.score, 0) / results.length);
  console.log(`\n  Average score: ${avg}/100`);
  console.log(`  Publish ready: ${results.filter(r => r.result.score >= blogConfig.seo.minSeoScoreToPublish).length}/${results.length}`);
}

// Save report if requested
if (args.output) {
  ensureDir(REPORTS_DIR);
  const outputPath = resolve(args.output);
  const reportContent = results.map(r => formatReport(r.result, r.slug)).join('\n\n---\n\n');
  writeFileSync(outputPath, reportContent, 'utf-8');
  printSuccess(`Report saved: ${outputPath}`);
}

console.log('');
