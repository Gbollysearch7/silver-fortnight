#!/usr/bin/env node
/**
 * Safe rewrite publisher for scaffold fixes.
 * Updates ONLY post-body, name, post-summary on an existing live item.
 * Preserves feature-image and feature-post (does NOT touch the homepage featured slot).
 * Publishes live and verifies.
 *
 *   node scripts/publish-rewrite.mjs --file content/rewrites/slug.md [--live] [--dry-run]
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseFile, toHtml, extractHeadings } from '../lib/markdown.mjs';
import { styleForWebflow } from '../lib/html-styler.mjs';
import { updateItem, publishItems, getItem } from '../lib/webflow.mjs';
import { parseArgs } from '../lib/utils.mjs';

const args = parseArgs();
if (!args.file) { console.error('Usage: --file <path> [--live] [--dry-run]'); process.exit(1); }

const filePath = resolve(args.file);
const { frontmatter: fm, content: md } = parseFile(filePath);
if (!fm.webflow_item_id) { console.error('FATAL: no webflow_item_id in frontmatter'); process.exit(1); }

// Scaffold guard: never publish placeholder content
if (/\[First Item\]|\[Second Step\]|\[Advanced Topic|\[One-Line Value|Step 1: \[|Lorem ipsum/i.test(md)) {
  console.error('FATAL: placeholder/scaffold markers in content. Aborting.'); process.exit(1);
}
const wc = md.split(/\s+/).filter(Boolean).length;
if (wc < 600) { console.error(`FATAL: only ${wc} words. Aborting.`); process.exit(1); }

// CORRECT pipeline: markdown -> HTML -> styled (TOC, headings, tables, CTA, FAQ).
// styleForWebflow expects HTML, NOT raw markdown — converting first is mandatory.
const rawHtml = toHtml(md);
const headings = extractHeadings(md);
const styledHtml = styleForWebflow(rawHtml, fm, headings);

// Formatting guard: a real article has H2s and many paragraphs. If the styled
// body has no <h2>, the markdown wasn't converted — abort rather than publish flat text.
const h2Count = (styledHtml.match(/<h2/g) || []).length;
const pCount = (styledHtml.match(/<p[ >]/g) || []).length;
if (h2Count < 2 || pCount < 5) {
  console.error(`FATAL: styled body looks unformatted (h2=${h2Count}, p=${pCount}). Conversion failed. Aborting.`);
  process.exit(1);
}

// Minimal payload — body/title/summary ONLY. Preserve image + feature flag.
const payload = {
  name: fm.meta_title || fm.title,
  'post-body': styledHtml,
  'post-summary': fm.meta_description || fm.description || '',
};

console.log(`\n[${fm.slug}]`);
console.log(`  words: ${wc} | html: ${styledHtml.length} chars | title: ${payload.name}`);

if (args['dry-run']) { console.log('  DRY RUN — no API call'); process.exit(0); }

const before = await getItem(fm.webflow_item_id);
const hadImg = !!before.fieldData['feature-image']?.url;
const wasFeatured = before.fieldData['feature-post'] === true;

await updateItem(fm.webflow_item_id, payload);
console.log('  ✓ updated (body/title/summary)');
if (args.live) { await publishItems([fm.webflow_item_id]); console.log('  ✓ published live'); }

// Verify preservation
const after = await getItem(fm.webflow_item_id);
const stillHasImg = !!after.fieldData['feature-image']?.url;
const stillFeatured = after.fieldData['feature-post'] === true;
console.log(`  image preserved: ${hadImg === stillHasImg ? 'YES' : 'CHANGED!'} (${stillHasImg}) | feature-post preserved: ${wasFeatured === stillFeatured ? 'YES' : 'CHANGED!'} (${stillFeatured})`);
const newBodyWc = (after.fieldData['post-body']||'').replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length;
console.log(`  live body word count now: ${newBodyWc}`);
