#!/usr/bin/env node

/**
 * Import Keywords to Queue
 *
 * Imports cleaned keywords from FINAL-CLEAN-KEYWORDS CSV into keyword-queue.json.
 * All keywords are marked as needing AI validation before content generation.
 *
 * Usage:
 *   node scripts/import-keywords.mjs
 *   node scripts/import-keywords.mjs --dry-run
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { DATA_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printInfo, printWarning, printError } from '../lib/utils.mjs';

const args = parseArgs();
const RESEARCH_DIR = resolve(DATA_DIR, 'keyword-research');
const PROCESSED_DIR = resolve(RESEARCH_DIR, 'processed');
const QUEUE_PATH = resolve(DATA_DIR, 'keyword-queue.json');

printHeader('Import Keywords to Queue');
console.log('');

// Find latest FINAL-CLEAN-KEYWORDS file
const timestamp = new Date().toISOString().split('T')[0];
const FINAL_CSV_PATH = resolve(PROCESSED_DIR, `FINAL-CLEAN-KEYWORDS-${timestamp}.csv`);

printSection('Step 1: Loading Final Clean Keywords');

let content;
try {
  content = readFileSync(FINAL_CSV_PATH, 'utf-8');
  printSuccess(`Loaded: ${FINAL_CSV_PATH}`);
} catch (err) {
  printError(`Failed to load ${FINAL_CSV_PATH}`);
  printError(err.message);
  process.exit(1);
}

// Parse CSV
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

const { rows } = parseCSV(content);
printInfo(`Parsed ${rows.length} keywords`);
console.log('');

printSection('Step 2: Template Assignment');

// Assign template based on keyword intent
function assignTemplate(keyword, intent) {
  const kw = keyword.toLowerCase();

  // How-to questions
  if (kw.startsWith('how to') || kw.startsWith('how do') || kw.startsWith('how can')) {
    return 'how-to';
  }

  // Comparison keywords
  if (kw.includes(' vs ') || kw.includes('compare') || kw.includes('comparison')) {
    return 'comparison';
  }

  // Best/top lists
  if (kw.startsWith('best ') || kw.startsWith('top ') || kw.includes('best ')) {
    return 'listicle';
  }

  // What is / definition
  if (kw.startsWith('what is') || kw.startsWith('what are')) {
    return 'ultimate-guide';
  }

  // Commercial intent
  if (intent === 'Commercial' || intent === 'Transactional') {
    return 'listicle';
  }

  // Default: how-to for informational
  return 'how-to';
}

// Assign category
function assignCategory(keyword) {
  const kw = keyword.toLowerCase();

  if (kw.includes('challenge')) return 'prop-firm-challenges';
  if (kw.includes('payout') || kw.includes('funded')) return 'funded-trading';
  if (kw.includes('rule') || kw.includes('regulation')) return 'prop-firm-rules';
  if (kw.includes('best') || kw.includes('review') || kw.includes('compare')) return 'prop-firm-reviews';

  return 'prop-firm-guides';
}

// Convert to queue entries
const queueEntries = rows.map((row, index) => {
  const keyword = row.keyword;
  const volume = parseInt(row.volume) || 0;
  const tier = parseInt(row.tier) || 0;
  const intent = row.intent || 'Informational';

  const template = assignTemplate(keyword, intent);
  const category = assignCategory(keyword);

  // Create title (capitalize first letter of each word)
  const title = keyword
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: String(index + 1).padStart(3, '0'),
    keyword,
    title,
    template,
    category,
    priority: index + 1,
    tier,
    volume,
    intent,
    status: 'queued',
    ai_validated: false, // CRITICAL: Requires AI validation before generation
    notes: `Tier ${tier} keyword (${volume} searches/month). Needs AI validation.`,
    created_at: new Date().toISOString(),
  };
});

printInfo(`Created ${queueEntries.length} queue entries`);
console.log('');

printSection('Step 3: Tier Distribution');

const tierCounts = {};
queueEntries.forEach(entry => {
  tierCounts[entry.tier] = (tierCounts[entry.tier] || 0) + 1;
});

Object.keys(tierCounts).sort((a, b) => a - b).forEach(tier => {
  const volumeRange = tier == 0 ? '0-10' :
                     tier == 10 ? '11-20' :
                     tier == 20 ? '21-50' :
                     tier == 50 ? '51-100' : '100+';
  console.log(`  Tier ${tier} (${volumeRange} searches): ${tierCounts[tier]} keywords`);
});

console.log('');

printSection('Step 4: Template Distribution');

const templateCounts = {};
queueEntries.forEach(entry => {
  templateCounts[entry.template] = (templateCounts[entry.template] || 0) + 1;
});

Object.keys(templateCounts).forEach(template => {
  console.log(`  ${template}: ${templateCounts[template]} keywords`);
});

console.log('');

// Load existing queue
let existingQueue = { queue: [] };
try {
  const existing = readFileSync(QUEUE_PATH, 'utf-8');
  existingQueue = JSON.parse(existing);
  printWarning(`Found existing queue with ${existingQueue.queue.length} entries`);
} catch (err) {
  printInfo('No existing queue found, creating new one');
}

console.log('');

if (args['dry-run']) {
  printSection('DRY RUN - Preview First 10 Entries');
  queueEntries.slice(0, 10).forEach(entry => {
    console.log(`  [${entry.id}] ${entry.keyword}`);
    console.log(`      Template: ${entry.template} | Category: ${entry.category} | Tier: ${entry.tier}`);
    console.log(`      AI Validated: ${entry.ai_validated} (needs validation before generation)`);
    console.log('');
  });

  printWarning('DRY RUN: No files modified');
  console.log('');
  printInfo('Run without --dry-run to import');
  process.exit(0);
}

printSection('Step 5: Saving to Queue');

// Merge with existing queue (keep existing entries, add new ones)
const existingKeywords = new Set(existingQueue.queue.map(e => e.keyword));
const newEntries = queueEntries.filter(e => !existingKeywords.has(e.keyword));

existingQueue.queue.push(...newEntries);

// Sort by priority
existingQueue.queue.sort((a, b) => a.priority - b.priority);

writeFileSync(QUEUE_PATH, JSON.stringify(existingQueue, null, 2), 'utf-8');

printSuccess(`✅ Imported ${newEntries.length} new keywords to queue`);
printInfo(`Total queue size: ${existingQueue.queue.length} keywords`);
console.log('');

printSection('🎯 NEXT STEPS');
console.log('');
console.log('1. Validate keywords with AI:');
console.log('   npm run keywords:validate -- --validate-next 10   # Validate 10 keywords');
console.log('   npm run keywords:validate -- --validate-all       # Validate all keywords');
console.log('');
console.log('2. Start staging mode (after validation):');
console.log('   npm run staging');
console.log('');
console.log('');
printWarning('⚠️  IMPORTANT: All keywords require AI validation before content generation!');
printWarning('   The AI will check if keywords are about competitor brands or wrong audience.');
console.log('');
