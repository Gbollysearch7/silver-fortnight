#!/usr/bin/env node

/**
 * Editorial Calendar Manager
 * Plan, view, and manage upcoming blog content.
 *
 * Usage:
 *   node scripts/calendar.mjs --view
 *   node scripts/calendar.mjs --add --title "Post Title" --keyword "keyword" --date 2026-02-20
 *   node scripts/calendar.mjs --update <id> --status in_progress
 *   node scripts/calendar.mjs --overdue
 */

import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { CALENDAR_DIR, REPORTS_DIR } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printWarning, printInfo, printTable, ensureDir, readJsonFile, writeJsonFile, formatDateShort } from '../lib/utils.mjs';

const args = parseArgs();

if (!args.view && !args.add && !args.update && !args.overdue && !args.export) {
  console.log('Usage: node scripts/calendar.mjs <action> [options]');
  console.log('\nActions:');
  console.log('  --view                Show calendar (default: current month)');
  console.log('  --add                 Add a new calendar entry');
  console.log('  --update <id>         Update an entry');
  console.log('  --overdue             Show overdue items');
  console.log('  --export <path>       Export calendar to markdown');
  console.log('\nAdd options:');
  console.log('  --title <text>        Post title (required)');
  console.log('  --keyword <text>      Target keyword');
  console.log('  --date <YYYY-MM-DD>   Target publish date (required)');
  console.log('  --category <slug>     Category');
  console.log('  --type <template>     Content type (ultimate-guide, listicle, etc.)');
  console.log('  --priority <level>    low, medium, high, urgent');
  console.log('  --notes <text>        Additional notes');
  console.log('\nView options:');
  console.log('  --month <YYYY-MM>     View specific month');
  console.log('  --status <status>     Filter by status');
  process.exit(0);
}

printHeader('Editorial Calendar');

// --- Load calendar for a month ---
function getCalendarPath(yearMonth) {
  return resolve(CALENDAR_DIR, `${yearMonth}.json`);
}

function loadCalendar(yearMonth) {
  ensureDir(CALENDAR_DIR);
  return readJsonFile(getCalendarPath(yearMonth)) || { month: yearMonth, entries: [] };
}

function saveCalendar(yearMonth, calendar) {
  writeJsonFile(getCalendarPath(yearMonth), calendar);
}

// --- Add entry ---
if (args.add) {
  if (!args.title || !args.date) {
    console.error('Required: --title and --date');
    process.exit(1);
  }

  const yearMonth = args.date.slice(0, 7); // YYYY-MM
  const calendar = loadCalendar(yearMonth);

  const entry = {
    id: randomUUID().slice(0, 8),
    title: args.title,
    keyword: args.keyword || '',
    targetDate: args.date,
    category: args.category || '',
    contentType: args.type || 'how-to',
    priority: args.priority || 'medium',
    status: 'planned',
    notes: args.notes || '',
    createdAt: new Date().toISOString(),
  };

  calendar.entries.push(entry);
  saveCalendar(yearMonth, calendar);

  printSuccess(`Added: "${args.title}" for ${args.date}`);
  printInfo(`ID: ${entry.id}`);
  printInfo(`Month: ${yearMonth}`);
}

// --- Update entry ---
if (args.update) {
  const targetId = args.update;
  // Search all calendar files
  const { readdirSync } = await import('fs');
  const files = existsSync(CALENDAR_DIR) ? readdirSync(CALENDAR_DIR).filter(f => f.endsWith('.json')) : [];

  let found = false;
  for (const file of files) {
    const yearMonth = file.replace('.json', '');
    const calendar = loadCalendar(yearMonth);
    const entry = calendar.entries.find(e => e.id === targetId);

    if (entry) {
      if (args.status) entry.status = args.status;
      if (args.title) entry.title = args.title;
      if (args.keyword) entry.keyword = args.keyword;
      if (args.date) entry.targetDate = args.date;
      if (args.priority) entry.priority = args.priority;
      if (args.notes) entry.notes = args.notes;
      entry.updatedAt = new Date().toISOString();

      saveCalendar(yearMonth, calendar);
      printSuccess(`Updated entry ${targetId}`);
      found = true;
      break;
    }
  }

  if (!found) {
    console.error(`Entry not found: ${targetId}`);
    process.exit(1);
  }
}

// --- View calendar ---
if (args.view || (!args.add && !args.update && !args.overdue && !args.export)) {
  const yearMonth = args.month || new Date().toISOString().slice(0, 7);
  const calendar = loadCalendar(yearMonth);
  const statusFilter = args.status;

  printSection(`Calendar: ${yearMonth}`);

  let entries = calendar.entries;
  if (statusFilter) {
    entries = entries.filter(e => e.status === statusFilter);
  }

  if (entries.length === 0) {
    printInfo('No entries for this month');
  } else {
    entries.sort((a, b) => a.targetDate.localeCompare(b.targetDate));

    const rows = entries.map(e => [
      e.id,
      e.targetDate,
      e.title.slice(0, 40),
      e.keyword?.slice(0, 20) || '',
      e.priority,
      e.status,
    ]);

    printTable(
      ['ID', 'Date', 'Title', 'Keyword', 'Priority', 'Status'],
      rows,
    );
  }
}

// --- Overdue items ---
if (args.overdue) {
  printSection('Overdue Items');
  const { readdirSync } = await import('fs');
  const files = existsSync(CALENDAR_DIR) ? readdirSync(CALENDAR_DIR).filter(f => f.endsWith('.json')) : [];
  const today = formatDateShort();
  const overdue = [];

  for (const file of files) {
    const yearMonth = file.replace('.json', '');
    const calendar = loadCalendar(yearMonth);
    for (const entry of calendar.entries) {
      if (entry.targetDate < today && !['published', 'cancelled'].includes(entry.status)) {
        overdue.push(entry);
      }
    }
  }

  if (overdue.length === 0) {
    printSuccess('No overdue items');
  } else {
    printWarning(`${overdue.length} overdue item(s)`);
    const rows = overdue.map(e => [
      e.id,
      e.targetDate,
      e.title.slice(0, 40),
      e.priority,
      e.status,
    ]);
    printTable(['ID', 'Due Date', 'Title', 'Priority', 'Status'], rows);
  }
}

// --- Export ---
if (args.export) {
  const { readdirSync } = await import('fs');
  const files = existsSync(CALENDAR_DIR) ? readdirSync(CALENDAR_DIR).filter(f => f.endsWith('.json')).sort() : [];

  const lines = ['# Editorial Calendar\n'];

  for (const file of files) {
    const yearMonth = file.replace('.json', '');
    const calendar = loadCalendar(yearMonth);
    lines.push(`## ${yearMonth}\n`);
    lines.push('| Date | Title | Keyword | Type | Priority | Status |');
    lines.push('|------|-------|---------|------|----------|--------|');

    for (const e of calendar.entries.sort((a, b) => a.targetDate.localeCompare(b.targetDate))) {
      lines.push(`| ${e.targetDate} | ${e.title} | ${e.keyword || '-'} | ${e.contentType} | ${e.priority} | ${e.status} |`);
    }
    lines.push('');
  }

  ensureDir(REPORTS_DIR);
  const outputPath = resolve(args.export);
  writeFileSync(outputPath, lines.join('\n'), 'utf-8');
  printSuccess(`Calendar exported: ${outputPath}`);
}

console.log('');
