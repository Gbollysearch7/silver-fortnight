import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// --- CLI argument parsing ---

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

// --- String utilities ---

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

// --- Date utilities ---

export function formatDate(date = new Date()) {
  return new Date(date).toISOString();
}

export function formatDateShort(date = new Date()) {
  return new Date(date).toISOString().split('T')[0];
}

// --- File utilities ---

export function readJsonFile(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function writeJsonFile(path, data) {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// --- Console output ---

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

export function printHeader(title) {
  const line = '='.repeat(70);
  console.log(`\n${BLUE}${BOLD}${line}${RESET}`);
  console.log(`${BLUE}${BOLD}  ${title}${RESET}`);
  console.log(`${BLUE}${BOLD}${line}${RESET}\n`);
}

export function printSection(title) {
  console.log(`\n${CYAN}${BOLD}--- ${title} ---${RESET}\n`);
}

export function printSuccess(msg) {
  console.log(`${GREEN}  [OK] ${msg}${RESET}`);
}

export function printError(msg) {
  console.log(`${RED}  [ERROR] ${msg}${RESET}`);
}

export function printWarning(msg) {
  console.log(`${YELLOW}  [WARN] ${msg}${RESET}`);
}

export function printInfo(msg) {
  console.log(`${DIM}  [INFO] ${msg}${RESET}`);
}

export function printTable(headers, rows) {
  const widths = headers.map((h, i) => {
    const maxRow = rows.reduce((max, row) => Math.max(max, String(row[i] || '').length), 0);
    return Math.max(h.length, maxRow);
  });

  const headerLine = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  const divider = widths.map(w => '-'.repeat(w)).join('  ');

  console.log(`  ${BOLD}${headerLine}${RESET}`);
  console.log(`  ${DIM}${divider}${RESET}`);
  for (const row of rows) {
    const line = row.map((cell, i) => String(cell || '').padEnd(widths[i])).join('  ');
    console.log(`  ${line}`);
  }
}

// --- Blog tracker ---

export function loadTracker(trackerPath) {
  return readJsonFile(trackerPath) || { posts: {}, updatedAt: null };
}

export function saveTracker(trackerPath, tracker) {
  tracker.updatedAt = formatDate();
  writeJsonFile(trackerPath, tracker);
}

export function updateTrackerPost(trackerPath, slug, updates) {
  const tracker = loadTracker(trackerPath);
  tracker.posts[slug] = { ...(tracker.posts[slug] || {}), ...updates, updatedAt: formatDate() };
  saveTracker(trackerPath, tracker);
  return tracker.posts[slug];
}
