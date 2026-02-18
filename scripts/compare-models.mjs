#!/usr/bin/env node
/**
 * Compare FLUX vs Ideogram image generation
 * Generates the same prompts with both models for side-by-side comparison
 */

import { resolve } from 'path';
import { createWriteStream } from 'fs';
import { get as httpsGet } from 'https';
import { FAL_KEY, OUTPUT_DIR } from '../lib/config.mjs';
import { ensureDir } from '../lib/utils.mjs';

const COMPARE_DIR = resolve(OUTPUT_DIR, 'image-comparison');
ensureDir(COMPARE_DIR);

// The exact 5 prompts used for the live blog article
const prompts = [
  {
    label: '1-challenge',
    heading: 'Understanding Prop Firm Challenges',
    prompt: 'Determined trader studying charts late at night with multiple screens, cup of coffee, focused concentration, moody desk lamp lighting. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.',
  },
  {
    label: '2-math-reality',
    heading: 'The Mathematical Reality',
    prompt: 'Trader analyzing financial data on laptop with coffee nearby, modern minimalist workspace, natural window light. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.',
  },
  {
    label: '3-risk-management',
    heading: 'Risk Management Is Your Foundation',
    prompt: 'Trader carefully reviewing risk management dashboard on monitor, stop-loss orders highlighted on screen, focused expression, professional office setting. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.',
  },
  {
    label: '4-strategy',
    heading: 'Strategy and Consistency',
    prompt: 'Person drawing trading strategy flowchart on whiteboard with markers, laptop open on desk showing charts, bright modern workspace. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.',
  },
  {
    label: '5-psychology',
    heading: 'Psychology and Discipline',
    prompt: 'Person at a clean desk with dual monitors showing stock market charts and technical indicators, ambient blue lighting. Professional stock photography, sharp focus, high resolution, no text or watermarks, no logos.',
  },
];

// --- FLUX.1 [schnell] ---
async function generateFlux(prompt) {
  const res = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'landscape_4_3',
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
      output_format: 'png',
    }),
  });
  if (!res.ok) throw new Error(`FLUX error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.images[0].url;
}

// --- Ideogram v3 ---
async function generateIdeogram(prompt) {
  const res = await fetch('https://fal.run/fal-ai/ideogram/v3', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '4:3',
      style: 'AUTO',
      num_images: 1,
    }),
  });
  if (!res.ok) throw new Error(`Ideogram error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.images[0].url;
}

// --- Download ---
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const download = (downloadUrl) => {
      const mod = downloadUrl.startsWith('https') ? httpsGet : httpsGet;
      mod(downloadUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          download(response.headers.location);
          return;
        }
        const file = createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      }).on('error', reject);
    };
    download(url);
  });
}

// --- Main ---
console.log('🎨 Model Comparison: FLUX.1 [schnell] vs Ideogram v3');
console.log(`   Generating ${prompts.length} images × 2 models = ${prompts.length * 2} total`);
console.log(`   FLUX cost: ~$${(prompts.length * 0.003).toFixed(3)}`);
console.log(`   Ideogram cost: ~$${(prompts.length * 0.04).toFixed(2)}`);
console.log(`   Output: ${COMPARE_DIR}\n`);

for (let i = 0; i < prompts.length; i++) {
  const { label, heading, prompt } = prompts[i];
  console.log(`[${i + 1}/${prompts.length}] ${heading}`);
  console.log(`   Prompt: ${prompt.slice(0, 80)}...`);

  // Generate both in parallel
  try {
    const [fluxUrl, ideoUrl] = await Promise.all([
      generateFlux(prompt).then(url => {
        console.log(`   ✅ FLUX done`);
        return url;
      }),
      generateIdeogram(prompt).then(url => {
        console.log(`   ✅ Ideogram done`);
        return url;
      }),
    ]);

    // Download both
    const fluxPath = resolve(COMPARE_DIR, `${label}-flux.png`);
    const ideoPath = resolve(COMPARE_DIR, `${label}-ideogram.png`);

    await Promise.all([
      downloadImage(fluxUrl, fluxPath),
      downloadImage(ideoUrl, ideoPath),
    ]);

    console.log(`   📁 Saved: ${label}-flux.png & ${label}-ideogram.png\n`);
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}\n`);
  }

  // Small delay between pairs
  if (i < prompts.length - 1) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log('\n✅ Done! Compare images in:');
console.log(`   ${COMPARE_DIR}`);
