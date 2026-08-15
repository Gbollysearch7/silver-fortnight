#!/usr/bin/env node

/**
 * Thumbnail STYLE LAB
 *
 * Goal: generate MANY design-style variations of ONE blog post so we can pick
 * the winning visual direction + the best model, before committing.
 *
 * - 10 distinct design styles (the same post, restyled 10 ways).
 * - Run across 1..N models: nano (Nano Banana), ideogram (v3), gpt (gpt-image-1).
 * - The TradersYard logo is uploaded ONCE and passed as a reference image to the
 *   models that support references (nano edit, gpt edit). AND we ALSO spell the
 *   wordmark "tradersyard" out in every prompt, so the AI renders it correctly
 *   even when the reference is soft.
 *
 * Usage:
 *   node scripts/thumbnail-style-lab.mjs                       # 10 styles, nano only
 *   node scripts/thumbnail-style-lab.mjs --models nano,ideogram,gpt
 *   node scripts/thumbnail-style-lab.mjs --post 2              # use sample post #2
 *   node scripts/thumbnail-style-lab.mjs --dry-run
 */

import { existsSync, createWriteStream, readFileSync } from 'fs';
import { resolve, basename } from 'path';
import { get as httpsGet } from 'https';
import { ROOT_DIR, FAL_KEY } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, ensureDir } from '../lib/utils.mjs';

const args = parseArgs();
const OUT_DIR = resolve(ROOT_DIR, 'output', 'style-lab');
// Navy-flattened logo = clearer for edit models to copy than the transparent strip.
const LOGO_PATH = resolve(ROOT_DIR, 'assets', 'brand', 'tradersyard-logo-navy.png');

if (!FAL_KEY) { printError('FAL_KEY not set'); process.exit(1); }

// --- The single post we restyle 10 ways ---
const POSTS = [
  { slug: 'best-prop-firms-for-beginners', headline: 'Best Prop Firms for Beginners', tag: 'PROP FIRM GUIDE' },
  { slug: 'funded-trader-profit-split', headline: 'Funded Trader Profit Split Explained', tag: 'FUNDED TRADING' },
  { slug: 'how-to-pass-a-prop-firm-challenge', headline: 'How to Pass a Prop Firm Challenge', tag: 'CHALLENGE' },
];
const post = POSTS[(parseInt(args.post, 10) || 1) - 1] || POSTS[0];

// --- Brand constants spelled out for the AI every time ---
const BRAND_LINE =
  `The reference image IS the official "tradersyard" logo (blue wordmark on navy). COPY this logo ` +
  `pixel-for-pixel into the top-left corner, scaled down, with padding. Preserve every letter exactly. ` +
  `The wordmark has exactly 11 letters in this order: t-r-a-d-e-r-s-y-a-r-d. Do NOT drop or add any ` +
  `letter. Do NOT redraw, restyle, re-letter, stretch, or recolour it. Build the rest of the design ` +
  `AROUND the untouched logo. It must read exactly "tradersyard" — never "tadersyard", "tradersyad", ` +
  `"TradersYard", "Traders Yard", or any other variant. Double-check the spelling t-r-a-d-e-r-s-y-a-r-d.`;

const COMMON_RULES =
  `16:9 blog thumbnail. The HEADLINE "${post.headline}" must be the large focal text, left-aligned, ` +
  `bold, correctly spelled. Include a small pill-shaped category tag reading "${post.tag}" in electric blue. ` +
  `No stock-photo people. No stray numbers, hex codes, or gibberish text. All text crisp and correctly spelled.`;

// --- 10 distinct design styles ---
const STYLES = [
  { id: '01-flat-navy',        desc: 'Flat minimalist design. Solid deep-navy (#0F172A) background, thin electric-blue line-art candlestick chart confined to the right third. Lots of negative space. Swiss/SaaS aesthetic.' },
  { id: '02-gradient-mesh',    desc: 'Modern gradient-mesh background blending navy to deep electric blue, soft glowing orbs, frosted-glass headline panel. Premium fintech app vibe.' },
  { id: '03-3d-isometric',     desc: '3D isometric illustration on the right: floating coins, an upward bar chart and a trophy, soft studio lighting, navy backdrop. Clean 3D render style.' },
  { id: '04-bold-typographic', desc: 'Bold typography-led poster. Oversized headline fills 70% of the frame, tight grotesk type, single electric-blue underline accent, flat dark background. Editorial magazine feel.' },
  { id: '05-grid-blueprint',   desc: 'Technical blueprint look: faint electric-blue dot-grid and thin schematic lines over near-black, like a trading-terminal wireframe. Headline in a clean white box.' },
  { id: '06-duotone-photo',    desc: 'Duotone photographic treatment: an abstract trading-floor / candlestick photo graded entirely in navy + electric-blue duotone, headline overlaid in a solid blue band.' },
  { id: '07-glass-card',       desc: 'Glassmorphism: a translucent frosted card holding the headline, floating over a blurred blue-gradient background with subtle chart bokeh. Soft shadows, rounded corners.' },
  { id: '08-neon-outline',     desc: 'Dark background with neon electric-blue outline graphics — glowing candlesticks and an arrow — subtle outer glow, cyberpunk-lite but still corporate. Headline in clean white.' },
  { id: '09-geometric-memphis',desc: 'Geometric flat shapes (circles, triangles, bars) in navy + electric-blue + a single accent, arranged playfully on the right. Modern flat illustration, confident and friendly.' },
  { id: '10-dark-premium',     desc: 'Ultra-premium dark fintech: matte black-navy, a single thin glowing blue ascending line, lots of space, subtle vignette. Apple-keynote-slide minimalism.' },
];

