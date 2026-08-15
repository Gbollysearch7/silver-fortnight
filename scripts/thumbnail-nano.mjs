#!/usr/bin/env node

/**
 * Blog Thumbnail Generator — Nano Banana (Gemini 2.5 Flash Image) edition
 *
 * Goal: STOP the lookalike problem. Every thumbnail is a TEXT-FORWARD, BRANDED
 * card that carries the blog topic ON the image, in one consistent layout.
 *
 * Consistency is enforced by a single fixed LAYOUT template (logo zone, headline
 * zone, category tag, brand colors). Variation comes ONLY from:
 *   1. the headline text (the post's topic — always rendered on the image)
 *   2. a category-specific background motif
 *   3. a slug-seeded `seed` so neighbours differ but output is reproducible
 *
 * Brand reference image (optional): pass --brand-ref <path-or-url>. When set, it
 * is fed to Nano Banana as a reference so logo placement + colour lock exactly.
 * Until you drop a logo, branding is described in the prompt (blue #4250eb).
 *
 * Model:  fal-ai/nano-banana  (~$0.039/image)
 * Format: 16:9, PNG
 *
 * Usage:
 *   node scripts/thumbnail-nano.mjs --samples            # 5 test thumbnails (one per category)
 *   node scripts/thumbnail-nano.mjs --slug "x" --title "Title" --category prop-firm-guides
 *   node scripts/thumbnail-nano.mjs --file content/drafts/slug.md
 *   node scripts/thumbnail-nano.mjs --samples --dry-run  # show prompts only
 */

import { existsSync, createWriteStream, readFileSync } from 'fs';
import { resolve, basename } from 'path';
import { get as httpsGet } from 'https';
import { ROOT_DIR, FAL_KEY } from '../lib/config.mjs';
import { parseArgs, printHeader, printSection, printSuccess, printError, printInfo, ensureDir } from '../lib/utils.mjs';
import { parseFile } from '../lib/markdown.mjs';

const args = parseArgs();
const OUT_DIR = resolve(ROOT_DIR, 'output', 'thumbnails-nano');

if (!FAL_KEY) { printError('FAL_KEY not set in .env'); process.exit(1); }

// ---------------------------------------------------------------------------
// BRAND + LAYOUT — the part that stays the SAME on every thumbnail
// ---------------------------------------------------------------------------

const BRAND = {
  name: 'TradersYard',
  blue: '#4250eb',     // electric blue accent
  navy1: '#0F172A',    // dark navy base
  navy2: '#16161f',
  text: '#e2e8f0',
};

// The ONE layout description reused for every image. This is what makes the
// set feel like a cohesive branded series instead of random AI pictures.
// Layout WHEN a real logo reference image is supplied (preferred path).
// The provided image is the TradersYard logo — it must be placed, not redrawn.
const LAYOUT_WITH_LOGO = `
Design a professional 16:9 blog thumbnail card in a modern fintech editorial style.
You are given ONE reference image: the official "tradersyard" logo (a lowercase blue wordmark).
CRITICAL LOGO RULE: place that EXACT logo from the reference image in the TOP-LEFT corner, small,
unchanged. Do NOT redraw, restyle, re-letter, recolour, or invent a different wordmark. Use the
real logo pixels exactly as provided. The logo is the only brand mark — no other "TradersYard" text.
FIXED LAYOUT (identical across the series):
- Solid dark navy background (deep navy, near #0F172A) filling the whole card.
- The supplied tradersyard logo in the top-left corner, small, with clear padding.
- A subtle abstract line-art motif confined to the RIGHT third only.
- LEFT-aligned headline in the vertical centre, large, bold, white sans-serif, max 2 lines.
- A small pill-shaped category tag in electric blue above the headline.
- Generous left/bottom padding. Clean, high-contrast, legible when small.
- NO stock-photo people. NO clutter. NO stray numbers, hex codes, or gibberish text anywhere.
- Flat, designed, premium — like a polished SaaS blog OG image.
All visible text must be crisp and correctly spelled. Palette: deep navy base, electric-blue accents, near-white text.
`.trim();

// Layout WITHOUT a logo reference (fallback) — AI draws the wordmark.
const LAYOUT_NO_LOGO = `
Design a professional 16:9 blog thumbnail card in a modern fintech editorial style.
FIXED LAYOUT (must be identical across the series):
- Solid dark navy background (deep navy, near #0F172A) with a subtle abstract motif on the RIGHT third only.
- Top-left corner: the wordmark "tradersyard" (one word, all lowercase) in clean bold sans-serif, electric blue, small.
- LEFT-aligned headline in the vertical center, large, bold, white sans-serif, max 2 lines.
- A small pill-shaped category tag in electric blue above the headline.
- Generous left/bottom padding. Clean, high-contrast, legible at small sizes.
- NO stock-photo people. NO clutter. NO stray numbers, hex codes, or gibberish text anywhere.
- Flat, designed, premium — like a SaaS blog OG image.
All visible text must be crisp and correctly spelled. Palette: deep navy base, electric-blue accents, near-white text.
`.trim();

