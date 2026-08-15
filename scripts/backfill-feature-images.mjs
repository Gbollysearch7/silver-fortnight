#!/usr/bin/env node

/**
 * Backfill Feature Images (SEO repair)
 * --------------------------------------------------------------
 * Finds live Webflow blog posts whose `feature-image` is null, generates a
 * fresh 16:9 thumbnail (fal.ai Ideogram v3), and sets `feature-image` with a
 * descriptive { url, alt } object — fixing the silent-drop bug where the old
 * code wrote to the non-existent `main-image` field.
 *
 * SAFE BY DEFAULT: --dry-run is implied unless you pass --live.
 *   - dry-run: lists every post that would change + prompts + cost. NO API writes, NO image generation.
 *   - --live --limit 1: generate + set + publish ONE post (for verification).
 *   - --live: process all null-image posts.
 *
 * Usage:
 *   node scripts/backfill-feature-images.mjs                 # dry-run (default)
 *   node scripts/backfill-feature-images.mjs --live --limit 1   # ONE post, live
 *   node scripts/backfill-feature-images.mjs --live             # all null-image posts
 *
 * Options:
 *   --live          Actually generate images, set fields, and publish. Without this, nothing is written.
 *   --limit <n>     Only process the first n matching posts (use --limit 1 to test).
 *   --no-publish    Set the field but do NOT call publishItems (leaves change staged in Webflow).
 */

import OpenAI from 'openai';
import { FAL_KEY, config } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printInfo, printSuccess, printError, printWarning } from '../lib/utils.mjs';
import { listItems, updateItem, publishItems } from '../lib/webflow.mjs';

const args = parseArgs();
const LIVE = !!args.live;                 // safety: default is dry-run
const DO_PUBLISH = !args['no-publish'];
const LIMIT = parseInt(args.limit, 10) || 0;

printHeader('Backfill Feature Images');
if (!LIVE) {
  printWarning('DRY RUN (default) — no images generated, no Webflow writes. Pass --live to execute.');
} else {
  printWarning(`LIVE MODE — will generate images and ${DO_PUBLISH ? 'PUBLISH' : 'stage (no publish)'} changes.`);
}

// --- Prompt builder (mirrors thumbnail.mjs so backfilled images match the brand) ---

const openaiClient = config.env.OPENAI_API_KEY ? new OpenAI({ apiKey: config.env.OPENAI_API_KEY }) : null;

async function buildPrompt(title) {
  if (!openaiClient) {
    return `A creative, visually striking editorial photograph related to "${title}" in the finance and trading industry. Unique composition, cinematic lighting, professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.`;
  }
  try {
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `You are a creative director for a trading/finance blog. Generate a unique, vivid image prompt for a blog thumbnail.

Article title: "${title}"

Rules:
- Describe ONE specific, creative scene that visually represents this article's topic
- DO NOT default to "person staring at monitor screens" — be more creative and varied
- Use diverse compositions: overhead flat-lays, close-up details, conceptual still life, architectural shots, hands-on action shots, abstract financial concepts made visual
- Vary the setting: coffee shops, outdoor terraces, libraries, modern offices, home desks, co-working spaces, airports, city streets
- Include specific visual details: props, lighting direction, color palette, camera angle, depth of field
- Keep it to 2-3 sentences max
- End with: Professional editorial photography, sharp focus, high resolution, no text or watermarks, no logos.

Write ONLY the image prompt, nothing else.`
      }],
    });
    return completion.choices[0].message.content.trim();
  } catch (err) {
    return `A creative, visually striking editorial photograph related to "${title}" in the finance and trading industry. Unique composition, cinematic lighting, professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.`;
  }
}

// --- fal.ai Ideogram v3 (same settings as thumbnail.mjs: 16:9, 1K, SLOW) ---

async function generateImage(prompt) {
  const res = await fetch('https://fal.run/fal-ai/ideogram/v3', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '16:9',
      style: 'AUTO',
      num_images: 1,
      rendering_speed: 'SLOW',
      resolution: 'RESOLUTION_1024_576',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.images && data.images[0]) return data.images[0].url;
  throw new Error('No image returned from fal.ai');
}

// Derive clean alt text from the post title (strip the " | TradersYard" suffix the title field carries)
function altFromName(name, slug) {
  const clean = (name || slug || '').replace(/\s*\|\s*TradersYard\s*$/i, '').trim();
  return clean ? `${clean} - TradersYard` : `${slug} - TradersYard`;
}

// --- Gather all live items, paginated ---

async function getAllItems() {
  let all = [], offset = 0;
  while (true) {
    const { items } = await listItems({ limit: 100, offset });
    if (!items || !items.length) break;
    all = all.concat(items);
    offset += 100;
    if (items.length < 100) break;
  }
  return all;
}

// --- Main ---

printSection('Scanning live posts');
const all = await getAllItems();
let targets = all.filter(it => !it.fieldData?.['feature-image']);
printInfo(`Total live posts: ${all.length}`);
printInfo(`Posts with NULL feature-image: ${targets.length}`);

if (LIMIT > 0) {
  targets = targets.slice(0, LIMIT);
  printInfo(`--limit ${LIMIT} → processing ${targets.length}`);
}

if (targets.length === 0) {
  printSuccess('Nothing to backfill. All posts have a feature-image.');
  process.exit(0);
}

const estCost = (targets.length * 0.04).toFixed(2);
printInfo(`Estimated image cost: ~$${estCost} (${targets.length} × $0.04)`);

// --- DRY RUN: show the plan and exit ---
if (!LIVE) {
  printSection('DRY RUN — posts that would be fixed');
  for (const it of targets) {
    const name = it.fieldData?.name || '';
    const slug = it.fieldData?.slug || '';
    console.log(`\n  • ${slug}`);
    console.log(`    name: ${name}`);
    console.log(`    alt would be: "${altFromName(name, slug)}"`);
  }
  console.log('');
  printInfo(`Would generate ${targets.length} images (~$${estCost}) and set feature-image {url, alt}.`);
  printInfo(`${DO_PUBLISH ? 'Would publish each item after update.' : '--no-publish: would leave changes staged.'}`);
  printWarning('No changes made. Re-run with --live (and --limit 1 first) to execute.');
  process.exit(0);
}

// --- LIVE: generate + set + publish, one at a time ---
if (!FAL_KEY) { printError('FAL_KEY not set — cannot generate images.'); process.exit(1); }

printSection('LIVE backfill');
let done = 0, failed = 0;
for (let i = 0; i < targets.length; i++) {
  const it = targets[i];
  const name = it.fieldData?.name || '';
  const slug = it.fieldData?.slug || '';
  const alt = altFromName(name, slug);
  printInfo(`[${i + 1}/${targets.length}] ${slug}`);
  try {
    const prompt = await buildPrompt(name.replace(/\s*\|\s*TradersYard\s*$/i, '').trim());
    const url = await generateImage(prompt);
    printSuccess(`  image: ${url}`);
    await updateItem(it.id, { 'feature-image': { url, alt } });
    printSuccess(`  feature-image set (alt: "${alt}")`);
    if (DO_PUBLISH) {
      await publishItems([it.id]);
      printSuccess('  published live');
    }
    done++;
    if (i < targets.length - 1) await new Promise(r => setTimeout(r, 1000)); // gentle pacing
  } catch (err) {
    printError(`  FAILED ${slug}: ${err.message}`);
    failed++;
  }
}

printSection('Summary');
printInfo(`Fixed: ${done}/${targets.length}`);
if (failed) printError(`Failed: ${failed}`);
console.log('');
