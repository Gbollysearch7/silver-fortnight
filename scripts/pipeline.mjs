#!/usr/bin/env node

/**
 * Blog Pipeline Orchestrator
 * Runs the full blog publishing pipeline or individual phases.
 *
 * Usage:
 *   node scripts/pipeline.mjs --file content/drafts/slug.md
 *   node scripts/pipeline.mjs --file content/drafts/slug.md --from publish
 *   node scripts/pipeline.mjs --file content/approved/slug.md --phase distribute
 *   node scripts/pipeline.mjs --process-scheduled
 *   node scripts/pipeline.mjs --dry-run
 */

import { existsSync, readdirSync } from 'fs';
import { resolve, basename, dirname } from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { APPROVED_DIR, PUBLISHED_DIR, TRACKER_PATH, blogConfig } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printWarning, printInfo, formatDate } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';
import { check } from '../lib/seo-checker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = parseArgs();

if (!args.file && !args['process-scheduled']) {
  console.log('Usage: node scripts/pipeline.mjs --file <path> [options]');
  console.log('\nOptions:');
  console.log('  --file <path>          Blog post markdown file');
  console.log('  --from <step>          Start from step: seo, thumbnail, publish, index');
  console.log('  --phase <group>        Run phase: seo, thumbnail, publish, all');
  console.log('  --process-scheduled    Process all scheduled posts that are due');
  console.log('  --dry-run              Preview without making changes');
  console.log('  --stop-on-error        Stop pipeline on first error');
  process.exit(0);
}

const STEPS = [
  { name: 'seo', phase: 'seo', script: 'seo-check.mjs', label: 'SEO Check' },
  { name: 'thumbnail', phase: 'thumbnail', script: 'thumbnail.mjs', label: 'Thumbnail Generation' },
  { name: 'publish', phase: 'publish', script: 'publish.mjs', label: 'Webflow Publish' },
  { name: 'index', phase: 'publish', script: 'index.mjs', label: 'Google Indexing' },
];

printHeader('Blog Pipeline');

// --- Process scheduled posts ---
if (args['process-scheduled']) {
  printSection('Processing Scheduled Posts');

  if (!existsSync(APPROVED_DIR)) {
    printInfo('No approved posts directory');
    process.exit(0);
  }

  const files = readdirSync(APPROVED_DIR).filter(f => f.endsWith('.md'));
  const now = new Date();
  let processed = 0;

  for (const file of files) {
    const filePath = resolve(APPROVED_DIR, file);
    const { frontmatter } = parseFile(filePath);

    if (frontmatter.scheduled_date && new Date(frontmatter.scheduled_date) <= now) {
      printInfo(`Processing scheduled post: ${frontmatter.title}`);
      runPipeline(filePath, STEPS, args['dry-run']);
      processed++;
    }
  }

  if (processed === 0) {
    printInfo('No scheduled posts are due');
  } else {
    printSuccess(`Processed ${processed} scheduled post(s)`);
  }
  process.exit(0);
}

// --- Single file pipeline ---
const filePath = resolve(args.file);
if (!existsSync(filePath)) {
  printError(`File not found: ${filePath}`);
  process.exit(1);
}

const slug = basename(filePath, '.md');
printInfo(`Post: ${slug}`);

// Determine which steps to run
let steps = [...STEPS];

if (args.from) {
  const fromIdx = steps.findIndex(s => s.name === args.from);
  if (fromIdx === -1) {
    printError(`Unknown step: ${args.from}. Available: ${steps.map(s => s.name).join(', ')}`);
    process.exit(1);
  }
  steps = steps.slice(fromIdx);
}

if (args.phase && args.phase !== 'all') {
  steps = steps.filter(s => s.phase === args.phase);
}

printInfo(`Steps: ${steps.map(s => s.name).join(' → ')}`);
if (args['dry-run']) printWarning('DRY RUN mode');
console.log('');

runPipeline(filePath, steps, args['dry-run']);

function runPipeline(file, steps, dryRun) {
  const results = [];

  for (const step of steps) {
    printSection(`Step: ${step.label}`);
    const scriptPath = resolve(__dirname, step.script);

    try {
      // Special handling for SEO check
      if (step.name === 'seo') {
        const { frontmatter, content } = parseFile(file);
        const result = check(frontmatter, content);
        console.log(`  Score: ${result.score}/100`);

        if (result.issues.filter(i => i.severity === 'error').length > 0) {
          for (const issue of result.issues.filter(i => i.severity === 'error')) {
            printError(issue.message);
          }
        }

        if (result.score < blogConfig.seo.minSeoScoreToPublish) {
          printWarning(`Score ${result.score} is below minimum ${blogConfig.seo.minSeoScoreToPublish}. Continuing anyway...`);
        }

        results.push({ step: step.name, status: 'done', score: result.score });
        continue;
      }

      // Build args for the script
      const scriptArgs = ['--file', file];

      if (step.name === 'publish') {
        scriptArgs.push('--live');
        if (dryRun) scriptArgs.push('--dry-run');
      }

      if (step.name === 'index' && !dryRun) {
        // Use the file path directly
      } else if (step.name === 'index' && dryRun) {
        printInfo('Dry run - skipping indexing');
        results.push({ step: step.name, status: 'skipped' });
        continue;
      }

      if (dryRun && ['social', 'email'].includes(step.name)) {
        scriptArgs.push('--preview');
      }

      // Run the script
      const output = execFileSync('node', [scriptPath, ...scriptArgs], {
        encoding: 'utf-8',
        cwd: resolve(__dirname, '..'),
        timeout: 60000,
        env: process.env,
      });

      console.log(output);
      results.push({ step: step.name, status: 'done' });
      printSuccess(`${step.label} complete`);

      // After publish, update file path for subsequent steps
      if (step.name === 'publish' && !dryRun) {
        const publishedPath = resolve(PUBLISHED_DIR, basename(file));
        if (existsSync(publishedPath)) {
          file = publishedPath;
        }
      }
    } catch (err) {
      printError(`${step.label} failed: ${err.message}`);
      results.push({ step: step.name, status: 'failed', error: err.message });

      if (args['stop-on-error']) {
        printError('Pipeline stopped due to error');
        break;
      }
    }
  }

  // Summary
  printSection('Pipeline Summary');
  for (const r of results) {
    const icon = r.status === 'done' ? '\x1b[32m[OK]\x1b[0m' : r.status === 'skipped' ? '\x1b[33m[SKIP]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
    console.log(`  ${icon} ${r.step}${r.score !== undefined ? ` (score: ${r.score})` : ''}`);
  }
  console.log('');
}