// Category → background motif (the ONLY thing that varies by topic group)
const CATEGORY_MOTIF = {
  'prop-firm-guides':     'a clean upward line/candlestick chart motif rendered as thin glowing electric-blue strokes',
  'prop-firm-reviews':    'a row of subtle rating stars and a comparison grid motif in faint electric-blue line art',
  'prop-firm-challenges': 'a stylised target / milestone-steps motif (ascending blocks) in electric-blue line art',
  'funded-trading':       'a stylised wallet / payout coins-stack motif in faint electric-blue line art',
  'prop-firm-rules':      'a checklist / shield / rulebook motif in thin electric-blue line art',
  'trading-education':    'a graduation-cap / open-book and lightbulb motif in thin electric-blue line art',
  default:                'an abstract data-grid and candlestick motif in faint electric-blue line art',
};

// Human-readable category label for the on-image pill tag
const CATEGORY_LABEL = {
  'prop-firm-guides': 'PROP FIRM GUIDE',
  'prop-firm-reviews': 'REVIEW',
  'prop-firm-challenges': 'CHALLENGE',
  'funded-trading': 'FUNDED TRADING',
  'prop-firm-rules': 'RULES',
  'trading-education': 'EDUCATION',
  default: 'TRADERSYARD BLOG',
};

// ---------------------------------------------------------------------------
// Headline + seed derivation
// ---------------------------------------------------------------------------

// Trim a long title into a punchy 2-line headline that fits the card.
function toHeadline(title) {
  let h = title.replace(/\s*[-–|:]\s*TradersYard.*$/i, '').trim();
  // Drop trailing year-in-parens marketing tails like "(Honest Guide 2026)"
  h = h.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return h;
}

// Deterministic seed from slug so the same post always regenerates identically
// and adjacent posts get different backgrounds.
function seedFromSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % 2147483647;
}

function buildPrompt({ title, category }, hasLogo) {
  const headline = toHeadline(title);
  const motif = CATEGORY_MOTIF[category] || CATEGORY_MOTIF.default;
  const tag = CATEGORY_LABEL[category] || CATEGORY_LABEL.default;
  const layout = hasLogo ? LAYOUT_WITH_LOGO : LAYOUT_NO_LOGO;
  return `${layout}

CATEGORY TAG (render exactly): "${tag}"
HEADLINE (render exactly, large, the focal point): "${headline}"
RIGHT-THIRD BACKGROUND MOTIF: ${motif}.`;
}

// ---------------------------------------------------------------------------
// fal.ai Nano Banana
// ---------------------------------------------------------------------------

// Upload a local file to fal storage, returns a public URL usable as image_urls.
async function uploadToFal(localPath) {
  const bytes = readFileSync(localPath);
  const fileName = basename(localPath);
  // 1) Initiate upload — fal returns a signed PUT URL + the final file URL.
  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName, content_type: 'image/png' }),
  });
  if (!initRes.ok) {
    throw new Error(`fal upload initiate ${initRes.status}: ${(await initRes.text()).slice(0, 200)}`);
  }
  const { upload_url, file_url } = await initRes.json();
  // 2) PUT the bytes to the signed URL.
  const putRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: bytes,
  });
  if (!putRes.ok) {
    throw new Error(`fal upload PUT ${putRes.status}: ${(await putRes.text()).slice(0, 200)}`);
  }
  return file_url;
}

async function generateImage(prompt, seed, brandRefUrl) {
  const body = {
    prompt,
    aspect_ratio: '16:9',
    num_images: 1,
    output_format: 'png',
    seed,
  };
  // With a logo reference we use the /edit endpoint (accepts image_urls).
  // Without one we use the plain text-to-image endpoint.
  const endpoint = brandRefUrl
    ? 'https://fal.run/fal-ai/nano-banana/edit'
    : 'https://fal.run/fal-ai/nano-banana';
  if (brandRefUrl) body.image_urls = [brandRefUrl];

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  if (data.images?.[0]?.url) return data.images[0].url;
  throw new Error('No image returned from fal.ai');
}

function downloadImage(url, filepath) {
  return new Promise((res, rej) => {
    const go = (u) => httpsGet(u, (r) => {
      if (r.statusCode === 301 || r.statusCode === 302) return go(r.headers.location);
      const f = createWriteStream(filepath);
      r.pipe(f);
      f.on('finish', () => { f.close(); res(); });
      f.on('error', rej);
    }).on('error', rej);
    go(url);
  });
}

// ---------------------------------------------------------------------------
// Build the job list
// ---------------------------------------------------------------------------

