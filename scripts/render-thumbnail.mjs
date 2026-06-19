#!/usr/bin/env node

/**
 * HTML → Screenshot Thumbnail Renderer
 *
 * Renders a branded HTML template to a pixel-perfect 1200x630 PNG via headless
 * Chrome (Puppeteer). Text uses real fonts; the logo is the real PNG embedded
 * as base64. Zero AI drift, $0 cost, ~1s per image, 100% reproducible.
 *
 * Usage:
 *   node scripts/render-thumbnail.mjs --samples            # one per category
 *   node scripts/render-thumbnail.mjs --file content/drafts/slug.md
 *   node scripts/render-thumbnail.mjs --slug x --title "T" --category funded-trading
 *   node scripts/render-thumbnail.mjs --samples --html     # dump HTML, skip screenshot
 */

import { existsSync, readFileSync, createWriteStream, writeFileSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import puppeteer from 'puppeteer';
import { ROOT_DIR, TRACKER_PATH } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, ensureDir } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';
import { buildThumbnailHTML, toHeadline } from '../lib/thumbnail-template.mjs';

const args = parseArgs();
const OUT_DIR = resolve(ROOT_DIR, 'output', 'thumbnails-html');
const LOGO_PATH = resolve(ROOT_DIR, 'assets', 'brand', 'tradersyard-logo.png');

// Output format: JPEG (smaller, default) or PNG. Quality tunable.
const FORMAT = args.png ? 'png' : 'jpeg';
const QUALITY = args.quality ? parseInt(args.quality, 10) : 86;
// Scale: 1 = true 1200x630 (smallest). 1.5 = crisper, still reasonable.
const SCALE = args.scale ? parseFloat(args.scale) : 1.5;

if (!existsSync(LOGO_PATH)) { printError(`Logo not found: ${LOGO_PATH}`); process.exit(1); }
const logoDataUri = `data:image/png;base64,${readFileSync(LOGO_PATH).toString('base64')}`;

const SAMPLES = [
  { slug: 'best-prop-firms-for-beginners', title: 'Best Prop Firms for Beginners', category: 'prop-firm-guides' },
  { slug: 'funded-trader-profit-split-explained', title: 'Funded Trader Profit Split Explained', category: 'funded-trading' },
  { slug: 'how-to-pass-a-prop-firm-challenge', title: 'How to Pass a Prop Firm Challenge', category: 'prop-firm-challenges' },
  { slug: 'funded-trading-account-rules-checklist', title: 'Funded Trading Account Rules Checklist', category: 'prop-firm-rules' },
  { slug: 'what-is-a-drawdown-in-trading', title: 'What Is a Drawdown in Trading?', category: 'trading-education' },
  { slug: 'ftmo-vs-the5ers-honest-comparison', title: 'FTMO vs The5ers: Honest Comparison', category: 'prop-firm-reviews' },
];

// Turn a slug into a readable Title when no title is present.
function titleFromSlug(slug = '') {
  return slug.replace(/-v\d+$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Infer a category for the records that have none, from slug keywords.
function inferCategory(slug = '', title = '') {
  const s = (slug + ' ' + title).toLowerCase();
  if (/review|vs |comparison|myths/.test(s)) return 'prop-firm-reviews';
  if (/challenge|evaluation|pass|fail/.test(s)) return 'prop-firm-challenges';
  if (/payout|withdrawal|profit-split|funded|scaling/.test(s)) return 'funded-trading';
  if (/rule|drawdown|loss-limit|consistency|kyc|checklist/.test(s)) return 'prop-firm-rules';
  if (/skill|education|learn|guide-to|social-trading|why-prop/.test(s)) return 'trading-education';
  return 'prop-firm-guides';
}

// --- Gather jobs ---
const jobs = [];
if (args.all) {
  const tracker = JSON.parse(readFileSync(TRACKER_PATH, 'utf8'));
  const posts = tracker.posts || tracker;
  const arr = Array.isArray(posts) ? posts : Object.values(posts);
  for (const p of arr) {
    const slug = p.slug;
    if (!slug) continue;
    let title = p.title && p.title !== slug ? p.title : titleFromSlug(slug);
    let category = p.category || inferCategory(slug, title);
    jobs.push({ slug, title, category, readTime: p.readTime });
  }
} else if (args.samples) {
  jobs.push(...SAMPLES);
} else if (args.file) {
  const fp = resolve(args.file);
  if (!existsSync(fp)) { printError(`File not found: ${fp}`); process.exit(1); }
  const { frontmatter } = parseFile(fp);
  jobs.push({
    slug: frontmatter.slug || basename(fp, '.md'),
    title: frontmatter.title || basename(fp, '.md').replace(/-/g, ' '),
    category: frontmatter.category || 'default',
    readTime: frontmatter.read_time,
  });
} else if (args.slug) {
  jobs.push({ slug: args.slug, title: args.title || args.slug.replace(/-/g, ' '), category: args.category || 'default' });
} else {
  console.log('Usage: node scripts/render-thumbnail.mjs --samples | --file <md> | --slug <s> --title <t> --category <c>');
  process.exit(0);
}

printHeader('Thumbnail Renderer (HTML → image)');
printInfo(`Engine: headless Chrome | 1200x630 | ${FORMAT.toUpperCase()} q${QUALITY} | scale ${SCALE} | $0 | ${jobs.length} image(s)\n`);
ensureDir(OUT_DIR);

// --- HTML-only dump mode (no Chrome) ---
if (args.html) {
  for (const job of jobs) {
    const html = buildThumbnailHTML({ ...job, logoDataUri });
    const out = resolve(OUT_DIR, `${job.slug}.html`);
    writeFileSync(out, html);
    printSuccess(`HTML → ${out}`);
  }
  process.exit(0);
}

// --- Render via Puppeteer ---
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb'],
});

let success = 0, failed = 0;
try {
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    printSection(`[${i + 1}/${jobs.length}] ${job.slug}`);
    try {
      const html = buildThumbnailHTML({ ...job, logoDataUri });
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: SCALE });
      await page.setContent(html, { waitUntil: 'networkidle0' });
      // Ensure web fonts are fully loaded before snapshot
      await page.evaluate(async () => { await document.fonts.ready; });
      const ext = FORMAT === 'jpeg' ? 'jpg' : 'png';
      const out = resolve(OUT_DIR, `${job.slug}.${ext}`);
      const shot = { path: out, type: FORMAT, clip: { x: 0, y: 0, width: 1200, height: 630 } };
      if (FORMAT === 'jpeg') shot.quality = QUALITY;
      await page.screenshot(shot);
      await page.close();
      const kb = (statSync(out).size / 1024).toFixed(0);
      printSuccess(`${kb}KB → ${basename(out)}`);
      success++;
    } catch (err) {
      printError(`Failed: ${err.message}`);
      failed++;
    }
  }
} finally {
  await browser.close();
}

printSection('Summary');
printInfo(`Rendered: ${success}/${jobs.length}`);
if (failed) printError(`Failed: ${failed}`);
printInfo(`Output: ${OUT_DIR}`);
console.log('');
