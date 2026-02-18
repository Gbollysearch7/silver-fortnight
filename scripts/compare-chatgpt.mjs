#!/usr/bin/env node
/**
 * Generate images with ChatGPT gpt-image-1-mini via fal.ai
 * Creates contextually appropriate images for each blog section
 * Output: landscape (1536x1024) for blog use
 */

import { resolve } from 'path';
import { createWriteStream } from 'fs';
import { get as httpsGet } from 'https';
import { FAL_KEY, OUTPUT_DIR } from '../lib/config.mjs';
import { ensureDir } from '../lib/utils.mjs';

if (!FAL_KEY) {
  console.error('FAL_KEY not set in .env');
  process.exit(1);
}

const COMPARE_DIR = resolve(OUTPUT_DIR, 'image-comparison');
ensureDir(COMPARE_DIR);

// Contextually rich prompts — designed to visually represent each section's actual content
const prompts = [
  {
    label: '1-challenge',
    heading: 'Understanding Prop Firm Challenges',
    prompt: 'A dramatic wide-angle photograph of a professional trader\'s workspace at night. Three monitors display different trading charts — one showing a countdown timer representing a challenge deadline, another showing a profit/loss tracker near a target line, and the third showing live candlestick charts. A notebook with "Challenge Rules" written on it sits open beside the keyboard. The scene is lit by the blue glow of the screens and a single warm desk lamp. The mood conveys determination and focus. Photorealistic, cinematic lighting, shallow depth of field.',
  },
  {
    label: '2-math-reality',
    heading: 'The Mathematical Reality: Why Most Traders Fail',
    prompt: 'A clean overhead flat-lay photograph of a trader\'s desk showing the mathematical side of trading. A large notebook is open with handwritten calculations showing risk-reward ratios, win rates, and expected value formulas. Next to it, a calculator displays numbers, and a printed chart shows a bell curve distribution of trading outcomes with the losing side highlighted in red and the winning side in green. A coffee cup and pen complete the scene. Clean editorial photography style, warm natural lighting from above.',
  },
  {
    label: '3-risk-management',
    heading: 'Risk Management Is Your Foundation',
    prompt: 'A professional trader\'s monitor showing a trading chart with clearly marked stop-loss levels as red horizontal lines and take-profit levels as green lines. A position size calculator is visible in a smaller window. The trader\'s hand rests confidently on the mouse. The desk is immaculately organized — everything in its place. The overall mood conveys control, protection, and disciplined risk management. Cool blue and grey tones, professional photography, sharp focus.',
  },
  {
    label: '4-strategy',
    heading: 'Strategy and Consistency Trump Aggression',
    prompt: 'A split-composition photograph contrasting two trading approaches side by side. On the left: a calm organized desk with a clean trading journal, a single monitor showing a methodical chart with few well-placed trades and a steady equity curve going up gradually. On the right side slightly darker: a chaotic desk with multiple aggressive trades on screen, red losses on the chart, and an equity curve that spikes up then crashes. The image tells the story that slow and steady consistency wins over aggression. Editorial photography, cinematic lighting.',
  },
  {
    label: '5-psychology',
    heading: 'Psychology and Discipline Win Challenges',
    prompt: 'A powerful close-up photograph of a trader sitting calmly at their desk with eyes closed in a moment of mindful composure, while trading screens glow softly in the background showing an open position. Their hands rest flat on the desk, not touching the mouse, conveying the discipline of not overtrading. The screens show a losing trade but the trader remains composed and disciplined. Warm side lighting, shallow depth of field focused on the face, monitors beautifully blurred in background. Photorealistic, emotional, editorial quality.',
  },
];

async function generateImage(prompt) {
  const res = await fetch('https://fal.run/fal-ai/gpt-image-1-mini', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: '1536x1024',
      quality: 'medium',
      output_format: 'png',
      num_images: 1,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai gpt-image-1-mini error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  if (data.images && data.images[0]) {
    return data.images[0].url;
  }
  throw new Error('No image returned');
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const download = (downloadUrl) => {
      httpsGet(downloadUrl, (response) => {
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
console.log('🎨 ChatGPT gpt-image-1-mini (via fal.ai) — Contextual Blog Images');
console.log(`   Generating ${prompts.length} landscape images (1536x1024)`);
console.log(`   Output: ${COMPARE_DIR}\n`);

let success = 0;
let failed = 0;

for (let i = 0; i < prompts.length; i++) {
  const { label, heading, prompt } = prompts[i];
  console.log(`[${i + 1}/${prompts.length}] ${heading}`);
  console.log(`   Prompt: ${prompt.slice(0, 90)}...`);

  try {
    const start = Date.now();
    const imageUrl = await generateImage(prompt);
    const duration = ((Date.now() - start) / 1000).toFixed(1);

    const filePath = resolve(COMPARE_DIR, `${label}-chatgpt.png`);
    await downloadImage(imageUrl, filePath);

    console.log(`   ✅ Done in ${duration}s — ${label}-chatgpt.png\n`);
    success++;
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}\n`);
    failed++;
  }

  // Rate limit delay
  if (i < prompts.length - 1) {
    await new Promise(r => setTimeout(r, 1000));
  }
}

console.log(`\n✅ Done! Generated: ${success}/${prompts.length}`);
if (failed > 0) console.log(`❌ Failed: ${failed}`);
console.log(`📁 Output: ${COMPARE_DIR}`);