// --- Models ---
const MODEL_DEFS = {
  nano: {
    label: 'Nano Banana',
    endpoint: 'https://fal.run/fal-ai/nano-banana/edit',
    usesRef: true,
    body: (prompt, refUrl) => ({ prompt, image_urls: [refUrl], aspect_ratio: '16:9', num_images: 1, output_format: 'png' }),
  },
  ideogram: {
    label: 'Ideogram v3',
    endpoint: 'https://fal.run/fal-ai/ideogram/v3',
    usesRef: true, // base v3 accepts image_urls as STYLE references (logo)
    body: (prompt, refUrl) => ({
      prompt,
      image_urls: refUrl ? [refUrl] : undefined,
      image_size: { width: 1280, height: 720 }, // 16:9
      // `style` is not allowed alongside style references; only set it when no ref.
      ...(refUrl ? {} : { style: 'DESIGN' }),
      rendering_speed: 'QUALITY',
      num_images: 1,
    }),
  },
  gpt: {
    label: 'GPT Image 1',
    endpoint: 'https://fal.run/fal-ai/gpt-image-1/edit-image',
    usesRef: true,
    body: (prompt, refUrl) => ({ prompt, image_urls: [refUrl], image_size: '1536x1024', num_images: 1, quality: 'high' }),
  },
  // Ideogram REMIX: treats the logo image as the base canvas and remixes a new
  // design from it. High strength = mostly new design, keeps brand feel.
  'ideogram-remix': {
    label: 'Ideogram v3 Remix',
    endpoint: 'https://fal.run/fal-ai/ideogram/v3/remix',
    usesRef: true,
    body: (prompt, refUrl) => ({
      prompt,
      image_url: refUrl,
      image_size: { width: 1280, height: 720 },
      rendering_speed: 'QUALITY',
      strength: 0.92, // mostly new image, light nod to the reference
      num_images: 1,
    }),
  },
};

const models = (args.models || 'nano').split(',').map(s => s.trim()).filter(Boolean);
for (const m of models) if (!MODEL_DEFS[m]) { printError(`Unknown model: ${m}. Use nano,ideogram,gpt`); process.exit(1); }

// Optional: --styles 02,03,04,07  (filter the style set by their leading number)
let STYLE_SET = STYLES;
if (args.styles) {
  const want = String(args.styles).split(',').map(s => s.trim().padStart(2, '0'));
  STYLE_SET = STYLES.filter(s => want.includes(s.id.slice(0, 2)));
  if (!STYLE_SET.length) { printError(`No styles matched: ${args.styles}`); process.exit(1); }
}

function buildPrompt(style) {
  return `Create a professional, on-brand blog thumbnail in this specific visual style:
STYLE: ${style.desc}

${BRAND_LINE}

${COMMON_RULES}`;
}

// --- fal helpers ---
async function uploadToFal(localPath) {
  const bytes = readFileSync(localPath);
  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: basename(localPath), content_type: 'image/png' }),
  });
  if (!initRes.ok) throw new Error(`upload initiate ${initRes.status}: ${(await initRes.text()).slice(0, 150)}`);
  const { upload_url, file_url } = await initRes.json();
  const putRes = await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: bytes });
  if (!putRes.ok) throw new Error(`upload PUT ${putRes.status}`);
  return file_url;
}

async function generate(model, prompt, refUrl) {
  const def = MODEL_DEFS[model];
  const res = await fetch(def.endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(def.body(prompt, refUrl)),
  });
  if (!res.ok) throw new Error(`${def.label} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (data.images?.[0]?.url) return data.images[0].url;
  throw new Error(`${def.label}: no image returned`);
}

function downloadImage(url, filepath) {
  return new Promise((res, rej) => {
    const go = (u) => httpsGet(u, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) return go(r.headers.location);
      const f = createWriteStream(filepath);
      r.pipe(f); f.on('finish', () => { f.close(); res(); }); f.on('error', rej);
    }).on('error', rej);
    go(url);
  });
}

// --- Run ---
printHeader('Thumbnail Style Lab');
printInfo(`Post: "${post.headline}" [${post.tag}]`);
printInfo(`Styles: ${STYLE_SET.length} | Models: ${models.map(m => MODEL_DEFS[m].label).join(', ')}`);
const totalImgs = STYLE_SET.length * models.length;
printInfo(`Total images: ${totalImgs} (~$${(totalImgs * 0.04).toFixed(2)})\n`);

ensureDir(OUT_DIR);

let refUrl = null;
if (!args['dry-run'] && existsSync(LOGO_PATH)) {
  printInfo('Uploading logo reference...');
  try { refUrl = await uploadToFal(LOGO_PATH); printSuccess(`Logo → ${refUrl}\n`); }
  catch (e) { printError(`Logo upload failed: ${e.message}\n`); }
}

let success = 0, failed = 0;
for (const model of models) {
  printSection(`MODEL: ${MODEL_DEFS[model].label}`);
  for (const style of STYLE_SET) {
    const prompt = buildPrompt(style);
    const name = `${post.slug}__${model}__${style.id}.png`;

    if (args['dry-run']) {
      printInfo(`${name}`);
      continue;
    }
    process.stdout.write(`  ${style.id} ... `);
    try {
      const start = Date.now();
      const url = await generate(model, prompt, refUrl);
      await downloadImage(url, resolve(OUT_DIR, name));
      console.log(`ok (${((Date.now() - start) / 1000).toFixed(1)}s)`);
      success++;
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
      failed++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
}

if (args['dry-run']) {
  console.log('\nExample prompt (style 02):\n');
  console.log(buildPrompt(STYLE_SET[0]));
}

printSection('Summary');
printInfo(`Generated: ${success}/${totalImgs}`);
if (failed) printError(`Failed: ${failed}`);
printInfo(`Output: ${OUT_DIR}`);
console.log('');