const SAMPLE_SET = [
  { slug: 'best-prop-firms-for-beginners', title: 'Best Prop Firms for Beginners (Honest Guide 2026)', category: 'prop-firm-guides' },
  { slug: 'funded-trader-profit-split-explained', title: 'Funded Trader Profit Split — Explained', category: 'funded-trading' },
  { slug: 'how-to-pass-a-prop-firm-challenge', title: 'How to Pass a Prop Firm Challenge in 2026', category: 'prop-firm-challenges' },
  { slug: 'funded-trading-account-rules-checklist', title: 'Funded Trading Account Rules Checklist', category: 'prop-firm-rules' },
  { slug: 'what-is-a-drawdown-in-trading', title: 'What Is a Drawdown in Trading?', category: 'trading-education' },
];

const jobs = [];

// Default brand reference = the bundled real logo. Pass --brand-ref <path|url>
// to override, or --no-logo to skip the reference entirely (AI draws wordmark).
const DEFAULT_LOGO = resolve(ROOT_DIR, 'assets', 'brand', 'tradersyard-logo.png');
let brandRefPath = args['brand-ref'] || (args['no-logo'] ? null : DEFAULT_LOGO);
if (brandRefPath && !/^https?:\/\//.test(brandRefPath) && !existsSync(brandRefPath)) {
  printError(`Brand reference not found: ${brandRefPath}`);
  process.exit(1);
}

if (args.samples) {
  jobs.push(...SAMPLE_SET);
} else if (args.file) {
  const fp = resolve(args.file);
  if (!existsSync(fp)) { printError(`File not found: ${fp}`); process.exit(1); }
  const { frontmatter } = parseFile(fp);
  jobs.push({
    slug: frontmatter.slug || basename(fp, '.md'),
    title: frontmatter.title || basename(fp, '.md').replace(/-/g, ' '),
    category: frontmatter.category || 'default',
  });
} else if (args.slug) {
  jobs.push({ slug: args.slug, title: args.title || args.slug.replace(/-/g, ' '), category: args.category || 'default' });
} else {
  console.log('Usage:');
  console.log('  node scripts/thumbnail-nano.mjs --samples [--dry-run]');
  console.log('  node scripts/thumbnail-nano.mjs --slug <slug> --title <t> --category <c>');
  console.log('  node scripts/thumbnail-nano.mjs --file content/drafts/slug.md');
  console.log('  Optional: --brand-ref <logo-path-or-url>');
  process.exit(0);
}

printHeader('Thumbnail Generator — Nano Banana');
printInfo('Model: fal-ai/nano-banana | 16:9 | text-forward branded cards');
printInfo(`Cost: ~$${(jobs.length * 0.039).toFixed(2)} for ${jobs.length} image(s)`);

// Upload the logo ONCE and reuse the URL for every image.
let brandRefUrl = null;
if (brandRefPath && !args['dry-run']) {
  if (/^https?:\/\//.test(brandRefPath)) {
    brandRefUrl = brandRefPath;
    printInfo(`Brand reference (url): ${brandRefUrl}`);
  } else {
    printInfo(`Uploading logo reference: ${brandRefPath}`);
    try {
      brandRefUrl = await uploadToFal(brandRefPath);
      printSuccess(`Logo uploaded → ${brandRefUrl}`);
    } catch (err) {
      printError(`Logo upload failed (${err.message}). Falling back to AI-drawn wordmark.`);
      brandRefUrl = null;
    }
  }
}
const hasLogo = !!brandRefUrl;
console.log('');

ensureDir(OUT_DIR);

let success = 0, failed = 0;
for (let i = 0; i < jobs.length; i++) {
  const job = jobs[i];
  const prompt = buildPrompt(job, hasLogo || (args['dry-run'] && !!brandRefPath));
  const seed = seedFromSlug(job.slug);

  printSection(`[${i + 1}/${jobs.length}] ${job.slug}`);
  printInfo(`Category: ${job.category} | seed: ${seed} | logo-ref: ${hasLogo ? 'yes' : 'no'}`);
  printInfo(`Headline: "${toHeadline(job.title)}"`);

  if (args['dry-run']) {
    console.log(`\n${prompt}\n`);
    continue;
  }

  try {
    const start = Date.now();
    const url = await generateImage(prompt, seed, brandRefUrl);
    const out = resolve(OUT_DIR, `${job.slug}.png`);
    await downloadImage(url, out);
    printSuccess(`${((Date.now() - start) / 1000).toFixed(1)}s → ${out}`);
    success++;
  } catch (err) {
    printError(`Failed: ${err.message}`);
    failed++;
  }
  if (i < jobs.length - 1) await new Promise(r => setTimeout(r, 400));
}

printSection('Summary');
printInfo(`Generated: ${success}/${jobs.length}`);
if (failed) printError(`Failed: ${failed}`);
printInfo(`Output: ${OUT_DIR}`);
console.log('');
